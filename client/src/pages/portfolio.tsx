import { useAccount, useBalance, useReadContracts, useReadContract } from 'wagmi'
import { erc20Abi, formatUnits } from 'viem'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Plus, ExternalLink, Droplets, Sprout, Gift, ChevronDown, ChevronUp, Coins } from 'lucide-react'
import { useState, useMemo } from 'react'
import { WalletConnect } from "@/components/wallet-connect"
import { WalletSetupGuide } from "@/components/wallet-setup-guide"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Layout } from "@/components/layout"

// Sepolia token definitions
const SEPOLIA_TOKENS = [
  { address: '0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba' as `0x${string}`, symbol: 'OEC', name: 'Oeconomia', decimals: 18, logo: '/oec-logo.png' },
  { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`, symbol: 'USDC', name: 'USD Coin', decimals: 6, logo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
  { address: '0x779877A7B0D9E8603169DdbD7836e478b4624789' as `0x${string}`, symbol: 'LINK', name: 'Chainlink', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  { address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as `0x${string}`, symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/2518/small/weth.png' },
] as const

// Known token address → symbol/name map for resolution
const TOKEN_MAP: Record<string, { symbol: string; name: string; decimals: number }> = {
  '0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba': { symbol: 'OEC', name: 'Oeconomia', decimals: 18 },
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  '0x779877a7b0d9e8603169ddbd7836e478b4624789': { symbol: 'LINK', name: 'Chainlink', decimals: 18 },
  '0xfff9976782d46cc05630d1f6ebab18b2324d6b14': { symbol: 'WETH', name: 'Wrapped Ether (Uniswap)', decimals: 18 },
  '0x34b11f6b8f78fa010bbca71bc7fe79daa811b89f': { symbol: 'WETH', name: 'Wrapped Ether (Eloqura)', decimals: 18 },
}

function resolveToken(addr: string) {
  return TOKEN_MAP[addr.toLowerCase()] || { symbol: addr.slice(0, 6) + '...', name: 'Unknown Token', decimals: 18 }
}

// Contract addresses
const STAKING_CONTRACT = '0x4a4da37c9a9f421efe3feb527fc16802ce756ec3' as `0x${string}`
const ELOQURA_FACTORY = '0x1a4C7849Dd8f62AefA082360b3A8D857952B3b8e' as `0x${string}`

// Minimal ABIs for on-chain reads
const STAKING_ABI = [
  { name: 'poolCount', type: 'function', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { name: 'getPoolInfo', type: 'function', inputs: [{ name: 'poolId', type: 'uint256' }], outputs: [{ name: 'stakingToken', type: 'address' }, { name: 'rewardsToken', type: 'address' }, { name: 'aprBps', type: 'uint256' }, { name: 'lockPeriod', type: 'uint256' }, { name: 'totalSupply', type: 'uint256' }, { name: 'lastUpdateTime', type: 'uint256' }, { name: 'rewardPerTokenStored', type: 'uint256' }], stateMutability: 'view' },
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'poolId', type: 'uint256' }, { name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { name: 'earned', type: 'function', inputs: [{ name: 'poolId', type: 'uint256' }, { name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
] as const

const FACTORY_ABI = [
  { name: 'allPairsLength', type: 'function', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { name: 'allPairs', type: 'function', inputs: [{ name: '', type: 'uint256' }], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
] as const

const PAIR_ABI = [
  { name: 'token0', type: 'function', inputs: [], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
  { name: 'token1', type: 'function', inputs: [], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
  { name: 'getReserves', type: 'function', inputs: [], outputs: [{ name: 'reserve0', type: 'uint112' }, { name: 'reserve1', type: 'uint112' }, { name: 'blockTimestampLast', type: 'uint32' }], stateMutability: 'view' },
  { name: 'totalSupply', type: 'function', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
] as const

export function Portfolio() {
  const { address, isConnected } = useAccount()
  const [holdingsExpanded, setHoldingsExpanded] = useState(true)
  const [stakingExpanded, setStakingExpanded] = useState(true)
  const [lpExpanded, setLpExpanded] = useState(true)

  // Get native ETH balance
  const { data: ethBalance } = useBalance({ address })

  // Read ERC-20 balances directly from Sepolia
  const { data: tokenResults, isLoading: balancesLoading } = useReadContracts({
    contracts: address ? SEPOLIA_TOKENS.map(token => ({
      address: token.address,
      abi: erc20Abi,
      functionName: 'balanceOf' as const,
      args: [address],
    })) : [],
    query: { enabled: !!address && isConnected, refetchInterval: 30000 },
  })

  // Map results to token data
  const tokenBalances = SEPOLIA_TOKENS.map((token, i) => {
    const result = tokenResults?.[i]
    const rawBalance = result?.status === 'success' ? (result.result as bigint) : 0n
    const balance = formatUnits(rawBalance, token.decimals)
    return { ...token, balance, rawBalance }
  })

  // ── STAKING: Phase 1 — get pool count ──
  const { data: poolCountData } = useReadContract({
    address: STAKING_CONTRACT,
    abi: STAKING_ABI,
    functionName: 'poolCount',
    query: { enabled: isConnected },
  })
  const poolCount = poolCountData ? Number(poolCountData) : 0

  // ── STAKING: Phase 2 — get pool info + user balances + earned for each pool ──
  const stakingContracts = useMemo(() => {
    if (!address || poolCount === 0) return []
    const calls: any[] = []
    for (let i = 0; i < poolCount; i++) {
      calls.push(
        { address: STAKING_CONTRACT, abi: STAKING_ABI, functionName: 'getPoolInfo', args: [BigInt(i)] },
        { address: STAKING_CONTRACT, abi: STAKING_ABI, functionName: 'balanceOf', args: [BigInt(i), address] },
        { address: STAKING_CONTRACT, abi: STAKING_ABI, functionName: 'earned', args: [BigInt(i), address] },
      )
    }
    return calls
  }, [address, poolCount])

  const { data: stakingResults, isLoading: stakingLoading } = useReadContracts({
    contracts: stakingContracts,
    query: { enabled: stakingContracts.length > 0, refetchInterval: 30000 },
  })

  // Parse staking data
  const stakingPositions = useMemo(() => {
    if (!stakingResults || poolCount === 0) return []
    const positions: Array<{
      poolId: number
      stakingToken: string
      rewardsToken: string
      aprBps: bigint
      lockPeriod: bigint
      totalSupply: bigint
      userStaked: bigint
      pendingRewards: bigint
      stakingSymbol: string
      rewardsSymbol: string
      stakingDecimals: number
      rewardsDecimals: number
    }> = []

    for (let i = 0; i < poolCount; i++) {
      const infoResult = stakingResults[i * 3]
      const balResult = stakingResults[i * 3 + 1]
      const earnedResult = stakingResults[i * 3 + 2]

      if (infoResult?.status !== 'success') continue
      const info = infoResult.result as readonly [string, string, bigint, bigint, bigint, bigint, bigint]
      const userStaked = balResult?.status === 'success' ? (balResult.result as bigint) : 0n
      const pendingRewards = earnedResult?.status === 'success' ? (earnedResult.result as bigint) : 0n

      const stakingMeta = resolveToken(info[0])
      const rewardsMeta = resolveToken(info[1])

      positions.push({
        poolId: i,
        stakingToken: info[0],
        rewardsToken: info[1],
        aprBps: info[2],
        lockPeriod: info[3],
        totalSupply: info[4],
        userStaked,
        pendingRewards,
        stakingSymbol: stakingMeta.symbol,
        rewardsSymbol: rewardsMeta.symbol,
        stakingDecimals: stakingMeta.decimals,
        rewardsDecimals: rewardsMeta.decimals,
      })
    }
    return positions
  }, [stakingResults, poolCount])

  // ── ELOQURA LP: Phase 1 — get pair count ──
  const { data: pairsLengthData } = useReadContract({
    address: ELOQURA_FACTORY,
    abi: FACTORY_ABI,
    functionName: 'allPairsLength',
    query: { enabled: isConnected },
  })
  const pairsLength = pairsLengthData ? Number(pairsLengthData) : 0

  // ── ELOQURA LP: Phase 2 — get pair addresses ──
  const pairAddressCalls = useMemo(() => {
    if (pairsLength === 0) return []
    return Array.from({ length: pairsLength }, (_, i) => ({
      address: ELOQURA_FACTORY as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: 'allPairs' as const,
      args: [BigInt(i)],
    }))
  }, [pairsLength])

  const { data: pairAddressResults } = useReadContracts({
    contracts: pairAddressCalls,
    query: { enabled: pairAddressCalls.length > 0 },
  })

  const pairAddresses = useMemo(() => {
    if (!pairAddressResults) return []
    return pairAddressResults
      .filter(r => r.status === 'success')
      .map(r => r.result as `0x${string}`)
  }, [pairAddressResults])

  // ── ELOQURA LP: Phase 3 — get pair details (token0, token1, reserves, totalSupply, user balance) ──
  const pairDetailCalls = useMemo(() => {
    if (!address || pairAddresses.length === 0) return []
    const calls: any[] = []
    for (const pair of pairAddresses) {
      calls.push(
        { address: pair, abi: PAIR_ABI, functionName: 'token0' },
        { address: pair, abi: PAIR_ABI, functionName: 'token1' },
        { address: pair, abi: PAIR_ABI, functionName: 'getReserves' },
        { address: pair, abi: PAIR_ABI, functionName: 'totalSupply' },
        { address: pair, abi: PAIR_ABI, functionName: 'balanceOf', args: [address] },
      )
    }
    return calls
  }, [address, pairAddresses])

  const { data: pairDetailResults, isLoading: lpLoading } = useReadContracts({
    contracts: pairDetailCalls,
    query: { enabled: pairDetailCalls.length > 0, refetchInterval: 30000 },
  })

  // Parse LP data
  const lpPositions = useMemo(() => {
    if (!pairDetailResults || pairAddresses.length === 0) return []
    const positions: Array<{
      pairAddress: string
      token0: string
      token1: string
      token0Symbol: string
      token1Symbol: string
      reserve0: bigint
      reserve1: bigint
      totalSupply: bigint
      userLpBalance: bigint
      token0Decimals: number
      token1Decimals: number
    }> = []

    for (let i = 0; i < pairAddresses.length; i++) {
      const t0Result = pairDetailResults[i * 5]
      const t1Result = pairDetailResults[i * 5 + 1]
      const resResult = pairDetailResults[i * 5 + 2]
      const tsResult = pairDetailResults[i * 5 + 3]
      const balResult = pairDetailResults[i * 5 + 4]

      if (t0Result?.status !== 'success' || t1Result?.status !== 'success') continue

      const token0 = t0Result.result as string
      const token1 = t1Result.result as string
      const reserves = resResult?.status === 'success' ? (resResult.result as readonly [bigint, bigint, number]) : [0n, 0n, 0] as const
      const totalSupply = tsResult?.status === 'success' ? (tsResult.result as bigint) : 0n
      const userLpBalance = balResult?.status === 'success' ? (balResult.result as bigint) : 0n

      const t0Meta = resolveToken(token0)
      const t1Meta = resolveToken(token1)

      positions.push({
        pairAddress: pairAddresses[i],
        token0,
        token1,
        token0Symbol: t0Meta.symbol,
        token1Symbol: t1Meta.symbol,
        reserve0: reserves[0],
        reserve1: reserves[1],
        totalSupply,
        userLpBalance,
        token0Decimals: t0Meta.decimals,
        token1Decimals: t1Meta.decimals,
      })
    }
    return positions
  }, [pairDetailResults, pairAddresses])

  // Count active DeFi positions (user has staked or has LP tokens)
  const activeStakingCount = stakingPositions.filter(p => p.userStaked > 0n).length
  const activeLpCount = lpPositions.filter(p => p.userLpBalance > 0n).length
  const totalDefiPositions = activeStakingCount + activeLpCount

  const formatNumber = (num: number) => {
    if (isNaN(num) || !isFinite(num)) return '0'
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 5 })
  }

  const formatCompact = (num: number) => {
    if (isNaN(num) || !isFinite(num)) return '0'
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
  }

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const formatLockPeriod = (seconds: bigint) => {
    const s = Number(seconds)
    if (s === 0) return 'No lock'
    if (s < 3600) return `${Math.floor(s / 60)}m`
    if (s < 86400) return `${Math.floor(s / 3600)}h`
    return `${Math.floor(s / 86400)}d`
  }

  if (!isConnected) {
    return (
      <Layout>
        <div className="p-4 md:p-5" style={{ background: 'linear-gradient(180deg, #080c12 0%, #0a0e15 50%, #090d13 100%)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-16">
              <Wallet className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
              <p className="text-gray-400 mb-8">Connect your wallet to view your token portfolio</p>
              <div className="max-w-xs mx-auto">
                <WalletConnect />
                <WalletSetupGuide />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-5" style={{ background: 'linear-gradient(180deg, #080c12 0%, #0a0e15 50%, #090d13 100%)' }}>
        <div className="max-w-7xl mx-auto space-y-3">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
            <div className="relative z-10">
              <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Portfolio Overview</p>
              <div className="text-2xl font-bold text-white">Dashboard</div>
              <div className="text-xs text-gray-500 mt-1">Track your DeFi positions</div>
            </div>
          </Card>

          <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
            <div className="relative z-10">
              <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Wallet Address</p>
              <div className="text-2xl font-bold text-white">
                {address ? formatAddress(address) : '---'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <span
                  className="cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => {
                    if (address) {
                      window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank')
                    }
                  }}
                >
                  View on Etherscan <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
            <div className="relative z-10">
              <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Assets Tracked</p>
              <div className="text-2xl font-bold text-white">
                {SEPOLIA_TOKENS.length + 1}
              </div>
              <div className="text-xs text-gray-500 mt-1">Including ETH</div>
            </div>
          </Card>

          <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
            <div className="relative z-10">
              <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">DeFi Positions</p>
              <div className="text-2xl font-bold text-white">
                {totalDefiPositions}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {activeStakingCount > 0 && `${activeStakingCount} staked`}
                {activeStakingCount > 0 && activeLpCount > 0 && ' · '}
                {activeLpCount > 0 && `${activeLpCount} LP`}
                {totalDefiPositions === 0 && 'No active positions'}
              </div>
            </div>
          </Card>
        </div>

        {/* Token Holdings */}
        <Card className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent pointer-events-none" />
          <div className="relative z-10 p-5">
          <div
            className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-800/30 -m-2 p-2 rounded-lg transition-colors"
            onClick={() => setHoldingsExpanded(!holdingsExpanded)}
          >
            <div className="flex items-center space-x-3">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Holdings</h2>
              {holdingsExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-[#161b22] text-gray-300 hover:bg-[#1c2128] hover:text-white text-xs rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Add Token
            </Button>
          </div>

          {holdingsExpanded && (
            <div>
              {balancesLoading ? (
                <LoadingSpinner text="Loading portfolio" size="lg" />
              ) : (
                <div className="space-y-1">
                  {/* ETH Balance */}
                  {ethBalance && (
                    <div className="flex items-center justify-between p-2 bg-[var(--crypto-dark)]/50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <img
                          src="https://assets.coingecko.com/coins/images/279/small/ethereum.png"
                          alt="ETH"
                          className="w-7 h-7 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<div class="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">ETH</div>';
                          }}
                        />
                        <div>
                          <div className="font-medium">Sepolia ETH</div>
                          <div className="text-sm text-gray-400">ETH</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatNumber(parseFloat(ethBalance.formatted || '0'))} ETH</div>
                        <div className="text-sm text-gray-400">Native ETH</div>
                      </div>
                    </div>
                  )}

                  {/* ERC-20 Token Balances (read on-chain) */}
                  {tokenBalances.map((token) => (
                    <div key={token.address} className="flex items-center justify-between p-2 bg-[var(--crypto-dark)]/50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <img
                          src={token.logo}
                          alt={token.symbol}
                          className="w-7 h-7 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = `<div class="w-7 h-7 bg-gradient-to-r from-crypto-blue/20 to-crypto-green/20 rounded-full flex items-center justify-center text-white font-bold text-xs">${token.symbol.slice(0, 3)}</div>`;
                          }}
                        />
                        <div>
                          <div className="font-medium">{token.name}</div>
                          <div className="text-sm text-gray-400">{token.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatNumber(parseFloat(token.balance))} {token.symbol}</div>
                        <div className="text-sm text-gray-400">
                          {token.rawBalance > 0n ? 'On-chain balance' : '---'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </Card>

        {/* OEC Staking Positions */}
        <Card className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent pointer-events-none" />
          <div className="relative z-10 p-5">
          <div
            className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-800/30 -m-2 p-2 rounded-lg transition-colors"
            onClick={() => setStakingExpanded(!stakingExpanded)}
          >
            <div className="flex items-center space-x-3">
              <Coins className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">OEC Staking</h2>
              <span className="text-xs text-gray-500">({poolCount} pool{poolCount !== 1 ? 's' : ''})</span>
              {stakingExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-[#161b22] text-gray-300 hover:bg-[#1c2128] hover:text-white text-xs rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                window.open('https://oec-staking.netlify.app/', '_blank')
              }}
            >
              <ExternalLink className="w-3 h-3 mr-1.5" />
              Go to Staking
            </Button>
          </div>

          {stakingExpanded && (
            <div className="space-y-3">
              {stakingLoading ? (
                <LoadingSpinner text="Loading staking positions" size="lg" />
              ) : stakingPositions.length === 0 ? (
                <div className="text-center py-6">
                  <Sprout className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No staking pools found</p>
                </div>
              ) : (
                stakingPositions.map((pool) => (
                  <Card key={pool.poolId} className="p-4 border border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 hover:from-purple-500/10 hover:to-indigo-500/10 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                          <Sprout className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{pool.stakingSymbol} Staking</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                              Pool #{pool.poolId}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Stake {pool.stakingSymbol} → Earn {pool.rewardsSymbol}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {pool.userStaked > 0n
                            ? `${formatCompact(parseFloat(formatUnits(pool.userStaked, pool.stakingDecimals)))} ${pool.stakingSymbol}`
                            : 'Not staked'}
                        </div>
                        <div className="text-xs text-gray-400">Your stake</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-700/50">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">APR</div>
                        <div className="text-sm font-medium text-green-400">
                          {(Number(pool.aprBps) / 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Lock Period</div>
                        <div className="text-sm">{formatLockPeriod(pool.lockPeriod)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Total Staked</div>
                        <div className="text-sm">
                          {formatCompact(parseFloat(formatUnits(pool.totalSupply, pool.stakingDecimals)))} {pool.stakingSymbol}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Pending Rewards</div>
                        <div className="text-sm">
                          {pool.pendingRewards > 0n ? (
                            <div className="flex items-center space-x-1">
                              <Gift className="w-3 h-3 text-yellow-400" />
                              <span className="text-yellow-400">
                                {formatCompact(parseFloat(formatUnits(pool.pendingRewards, pool.rewardsDecimals)))} {pool.rewardsSymbol}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
          </div>
        </Card>

        {/* Eloqura LP Positions */}
        <Card className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent pointer-events-none" />
          <div className="relative z-10 p-5">
          <div
            className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-800/30 -m-2 p-2 rounded-lg transition-colors"
            onClick={() => setLpExpanded(!lpExpanded)}
          >
            <div className="flex items-center space-x-3">
              <Droplets className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Eloqura Liquidity</h2>
              <span className="text-xs text-gray-500">({activeLpCount} position{activeLpCount !== 1 ? 's' : ''})</span>
              {lpExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-[#161b22] text-gray-300 hover:bg-[#1c2128] hover:text-white text-xs rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                window.open('https://eloqura.netlify.app/', '_blank')
              }}
            >
              <ExternalLink className="w-3 h-3 mr-1.5" />
              Go to Eloqura
            </Button>
          </div>

          {lpExpanded && (
            <div className="space-y-3">
              {lpLoading ? (
                <LoadingSpinner text="Loading LP positions" size="lg" />
              ) : lpPositions.filter(p => p.userLpBalance > 0n).length === 0 ? (
                <div className="text-center py-6">
                  <Droplets className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No active Eloqura LP positions</p>
                  <p className="text-xs text-gray-500 mt-1">Add liquidity on Eloqura DEX to see your positions here</p>
                </div>
              ) : (
                lpPositions.filter(p => p.userLpBalance > 0n).map((lp) => {
                  const userShare = lp.totalSupply > 0n
                    ? Number(lp.userLpBalance * 10000n / lp.totalSupply) / 100
                    : 0
                  const userToken0 = lp.totalSupply > 0n
                    ? (lp.reserve0 * lp.userLpBalance) / lp.totalSupply
                    : 0n
                  const userToken1 = lp.totalSupply > 0n
                    ? (lp.reserve1 * lp.userLpBalance) / lp.totalSupply
                    : 0n

                  return (
                    <Card key={lp.pairAddress} className="p-4 border border-teal-500/30 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 hover:from-teal-500/10 hover:to-cyan-500/10 transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
                            <Droplets className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{lp.token0Symbol} / {lp.token1Symbol}</span>
                              <span className="text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-400">LP</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              Eloqura DEX · {formatAddress(lp.pairAddress)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {lp.userLpBalance > 0n
                              ? `${formatCompact(parseFloat(formatUnits(lp.userLpBalance, 18)))} LP`
                              : 'No position'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {userShare > 0 ? `${userShare.toFixed(2)}% share` : '---'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-700/50">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">{lp.token0Symbol} Reserve</div>
                          <div className="text-sm">
                            {formatCompact(parseFloat(formatUnits(lp.reserve0, lp.token0Decimals)))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">{lp.token1Symbol} Reserve</div>
                          <div className="text-sm">
                            {formatCompact(parseFloat(formatUnits(lp.reserve1, lp.token1Decimals)))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Your {lp.token0Symbol}</div>
                          <div className="text-sm">
                            {lp.userLpBalance > 0n
                              ? formatCompact(parseFloat(formatUnits(userToken0, lp.token0Decimals)))
                              : '---'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Your {lp.token1Symbol}</div>
                          <div className="text-sm">
                            {lp.userLpBalance > 0n
                              ? formatCompact(parseFloat(formatUnits(userToken1, lp.token1Decimals)))
                              : '---'}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          )}
          </div>
        </Card>
        </div>
      </div>
    </Layout>
  )
}
