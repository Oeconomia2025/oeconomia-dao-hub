import { useState, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { Layout } from "@/components/layout";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
} from "recharts";

// ─── Data ──────────────────────────────────────────────────────────
// Everything comes from the `analytics` Netlify function, which reads Sepolia directly
// (Eloqura pools, OEC staking, Alluria) and caches for 10 minutes.

const DATE_RANGES = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "1 Year"] as const;
const RANGE_DAYS: Record<DateRange, number> = { "Last 7 Days": 7, "Last 30 Days": 30, "Last 90 Days": 90, "1 Year": 365 };
const RANGE_SHORT: Record<DateRange, string> = { "Last 7 Days": "7d", "Last 30 Days": "30d", "Last 90 Days": "90d", "1 Year": "1y" };
const PROTOCOLS = ["All", "Staking", "DEX", "Bridge", "Lending", "NFT"] as const;
type DateRange = (typeof DATE_RANGES)[number];
type Protocol = (typeof PROTOCOLS)[number];

interface Point {
  date: string;
  ts: number;
  dexTvl: number;
  stakingTvl: number;
  lendingTvl: number;
  volume: number | null;
  fees: number | null;
  apr: number;
  aludSupply: number;
  collateralUsd: number;
  collateralRatio: number | null;
  spDeposits: number;
  wallets: number;
  newWallets: number;
  newStakers: number;
}

interface AnalyticsData {
  updatedAt: string;
  points: Point[];
  totals: {
    tvl: number; tvlChange7d: number | null;
    dexTvl: number; dexTvlChange7d: number | null;
    stakingTvl: number; stakingTvlChange7d: number | null;
    lendingTvl: number; lendingTvlChange7d: number | null;
    volume24h: number; volume24hChange: number | null;
    fees24h: number; feesRange: number; volumeRange: number;
    wallets: number; walletsChange7d: number | null;
    stakers: number; stakersChange7d: number | null;
    avgApr: number;
    aludSupply: number; aludChange7d: number | null;
    collateralRatio: number | null;
    spDeposits: number; spChange7d: number | null;
    pairsCount: number; poolsCount: number;
    dexUsers: number; lendingUsers: number; dexFeeApr: number | null;
  };
  pairs: { pair: string; tvl: number; volume: number; fees: number }[];
  stakingPools: { id: number; token: string; staked: number; stakedUsd: number; apr: number; lockDays: number }[];
  collaterals: { symbol: string; collateralUsd: number; debt: number }[];
}

async function fetchAnalytics(days: number): Promise<AnalyticsData> {
  const res = await fetch(`/.netlify/functions/analytics?range=${days}`);
  if (!res.ok) throw new Error(`analytics ${res.status}`);
  return res.json();
}

// ─── Formatting ────────────────────────────────────────────────────

function usd(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v) || v === 0) return "$0";
  const a = Math.abs(v);
  if (a >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  if (a >= 1) return `$${v.toFixed(2)}`;
  return a < 0.01 ? "<$0.01" : `$${v.toFixed(2)}`;
}
const axisUsd = (v: number) => (v === 0 ? "$0" : usd(v).replace(".00", ""));
const pct = (v: number | null | undefined) => (v === null || v === undefined ? "-" : v === 0 ? "0%" : `${v.toFixed(v < 10 ? 2 : 1)}%`);
const num = (v: number) => v.toLocaleString();

// ─── KPI Card ──────────────────────────────────────────────────────

