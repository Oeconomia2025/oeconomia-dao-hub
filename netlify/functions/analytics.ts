import type { Handler } from '@netlify/functions';
import { createPublicClient, http, formatUnits, type Address } from 'viem';
import { sepolia } from 'viem/chains';

/**
 * Real Oeconomia analytics, read from Sepolia.
 *
 * Time series: one multicall per point at a past block, reading every Eloqura pair
 * (reserves, LP supply, cumulative fee counters), every staking pool, and Alluria's
 * system stats. Wallet/staker counts come from token transfers into protocol contracts
 * (alchemy_getAssetTransfers). USD values for pools and staking use current prices;
 * Alluria collateral uses its own oracle price at each block.
 *
 * GET /.netlify/functions/analytics?range=7|30|90|365
 */

const RPC_URL =
  process.env.ALCHEMY_SEPOLIA_URL || 'https://eth-sepolia.g.alchemy.com/v2/esuQ5PPGg8-Sr5-X-P-JT';
const BLOCKS_PER_DAY = 7200;
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11' as Address;
const CACHE_MS = 10 * 60_000;

const C = {
  factory: '0x1a4C7849Dd8f62AefA082360b3A8D857952B3b8e',
  router: '0x3f42823d998EE4759a95a42a6e3bB7736B76A7AE',
  staking: '0xd12664c1f09fa1561b5f952259d1eb5555af3265',
  lens: '0x150485AC97153Ac772D43736564ccf7122d92bcf',
  troveManager: '0x90CCA7d8B6cAb91d53e384E3c0cD3Ba34b7B8Cc2',
  stabilityPool: '0xB61a71C78e10C0C92e2dFF457C9F87dC71260c43',
  collateralManager: '0x6423C894371992594a7fE8e2e0E65BEF4EE5cABb',
  usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  alud: '0x41B07704b9d671615A3E9f83c06D85CB38bbf4D9',
} as const;