function KPICard({ label, value, change }: { label: string; value: string; change?: number | null }) {
  const show = change !== null && change !== undefined && Number.isFinite(change);
  const isPositive = (change ?? 0) >= 0;
  return (
    <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
      <div className="relative z-10">
        <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">{label}</p>
        <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
          <span className="text-xl sm:text-2xl font-bold text-white">{value}</span>
          {show && (
            <span
              title="Change over the last 7 days"
              className={`text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                isPositive ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {isPositive ? "+" : ""}
              {change!.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Chart Card Wrapper ────────────────────────────────────────────

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card className="p-4 border border-gray-700 bg-[#030712] rounded-lg shadow-md shadow-black/50 relative overflow-hidden">
      <div className="relative z-10">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="h-[205px]">{children}</div>
      </div>
    </Card>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="h-full flex items-center justify-center text-center text-gray-500 text-sm px-6">{children}</div>;
}

const chartTooltipStyle = {
  backgroundColor: "#0d1219",
  border: "1px solid #1e2733",
  borderRadius: "6px",
  color: "#e6edf3",
  fontSize: "12px",
};
const chartMargin = { top: 0, right: 5, bottom: 0, left: -5 };
const axisProps = { stroke: "#6b7280", fontSize: 10, tickLine: false } as const;

function Gradient({ id, color }: { id: string; color: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={0.6} />
      <stop offset="100%" stopColor={color} stopOpacity={0.05} />
    </linearGradient>
  );
}

// ─── Protocol views ────────────────────────────────────────────────

function StakingView({ d }: { d: AnalyticsData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <ChartCard title="Staked TVL Over Time" subtitle="Valued at current OEC price">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={d.points} margin={chartMargin}>
            <defs><Gradient id="gradStakingTVL" color="#06b6d4" /></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" {...axisProps} minTickGap={20} />
            <YAxis {...axisProps} tickFormatter={axisUsd} width={55} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [usd(v), "Staked"]} />
            <Area type="monotone" dataKey="stakingTvl" stroke="#06b6d4" fill="url(#gradStakingTVL)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="APR Trend" subtitle="Pool APRs weighted by amount staked">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={d.points} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" {...axisProps} minTickGap={20} />
            <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} width={45} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [pct(v), "APR"]} />
            <Line type="monotone" dataKey="apr" stroke="#06b6d4" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#06b6d4" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="New Stakers" subtitle="First-time stakers per period">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={d.points} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" {...axisProps} minTickGap={20} />
            <YAxis {...axisProps} allowDecimals={false} width={35} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [num(v), "New stakers"]} />
            <Bar dataKey="newStakers" fill="#06b6d4" radius={[3, 3, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Staked by Pool" subtitle="Current amount staked in each pool">
        {d.stakingPools.length === 0 ? <Empty>No staking pools yet.</Empty> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={d.stakingPools.map((p) => ({ ...p, label: `#${p.id} ${p.token}${p.lockDays ? ` · ${Math.round(p.lockDays)}d` : " · flexible"}` }))}
              margin={chartMargin}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" {...axisProps} interval={0} />
              <YAxis {...axisProps} tickFormatter={axisUsd} width={55} />
              <Tooltip contentStyle={chartTooltipStyle}
                formatter={(v: number, _n, item: any) => [`${usd(v)} (${item.payload.apr}% APR)`, "Staked"]} />
              <Bar dataKey="stakedUsd" fill="#22d3ee" radius={[3, 3, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function DEXView({ d, rangeShort }: { d: AnalyticsData; rangeShort: string }) {
  const volumePoints = d.points.filter((p) => p.volume !== null);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <ChartCard title="Liquidity Over Time" subtitle="Eloqura pools, valued at current prices">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={d.points} margin={chartMargin}>
            <defs><Gradient id="gradDEXLiq" color="#8b5cf6" /></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" {...axisProps} minTickGap={20} />
            <YAxis {...axisProps} tickFormatter={axisUsd} width={55} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [usd(v), "Liquidity"]} />
            <Area type="monotone" dataKey="dexTvl" stroke="#8b5cf6" fill="url(#gradDEXLiq)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Swap Volume" subtitle="From fees each pool earned">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={volumePoints} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" {...axisProps} minTickGap={20} />
            <YAxis {...axisProps} tickFormatter={axisUsd} width={55} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [usd(v), "Volume"]} />
            <Bar dataKey="volume" fill="#8b5cf6" radius={[3, 3, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={`Top Pairs by Volume (${rangeShort})`}>
        {d.pairs.length === 0 ? <Empty>No pools with liquidity yet.</Empty> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.pairs.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" {...axisProps} tickFormatter={axisUsd} />
              <YAxis type="category" dataKey="pair" {...axisProps} width={90} />
              <Tooltip contentStyle={chartTooltipStyle}
                formatter={(v: number, _n, item: any) => [`${usd(v)} (TVL ${usd(item.payload.tvl)})`, "Volume"]} />
              <Bar dataKey="volume" fill="#a78bfa" radius={[0, 3, 3, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Fee Revenue" subtitle="Trading fees earned by liquidity providers">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={volumePoints} margin={chartMargin}>
            <defs><Gradient id="gradFees" color="#10b981" /></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" {...axisProps} minTickGap={20} />
            <YAxis {...axisProps} tickFormatter={axisUsd} width={55} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [usd(v), "Fees"]} />
            <Area type="monotone" dataKey="fees" stroke="#10b981" fill="url(#gradFees)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function LendingView({ d }: { d: AnalyticsData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <ChartCard title="Collateral vs ALUD Minted" subtitle="Alluria collateral at its oracle price, and ALUD supply">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={d.points} margin={chartMargin}>
            <defs>
              <Gradient id="gradColl" color="#10b981" />
              <Gradient id="gradDebt" color="#f59e0b" />
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" {...axisProps} minTickGap={20} />
            <YAxis {...axisProps} tickFormatter={axisUsd} width={55} />
            <Tooltip contentStyle={chartTooltipStyle}
              formatter={(v: number, name: string) => [usd(v), name === "collateralUsd" ? "Collateral" : "ALUD minted"]} />
            <Area type="monotone" dataKey="collateralUsd" stroke="#10b981" fill="url(#gradColl)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="aludSupply" stroke="#f59e0b" fill="url(#gradDebt)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="System Collateral Ratio" subtitle="Total collateral value ÷ ALUD supply">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={d.points.filter((p) => p.collateralRatio !== null)} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" {...axisProps} minTickGap={20} />
            <YAxis {...axisProps} tickFormatter={(v) => `${Math.round(v)}%`} width={50} domain={["auto", "auto"]} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "Collateral ratio"]} />
            <Line type="monotone" dataKey="collateralRatio" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#10b981" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Stability Pool Deposits" subtitle="ALUD backing liquidations">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={d.points} margin={chartMargin}>
            <defs><Gradient id="gradSP" color="#06b6d4" /></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" {...axisProps} minTickGap={20} />
            <YAxis {...axisProps} tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} width={45} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${num(Math.round(v))} ALUD`, "Deposits"]} />
            <Area type="monotone" dataKey="spDeposits" stroke="#06b6d4" fill="url(#gradSP)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Collateral by Type" subtitle="Current collateral value and ALUD debt per asset">
        {d.collaterals.length === 0 ? <Empty>No collateral deposited yet.</Empty> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.collaterals} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="symbol" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={axisUsd} width={55} />
              <Tooltip contentStyle={chartTooltipStyle}
                formatter={(v: number, name: string) => [usd(v), name === "collateralUsd" ? "Collateral" : "ALUD debt"]} />
              <Bar dataKey="collateralUsd" fill="#10b981" radius={[3, 3, 0, 0]} opacity={0.8} />
              <Bar dataKey="debt" fill="#f59e0b" radius={[3, 3, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function NotLive({ name, detail }: { name: string; detail: string }) {
  return (
    <Card className="p-10 border border-gray-800/60 bg-[#0b0f16] rounded-lg text-center">
      <Clock className="w-8 h-8 text-gray-500 mx-auto mb-3" />
      <h3 className="text-white font-semibold">{name} analytics aren't live yet</h3>
      <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">{detail}</p>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────

interface Row {
  name: string;
  protocol: Protocol;
  live: boolean;
  tvl: number | null;
  volume: number | null;
  users: number | null;
  fees: number | null;
  apy: number | null;
  change: number | null;
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>("Last 30 Days");
  const [activeProtocol, setActiveProtocol] = useState<Protocol>("All");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [sortCol, setSortCol] = useState<keyof Row>("tvl");
  const [sortAsc, setSortAsc] = useState(false);

  const days = RANGE_DAYS[dateRange];
  const rangeShort = RANGE_SHORT[dateRange];
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["analytics", days],
    queryFn: () => fetchAnalytics(days),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
    retry: 1,
  });
  const t = data?.totals;

  const rows: Row[] = useMemo(() => {
    const list: Row[] = [
      { name: "Staking", protocol: "Staking", live: true, tvl: t?.stakingTvl ?? null, volume: null, users: t?.stakers ?? null,
        fees: null, apy: t?.avgApr ?? null, change: t?.stakingTvlChange7d ?? null },
      { name: "DEX/Eloqura", protocol: "DEX", live: true, tvl: t?.dexTvl ?? null, volume: t?.volume24h ?? null, users: t?.dexUsers ?? null,
        fees: t?.fees24h ?? null, apy: t?.dexFeeApr ?? null, change: t?.dexTvlChange7d ?? null },
      { name: "Lending/Alluria", protocol: "Lending", live: true, tvl: t?.lendingTvl ?? null, volume: null, users: t?.lendingUsers ?? null,
        fees: null, apy: null, change: t?.lendingTvlChange7d ?? null },
      { name: "Bridge", protocol: "Bridge", live: false, tvl: null, volume: null, users: null, fees: null, apy: null, change: null },
      { name: "NFT/Artivya", protocol: "NFT", live: false, tvl: null, volume: null, users: null, fees: null, apy: null, change: null },
    ];
    const filtered = activeProtocol === "All" ? list : list.filter((r) => r.protocol === activeProtocol);
    return [...filtered].sort((a, b) => {
      if (a.live !== b.live) return a.live ? -1 : 1;
      if (sortCol === "name") return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      const av = (a[sortCol] as number | null) ?? -Infinity;
      const bv = (b[sortCol] as number | null) ?? -Infinity;
      return sortAsc ? av - bv : bv - av;
    });
  }, [t, activeProtocol, sortCol, sortAsc]);

  const handleSort = (col: keyof Row) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  };
  const SortIcon = ({ col }: { col: string }) =>
    sortCol !== col ? null : sortAsc ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;

  const loadingValue = isLoading ? "..." : "-";

  return (
    <Layout>
      <div className="p-4 md:p-5" style={{ background: 'linear-gradient(180deg, #080c12 0%, #0a0e15 50%, #090d13 100%)' }}>
        <div className="max-w-7xl mx-auto space-y-3">
          {/* ── Header ────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/With%20Border/OEC%20Border.png"
                alt="OEC"
                className="w-8 h-8 rounded-full"
              />
              <div>
                <h1 className="text-xl font-bold text-white">
                  Oeconomia DAO <span className="text-gray-400 font-normal">Analytics Dashboard</span>
                </h1>
                <p className="text-[11px] text-gray-500">
                  Live from Sepolia testnet
                  {data && ` · updated ${new Date(data.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 bg-[#161b22] text-gray-300 hover:bg-[#1c2128] hover:text-white text-xs rounded-lg"
                  onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                >
                  {dateRange}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
                {dateDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-[#161b22] border border-gray-700 rounded-lg shadow-xl py-1 w-full">
                    {DATE_RANGES.map((r) => (
                      <button
                        key={r}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700/50 transition-colors ${
                          dateRange === r ? "text-cyan-400" : "text-gray-300"
                        }`}
                        onClick={() => { setDateRange(r); setDateDropdownOpen(false); }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Protocol Filters */}
              <div className="flex flex-wrap gap-1 bg-[#161b22] rounded-lg p-0.5 border border-gray-800/60">
                {PROTOCOLS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setActiveProtocol(p)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all duration-150 ${
                      activeProtocol === p
                        ? "bg-cyan-600/80 text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isError && (
            <Card className="p-4 border border-red-900/50 bg-red-950/20 rounded-lg text-sm text-red-300 flex items-center justify-between gap-3">
              Couldn't load analytics from the chain right now.
              <Button size="sm" variant="outline" className="border-red-800 text-red-200" onClick={() => refetch()}>Retry</Button>
            </Card>
          )}

          {/* ── KPI Cards + Charts ─────────────────────────── */}
          {activeProtocol === "Bridge" ? (
            <NotLive name="Bridge" detail="The Sepolia ↔ BSC Testnet bridge contracts haven't been deployed yet. Transfer volume and bridgers will show here once they are." />
          ) : activeProtocol === "NFT" ? (
            <NotLive name="NFT" detail="Artivya's marketplace contracts aren't deployed yet. Sales, floor prices and collectors will show here once they are." />
          ) : activeProtocol === "All" ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                <KPICard label="Total TVL" value={t ? usd(t.tvl) : loadingValue} change={t?.tvlChange7d} />
                <KPICard label="24h Volume" value={t ? usd(t.volume24h) : loadingValue} change={t?.volume24hChange} />
                <KPICard label="Active Wallets" value={t ? num(t.wallets) : loadingValue} change={t?.walletsChange7d} />
                <KPICard label={`Fees (${rangeShort})`} value={t ? usd(t.feesRange) : loadingValue} />
                <KPICard label="Staking APR" value={t ? pct(t.avgApr) : loadingValue} />
                <KPICard label="ALUD Supply" value={t ? num(Math.round(t.aludSupply)) : loadingValue} change={t?.aludChange7d} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <ChartCard title="Total Value Locked" subtitle="Pools and staking at current prices; Alluria collateral at its oracle price">
                  {!data ? <Empty>{isLoading ? "Loading..." : "No data"}</Empty> : (
                    <>
                      <ResponsiveContainer width="100%" height="88%">
                        <AreaChart data={data.points} margin={chartMargin}>
                          <defs>
                            <Gradient id="gradStaking" color="#06b6d4" />
                            <Gradient id="gradDEX" color="#8b5cf6" />
                            <Gradient id="gradLending" color="#10b981" />
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" {...axisProps} minTickGap={20} />
                          <YAxis {...axisProps} tickFormatter={axisUsd} width={55} />
                          <Tooltip contentStyle={chartTooltipStyle}
                            formatter={(v: number, name: string) => [usd(v), name === "stakingTvl" ? "Staking" : name === "dexTvl" ? "DEX" : "Lending"]} />
                          <Area type="monotone" dataKey="stakingTvl" stackId="1" stroke="#06b6d4" fill="url(#gradStaking)" strokeWidth={1.5} />
                          <Area type="monotone" dataKey="dexTvl" stackId="1" stroke="#8b5cf6" fill="url(#gradDEX)" strokeWidth={1.5} />
                          <Area type="monotone" dataKey="lendingTvl" stackId="1" stroke="#10b981" fill="url(#gradLending)" strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-4 justify-start ml-[50px]">
                        {[{ name: "Staking", color: "#06b6d4" }, { name: "DEX", color: "#8b5cf6" }, { name: "Lending", color: "#10b981" }].map((item) => (
                          <div key={item.name} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs text-gray-400">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </ChartCard>

                <ChartCard title="Volume & Fees" subtitle="Eloqura swap volume (bars) and LP fees (line)">
                  {!data ? <Empty>{isLoading ? "Loading..." : "No data"}</Empty> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.points.filter((p) => p.volume !== null)} margin={chartMargin}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" {...axisProps} minTickGap={20} />
                        <YAxis yAxisId="left" {...axisProps} tickFormatter={axisUsd} width={55} />
                        <YAxis yAxisId="right" orientation="right" {...axisProps} tickFormatter={axisUsd} width={45} />
                        <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number, name: string) => [usd(v), name === "fees" ? "Fees" : "Volume"]} />
                        <Bar yAxisId="left" dataKey="volume" fill="#8b5cf6" radius={[3, 3, 0, 0]} opacity={0.7} />
                        <Line yAxisId="right" type="monotone" dataKey="fees" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#10b981" }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                <ChartCard title="Wallet Growth" subtitle="Wallets that have used Eloqura, staking or Alluria">
                  {!data ? <Empty>{isLoading ? "Loading..." : "No data"}</Empty> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.points} margin={chartMargin}>
                        <defs><Gradient id="gradUsers" color="#6366f1" /></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" {...axisProps} minTickGap={20} />
                        <YAxis {...axisProps} allowDecimals={false} width={40} />
                        <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [num(v), "Wallets"]} />
                        <Area type="stepAfter" dataKey="wallets" stroke="#6366f1" fill="url(#gradUsers)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                <ChartCard title="ALUD Supply & Stability Pool" subtitle="ALUD minted (area) and Stability Pool deposits (line)">
                  {!data ? <Empty>{isLoading ? "Loading..." : "No data"}</Empty> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.points} margin={chartMargin}>
                        <defs><Gradient id="gradAlud" color="#f59e0b" /></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" {...axisProps} minTickGap={20} />
                        <YAxis {...axisProps} tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} width={45} />
                        <Tooltip contentStyle={chartTooltipStyle}
                          formatter={(v: number, name: string) => [`${num(Math.round(v))} ALUD`, name === "aludSupply" ? "Supply" : "Stability Pool"]} />
                        <Area type="monotone" dataKey="aludSupply" stroke="#f59e0b" fill="url(#gradAlud)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="spDeposits" stroke="#06b6d4" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {activeProtocol === "Staking" && <>
                  <KPICard label="Total Staked" value={t ? usd(t.stakingTvl) : loadingValue} change={t?.stakingTvlChange7d} />
                  <KPICard label="Avg APR" value={t ? pct(t.avgApr) : loadingValue} />
                  <KPICard label="Total Stakers" value={t ? num(t.stakers) : loadingValue} change={t?.stakersChange7d} />
                  <KPICard label="Pools" value={t ? num(t.poolsCount) : loadingValue} />
                </>}
                {activeProtocol === "DEX" && <>
                  <KPICard label="DEX TVL" value={t ? usd(t.dexTvl) : loadingValue} change={t?.dexTvlChange7d} />
                  <KPICard label="24h Swap Volume" value={t ? usd(t.volume24h) : loadingValue} change={t?.volume24hChange} />
                  <KPICard label="Active Pairs" value={t ? num(t.pairsCount) : loadingValue} />
                  <KPICard label={`Fees Earned (${rangeShort})`} value={t ? usd(t.feesRange) : loadingValue} />
                </>}
                {activeProtocol === "Lending" && <>
                  <KPICard label="Total Collateral" value={t ? usd(t.lendingTvl) : loadingValue} change={t?.lendingTvlChange7d} />
                  <KPICard label="ALUD Minted" value={t ? num(Math.round(t.aludSupply)) : loadingValue} change={t?.aludChange7d} />
                  <KPICard label="Collateral Ratio" value={t ? (t.collateralRatio === null ? "-" : `${t.collateralRatio.toFixed(0)}%`) : loadingValue} />
                  <KPICard label="Stability Pool" value={t ? `${num(Math.round(t.spDeposits))} ALUD` : loadingValue} change={t?.spChange7d} />
                </>}
              </div>
              {!data ? (
                <Card className="p-10 border border-gray-800/60 bg-[#0b0f16] rounded-lg text-center text-gray-500 text-sm">
                  {isLoading ? "Loading on-chain data..." : "No data"}
                </Card>
              ) : (
                <>
                  {activeProtocol === "Staking" && <StakingView d={data} />}
                  {activeProtocol === "DEX" && <DEXView d={data} rangeShort={rangeShort} />}
                  {activeProtocol === "Lending" && <LendingView d={data} />}
                </>
              )}
            </>
          )}

          {/* ── Protocol Breakdown Table ───────────────────────── */}
          <Card className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 overflow-hidden">
            <div className="p-5 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300">Protocol Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {([
                      { key: "name", label: "Protocol" },
                      { key: "tvl", label: "TVL" },
                      { key: "volume", label: "Volume (24h)" },
                      { key: "users", label: "Users" },
                      { key: "fees", label: "Fees (24h)" },
                      { key: "apy", label: "APR" },
                      { key: "change", label: "TVL Change (7d)" },
                    ] as { key: keyof Row; label: string }[]).map((col) => (
                      <th
                        key={col.key}
                        className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors select-none whitespace-nowrap"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                        <SortIcon col={col.key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.name}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-150 cursor-pointer"
                      onClick={() => { setActiveProtocol(row.protocol); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      <td className="px-5 py-4 font-medium text-white whitespace-nowrap">
                        {row.name}
                        {!row.live && <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-500 border border-gray-700 rounded px-1.5 py-0.5">Not live</span>}
                      </td>
                      <td className="px-5 py-4 text-gray-300">{row.tvl === null ? (row.live ? loadingValue : "-") : usd(row.tvl)}</td>
                      <td className="px-5 py-4 text-gray-300">{row.volume === null ? "-" : usd(row.volume)}</td>
                      <td className="px-5 py-4 text-gray-300">{row.users === null ? (row.live ? loadingValue : "-") : num(row.users)}</td>
                      <td className="px-5 py-4 text-gray-300">{row.fees === null ? "-" : usd(row.fees)}</td>
                      <td className="px-5 py-4 text-gray-300">{pct(row.apy)}</td>
                      <td className="px-5 py-4">
                        {row.change === null ? <span className="text-gray-500">-</span> : (
                          <span className={`flex items-center gap-1 text-xs font-semibold ${row.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {row.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {row.change >= 0 ? "+" : ""}{row.change.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-[11px] text-gray-500 border-t border-gray-800">
              Read directly from Oeconomia's contracts on Sepolia and refreshed about every 10 minutes. Users are wallets
              that have moved tokens into a protocol's contracts. Testnet values have no real-world worth.
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