const u256 = { type: 'uint256' } as const;
const ABI = {
  factory: [
    { name: 'allPairsLength', type: 'function', stateMutability: 'view', inputs: [], outputs: [u256] },
    { name: 'allPairs', type: 'function', stateMutability: 'view', inputs: [u256], outputs: [{ type: 'address' }] },
  ],
  pair: [
    { name: 'token0', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
    { name: 'token1', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
    { name: 'getReserves', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint112' }, { type: 'uint112' }, { type: 'uint32' }] },
    { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [u256] },
    { name: 'feeGrowthGlobal0X128', type: 'function', stateMutability: 'view', inputs: [], outputs: [u256] },
    { name: 'feeGrowthGlobal1X128', type: 'function', stateMutability: 'view', inputs: [], outputs: [u256] },
    { name: 'swapFeeBps', type: 'function', stateMutability: 'view', inputs: [], outputs: [u256] },
  ],
  erc20: [
    { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
    { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  ],
  staking: [
    { name: 'poolCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [u256] },
    { name: 'getPoolInfo', type: 'function', stateMutability: 'view', inputs: [u256],
      outputs: [{ type: 'address' }, { type: 'address' }, u256, u256, u256, u256, u256] },
  ],
  lens: [
    { name: 'getSystemStats', type: 'function', stateMutability: 'view', inputs: [],
      outputs: [{ type: 'tuple', components: [
        { name: 'totalALUDSupply', ...u256 }, { name: 'totalCollateralValueUSD', ...u256 },
        { name: 'stabilityPoolDeposits', ...u256 }, { name: 'oecVaultBalance', ...u256 }, { name: 'oecTotalReleased', ...u256 },
      ] }] },
    { name: 'getCollateralStats', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }],
      outputs: [{ type: 'tuple', components: [
        { name: 'collateral', type: 'address' }, { name: 'totalCollateral', ...u256 }, { name: 'totalDebt', ...u256 },
        { name: 'totalCollateralValueUSD', ...u256 }, { name: 'price', ...u256 },
        { name: 'minCollateralRatio', ...u256 }, { name: 'liquidationRatio', ...u256 },
      ] }] },
  ],
  collateralManager: [
    { name: 'getSupportedCollaterals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address[]' }] },
  ],
  multicall: [
    { name: 'getCurrentBlockTimestamp', type: 'function', stateMutability: 'view', inputs: [], outputs: [u256] },
  ],
} as const;

const client = createPublicClient({ chain: sepolia, transport: http(RPC_URL, { batch: true }) });
const cache = new Map<string, { at: number; body: string }>();
const Q128 = 2n ** 128n;
const lc = (a: string) => a.toLowerCase();

type Res = { status: 'success'; result: any } | { status: 'failure'; error: unknown };

interface Snap {
  time: number;
  pairs: Record<string, { r0: bigint; r1: bigint; supply: bigint; fg0: bigint | null; fg1: bigint | null; feeBps: number } | null>;
  pools: ({ staked: bigint; aprBps: number } | null)[];
  system: { alud: number; collateralUsd: number; sp: number } | null;
}

async function snapshot(block: bigint, pairs: Address[], poolCount: number): Promise<Snap | null> {
  const contracts: any[] = [];
  for (const p of pairs) {
    for (const fn of ['getReserves', 'totalSupply', 'feeGrowthGlobal0X128', 'feeGrowthGlobal1X128', 'swapFeeBps']) {
      contracts.push({ address: p, abi: ABI.pair, functionName: fn });
    }
  }
  for (let i = 0; i < poolCount; i++) {
    contracts.push({ address: C.staking, abi: ABI.staking, functionName: 'getPoolInfo', args: [BigInt(i)] });
  }
  contracts.push({ address: C.lens, abi: ABI.lens, functionName: 'getSystemStats' });
  contracts.push({ address: MULTICALL3, abi: ABI.multicall, functionName: 'getCurrentBlockTimestamp' });

  let r: Res[];
  try {
    r = (await client.multicall({ allowFailure: true, blockNumber: block, multicallAddress: MULTICALL3, contracts })) as Res[];
  } catch {
    return null;
  }
  const ts = r[r.length - 1];
  if (ts.status !== 'success') return null;

  const snap: Snap = { time: Number(ts.result), pairs: {}, pools: [], system: null };
  pairs.forEach((p, i) => {
    const [res, sup, f0, f1, fee] = r.slice(i * 5, i * 5 + 5);
    snap.pairs[lc(p)] = res.status === 'success' && sup.status === 'success'
      ? {
          r0: res.result[0], r1: res.result[1], supply: sup.result,
          fg0: f0.status === 'success' ? f0.result : null,
          fg1: f1.status === 'success' ? f1.result : null,
          feeBps: fee.status === 'success' ? Number(fee.result) : 30,
        }
      : null;
  });
  const base = pairs.length * 5;
  for (let i = 0; i < poolCount; i++) {
    const p = r[base + i];
    snap.pools.push(p.status === 'success' ? { staked: p.result[4], aprBps: Number(p.result[2]) } : null);
  }
  const sys = r[base + poolCount];
  if (sys.status === 'success') {
    snap.system = {
      alud: Number(formatUnits(sys.result.totalALUDSupply, 18)),
      collateralUsd: Number(formatUnits(sys.result.totalCollateralValueUSD, 18)),
      sp: Number(formatUnits(sys.result.stabilityPoolDeposits, 18)),
    };
  }
  return snap;
}

/** First time each address sent tokens into any of `targets` (unix seconds). */
async function firstSeen(targets: string[], exclude: Set<string>): Promise<Map<string, number>> {
  const seen = new Map<string, number>();
  await Promise.all(targets.map(async (to) => {
    let pageKey: string | undefined;
    for (let page = 0; page < 20; page++) {
      const res = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 1, jsonrpc: '2.0', method: 'alchemy_getAssetTransfers',
          params: [{ fromBlock: '0x0', toBlock: 'latest', toAddress: to, category: ['erc20'],
            excludeZeroValue: true, withMetadata: true, order: 'asc', maxCount: '0x3e8', ...(pageKey ? { pageKey } : {}) }],
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      for (const t of json.result.transfers as { from: string; metadata?: { blockTimestamp?: string } }[]) {
        const from = lc(t.from);
        if (exclude.has(from)) continue;
        const at = t.metadata?.blockTimestamp ? Date.parse(t.metadata.blockTimestamp) / 1000 : 0;
        if (!seen.has(from) || at < seen.get(from)!) seen.set(from, at);
      }
      pageKey = json.result.pageKey;
      if (!pageKey) break;
    }
  }));
  return seen;
}

async function build(rangeDays: number) {
  const latest = await client.getBlockNumber();

  // ── Static structure: pairs, tokens, pools, collaterals ──
  const pairCount = Number(await client.readContract({ address: C.factory, abi: ABI.factory, functionName: 'allPairsLength' }));
  const pairs = (await client.multicall({
    allowFailure: false,
    contracts: Array.from({ length: pairCount }, (_, i) => ({ address: C.factory, abi: ABI.factory, functionName: 'allPairs' as const, args: [BigInt(i)] as const })),
  })) as Address[];
  const tokenPairs = (await client.multicall({
    allowFailure: false,
    contracts: pairs.flatMap((p) => [
      { address: p, abi: ABI.pair, functionName: 'token0' as const },
      { address: p, abi: ABI.pair, functionName: 'token1' as const },
    ]),
  })) as Address[];
  const pairTokens = pairs.map((_, i) => [lc(tokenPairs[i * 2]), lc(tokenPairs[i * 2 + 1])] as const);
  const tokenAddrs = [...new Set(pairTokens.flat())];
  const meta = await client.multicall({
    allowFailure: true,
    contracts: tokenAddrs.flatMap((t) => [
      { address: t as Address, abi: ABI.erc20, functionName: 'symbol' as const },
      { address: t as Address, abi: ABI.erc20, functionName: 'decimals' as const },
    ]),
  });
  const tokens: Record<string, { symbol: string; decimals: number }> = {};
  tokenAddrs.forEach((t, i) => {
    const s = meta[i * 2], d = meta[i * 2 + 1];
    tokens[t] = {
      symbol: s.status === 'success' ? String(s.result) : `${t.slice(0, 6)}...`,
      decimals: d.status === 'success' ? Number(d.result) : 18,
    };
  });

  const poolCount = Number(await client.readContract({ address: C.staking as Address, abi: ABI.staking, functionName: 'poolCount' }));
  const poolInfo = poolCount ? await client.multicall({
    allowFailure: true,
    contracts: Array.from({ length: poolCount }, (_, i) => ({ address: C.staking as Address, abi: ABI.staking, functionName: 'getPoolInfo' as const, args: [BigInt(i)] as const })),
  }) : [];
  const stakeTokens = poolInfo.map((p) => (p.status === 'success' ? lc((p.result as any)[0]) : ''));
  for (const t of stakeTokens) {
    if (t && !tokens[t]) {
      const [s, d] = await client.multicall({ allowFailure: true, contracts: [
        { address: t as Address, abi: ABI.erc20, functionName: 'symbol' },
        { address: t as Address, abi: ABI.erc20, functionName: 'decimals' },
      ] });
      tokens[t] = { symbol: s.status === 'success' ? String(s.result) : 'TOKEN', decimals: d.status === 'success' ? Number(d.result) : 18 };
    }
  }

  const collaterals = (await client.readContract({ address: C.collateralManager as Address, abi: ABI.collateralManager, functionName: 'getSupportedCollaterals' }).catch(() => [])) as Address[];
  const collStats = collaterals.length ? await client.multicall({
    allowFailure: true,
    contracts: collaterals.map((c) => ({ address: C.lens as Address, abi: ABI.lens, functionName: 'getCollateralStats' as const, args: [c] as const })),
  }) : [];
  const collMeta = collaterals.length ? await client.multicall({
    allowFailure: true,
    contracts: collaterals.map((c) => ({ address: c, abi: ABI.erc20, functionName: 'symbol' as const })),
  }) : [];

  // ── Current USD prices: stables at $1, collateral from Alluria's oracle, the rest via pools ──
  const price: Record<string, number> = { [lc(C.usdc)]: 1, [lc(C.alud)]: 1 };
  collaterals.forEach((c, i) => {
    const s = collStats[i];
    if (s?.status === 'success') price[lc(c)] = Number(formatUnits((s.result as any).price, 18));
  });

  // ── Time series ──
  const points = rangeDays <= 7 ? 28 : 30;
  const step = Math.floor((rangeDays * BLOCKS_PER_DAY) / points);
  const blocks = Array.from({ length: points + 1 }, (_, i) => latest - BigInt(step * (points - i))).filter((b) => b > 0n);
  const extra = [latest - BigInt(BLOCKS_PER_DAY), latest - BigInt(2 * BLOCKS_PER_DAY), latest - BigInt(7 * BLOCKS_PER_DAY)];
  const allSnaps = await Promise.all([...blocks, ...extra].map((b) => snapshot(b, pairs, poolCount)));
  const series = allSnaps.slice(0, blocks.length).filter((s): s is Snap => s !== null);
  const [d1, d2, d7] = allSnaps.slice(blocks.length);
  const now = series[series.length - 1];
  if (!now) throw new Error('No snapshots');

  const amt = (raw: bigint, t: string) => Number(formatUnits(raw, tokens[t]?.decimals ?? 18));
  // Fill prices from the deepest pool that pairs an unpriced token with a priced one
  for (let pass = 0; pass < 3; pass++) {
    const best: Record<string, { value: number; p: number }> = {};
    pairs.forEach((p, i) => {
      const s = now.pairs[lc(p)];
      if (!s) return;
      const [t0, t1] = pairTokens[i];
      const a0 = amt(s.r0, t0), a1 = amt(s.r1, t1);
      if (a0 <= 0 || a1 <= 0) return;
      if (price[t0] !== undefined && price[t1] === undefined) {
        const v = a0 * price[t0];
        if (!best[t1] || v > best[t1].value) best[t1] = { value: v, p: v / a1 };
      } else if (price[t1] !== undefined && price[t0] === undefined) {
        const v = a1 * price[t1];
        if (!best[t0] || v > best[t0].value) best[t0] = { value: v, p: v / a0 };
      }
    });
    for (const [t, b] of Object.entries(best)) price[t] = b.p;
  }
  const px = (t: string) => price[t] ?? 0;

  const pairTvl = (s: Snap, i: number) => {
    const st = s.pairs[lc(pairs[i])];
    if (!st) return 0;
    const [t0, t1] = pairTokens[i];
    return amt(st.r0, t0) * px(t0) + amt(st.r1, t1) * px(t1);
  };
  const pairFees = (a: Snap | null | undefined, b: Snap | null | undefined, i: number) => {
    const x = a?.pairs[lc(pairs[i])], y = b?.pairs[lc(pairs[i])];
    if (!y || y.fg0 === null || y.fg1 === null) return { fees: 0, volume: 0 };
    // Pair created after `a`: count everything it has earned so far
    const f0 = x && x.fg0 !== null ? x.fg0 : 0n, f1 = x && x.fg1 !== null ? x.fg1 : 0n;
    const supply = x ? (x.supply + y.supply) / 2n : y.supply;
    const [t0, t1] = pairTokens[i];
    const fees = amt(((y.fg0 - f0) * supply) / Q128, t0) * px(t0) + amt(((y.fg1 - f1) * supply) / Q128, t1) * px(t1);
    return { fees, volume: fees / ((y.feeBps || 30) / 10_000) };
  };
  const dexTvl = (s: Snap) => pairs.reduce((sum, _, i) => sum + pairTvl(s, i), 0);
  const dexFlow = (a: Snap | null | undefined, b: Snap | null | undefined) =>
    pairs.reduce((acc, _, i) => { const f = pairFees(a, b, i); return { fees: acc.fees + f.fees, volume: acc.volume + f.volume }; }, { fees: 0, volume: 0 });
  const stakingTvl = (s: Snap) => s.pools.reduce((sum, p, i) => sum + (p ? amt(p.staked, stakeTokens[i]) * px(stakeTokens[i]) : 0), 0);
  const stakingApr = (s: Snap) => {
    let w = 0, total = 0;
    s.pools.forEach((p, i) => { if (!p) return; const v = amt(p.staked, stakeTokens[i]) * px(stakeTokens[i]); w += v * p.aprBps / 100; total += v; });
    if (total > 0) return w / total;
    const live = s.pools.filter((p): p is NonNullable<typeof p> => !!p);
    return live.length ? live.reduce((a, p) => a + p.aprBps / 100, 0) / live.length : 0;
  };

  // ── Wallets and stakers from transfers into protocol contracts ──
  const contractsSet = new Set([...pairs.map(lc), lc(C.router), lc(C.staking), lc(C.troveManager), lc(C.stabilityPool),
    lc(C.collateralManager), lc(C.factory), '0x0000000000000000000000000000000000000000']);
  const empty = () => new Map<string, number>();
  const [stakers, dexUsers, lendingUsers] = await Promise.all([
    firstSeen([C.staking], contractsSet).catch(empty),
    firstSeen(pairs, contractsSet).catch(empty),
    firstSeen([C.troveManager, C.collateralManager, C.stabilityPool], contractsSet).catch(empty),
  ]);
  // Any wallet active in any protocol, at its earliest activity
  const wallets = new Map<string, number>();
  for (const m of [stakers, dexUsers, lendingUsers]) {
    m.forEach((t, a) => { if (!wallets.has(a) || t < wallets.get(a)!) wallets.set(a, t); });
  }
  const countBy = (m: Map<string, number>, from: number, to: number) => { let n = 0; m.forEach((t) => { if (t > from && t <= to) n++; }); return n; };
  const countUntil = (m: Map<string, number>, to: number) => { let n = 0; m.forEach((t) => { if (t <= to) n++; }); return n; };

  const label = (t: number) => {
    const d = new Date(t * 1000);
    return rangeDays <= 7
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', timeZone: 'UTC' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  const out = series.map((s, i) => {
    const prev = series[i - 1];
    const flow = prev ? dexFlow(prev, s) : { fees: 0, volume: 0 };
    const sys = s.system;
    return {
      date: label(s.time),
      ts: s.time,
      dexTvl: dexTvl(s),
      stakingTvl: stakingTvl(s),
      lendingTvl: sys?.collateralUsd ?? 0,
      volume: prev ? flow.volume : null,
      fees: prev ? flow.fees : null,
      apr: stakingApr(s),
      aludSupply: sys?.alud ?? 0,
      collateralUsd: sys?.collateralUsd ?? 0,
      collateralRatio: sys && sys.alud > 0 ? (sys.collateralUsd / sys.alud) * 100 : null,
      spDeposits: sys?.sp ?? 0,
      wallets: countUntil(wallets, s.time),
      newWallets: prev ? countBy(wallets, prev.time, s.time) : 0,
      newStakers: prev ? countBy(stakers, prev.time, s.time) : 0,
    };
  }).slice(1); // first point only anchors the interval math

  const first = series[0];
  const flow24 = dexFlow(d1, now), flowPrev24 = dexFlow(d2, d1), flowRange = dexFlow(first, now);
  const tvlAt = (s: Snap | null | undefined) => s ? dexTvl(s) + stakingTvl(s) + (s.system?.collateralUsd ?? 0) : 0;
  const pct = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : null);
  const weekAgo = d7 ?? first;

  const pairRows = pairs.map((p, i) => {
    const [t0, t1] = pairTokens[i];
    const f = pairFees(first, now, i);
    return { pair: `${tokens[t0]?.symbol}/${tokens[t1]?.symbol}`, address: p, tvl: pairTvl(now, i), volume: f.volume, fees: f.fees };
  }).filter((r) => r.tvl > 0.01 || r.volume > 0).sort((a, b) => b.volume - a.volume || b.tvl - a.tvl);

  const poolRows = now.pools.map((p, i) => p && {
    id: i, token: tokens[stakeTokens[i]]?.symbol ?? 'TOKEN',
    staked: amt(p.staked, stakeTokens[i]), stakedUsd: amt(p.staked, stakeTokens[i]) * px(stakeTokens[i]),
    apr: p.aprBps / 100,
    lockDays: poolInfo[i]?.status === 'success' ? Number((poolInfo[i].result as any)[3]) / 86400 : 0,
  }).filter(Boolean);

  const collRows = collaterals.map((c, i) => {
    const s = collStats[i];
    if (s?.status !== 'success') return null;
    const r = s.result as any;
    return {
      symbol: collMeta[i]?.status === 'success' ? String(collMeta[i].result) : `${c.slice(0, 6)}...`,
      collateralUsd: Number(formatUnits(r.totalCollateralValueUSD, 18)),
      debt: Number(formatUnits(r.totalDebt, 18)),
    };
  }).filter(Boolean);

  const sys = now.system;
  const totals = {
    tvl: tvlAt(now), tvlChange7d: pct(tvlAt(now), tvlAt(weekAgo)),
    dexTvl: dexTvl(now), dexTvlChange7d: weekAgo ? pct(dexTvl(now), dexTvl(weekAgo)) : null,
    stakingTvl: stakingTvl(now), stakingTvlChange7d: weekAgo ? pct(stakingTvl(now), stakingTvl(weekAgo)) : null,
    lendingTvl: sys?.collateralUsd ?? 0, lendingTvlChange7d: weekAgo?.system ? pct(sys?.collateralUsd ?? 0, weekAgo.system.collateralUsd) : null,
    volume24h: flow24.volume, volume24hChange: pct(flow24.volume, flowPrev24.volume),
    fees24h: flow24.fees, feesRange: flowRange.fees, volumeRange: flowRange.volume,
    wallets: wallets.size, walletsChange7d: pct(wallets.size, countUntil(wallets, weekAgo?.time ?? now.time)),
    stakers: stakers.size, stakersChange7d: pct(stakers.size, countUntil(stakers, weekAgo?.time ?? now.time)),
    avgApr: stakingApr(now),
    aludSupply: sys?.alud ?? 0, aludChange7d: weekAgo?.system ? pct(sys?.alud ?? 0, weekAgo.system.alud) : null,
    collateralRatio: sys && sys.alud > 0 ? (sys.collateralUsd / sys.alud) * 100 : null,
    spDeposits: sys?.sp ?? 0, spChange7d: weekAgo?.system ? pct(sys?.sp ?? 0, weekAgo.system.sp) : null,
    pairsCount: pairRows.length, poolsCount: poolRows.length,
    dexUsers: dexUsers.size, lendingUsers: lendingUsers.size,
    dexFeeApr: dexTvl(now) > 0 && series.length > 1
      ? (flowRange.fees / dexTvl(now)) * (365 * 86400 / Math.max(1, now.time - first.time)) * 100 : null,
  };

  return { range: rangeDays, updatedAt: new Date().toISOString(), points: out, totals, pairs: pairRows, stakingPools: poolRows, collaterals: collRows };
}

export const handler: Handler = async (event) => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const requested = Number(event.queryStringParameters?.range ?? 30);
  const range = [7, 30, 90, 365].includes(requested) ? requested : 30;
  const key = String(range);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { statusCode: 200, headers, body: hit.body };

  try {
    const body = JSON.stringify(await build(range));
    cache.set(key, { at: Date.now(), body });
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=60',
        'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=600, stale-while-revalidate=3600',
      },
      body,
    };
  } catch (error) {
    console.error('analytics failed', error);
    return { statusCode: 502, headers, body: JSON.stringify({ message: 'Failed to load analytics', error: error instanceof Error ? error.message : String(error) }) };
  }
};
