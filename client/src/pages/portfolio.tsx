import { useAccount, useBalance, useReadContracts, useReadContract, usePublicClient } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Plus, ExternalLink, Droplets, Sprout, Gift, ChevronDown, ChevronUp, Coins, Gem, Palette, TrendingUp, Shield, Settings, X } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { WalletConnect } from "@/components/wallet-connect"
import { WalletSetupGuide } from "@/components/wallet-setup-guide"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Layout } from "@/components/layout"

// Known token metadata for display (logos, friendly names)
const KNOWN_TOKEN_META: Record<string, { symbol: string; name: string; logo: string }> = {
  '0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba': { symbol: 'OEC', name: 'Oeconomia', logo: '/oec-logo.png' },
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': { symbol: 'USDC', name: 'USD Coin', logo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
  '0x779877a7b0d9e8603169ddbd7836e478b4624789': { symbol: 'LINK', name: 'Chainlink', logo: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  '0xfff9976782d46cc05630d1f6ebab18b2324d6b14': { symbol: 'WETH', name: 'Wrapped Ether (Uniswap)', logo: 'https://assets.coingecko.com/coins/images/2518/small/weth.png' },
  '0x34b11f6b8f78fa010bbca71bc7fe79daa811b89f': { symbol: 'WETH', name: 'Wrapped Ether (Eloqura)', logo: 'https://assets.coingecko.com/coins/images/2518/small/weth.png' },
  '0x5bb220afc6e2e008cb2302a83536a019ed245aa2': { symbol: 'AAVE', name: 'Aave', logo: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png' },
  '0x3e622317f8c93f7328350cf0b56d9ed4c620c5d6': { symbol: 'DAI', name: 'Dai Stablecoin', logo: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png' },
}

// Tokens to always price (for staking/LP calculations even if not in wallet)
const PRICING_TOKENS = [
  { address: '0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba', symbol: 'OEC', decimals: 18 },
  { address: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', symbol: 'USDC', decimals: 6 },
  { address: '0x779877a7b0d9e8603169ddbd7836e478b4624789', symbol: 'LINK', decimals: 18 },
  { address: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14', symbol: 'WETH', decimals: 18 },
  { address: '0x34b11f6b8f78fa010bbca71bc7fe79daa811b89f', symbol: 'WETH', decimals: 18 },
]

const OEC_ADDRESS = '0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba'

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
const USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`
const UNISWAP_QUOTER_V2 = '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3' as `0x${string}`
const UNISWAP_WETH = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as `0x${string}`
const FEE_TIERS = [3000, 500, 10000] as const

// Uniswap V3 QuoterV2 ABI
const QUOTER_ABI = [
  {
    name: 'quoteExactInputSingle', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'params', type: 'tuple', components: [
      { name: 'tokenIn', type: 'address' }, { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' }, { name: 'fee', type: 'uint24' },
      { name: 'sqrtPriceLimitX96', type: 'uint160' },
    ]}],
    outputs: [
      { name: 'amountOut', type: 'uint256' }, { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' }, { name: 'gasEstimate', type: 'uint256' },
    ],
  },
] as const

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
  { name: 'getPair', type: 'function', inputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
] as const

const PAIR_ABI = [
  { name: 'token0', type: 'function', inputs: [], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
  { name: 'token1', type: 'function', inputs: [], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
  { name: 'getReserves', type: 'function', inputs: [], outputs: [{ name: 'reserve0', type: 'uint112' }, { name: 'reserve1', type: 'uint112' }, { name: 'blockTimestampLast', type: 'uint32' }], stateMutability: 'view' },
  { name: 'totalSupply', type: 'function', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
] as const

// Mock Alluria lending positions (from Alluria dashboard)
const MOCK_ALLURIA_POSITIONS = [
  { id: '1', collateral: 'WBTC', collateralAmount: 0.05, collateralValue: 3367.00, borrowed: 2450, ratio: 137.5, liquidationPrice: 59000, interestRate: 3.2 },
  { id: '2', collateral: 'WETH', collateralAmount: 1.25, collateralValue: 4275.63, borrowed: 3200, ratio: 133.6, liquidationPrice: 2816, interestRate: 3.1 },
]

// Mock Artivya NFTs (from Artivya profile)
const MOCK_ARTIVYA_NFTS = [
  { id: 1, name: 'Oeconomia Genesis #001', collection: 'Oeconomia Genesis', price: 2.5, rarity: 'legendary' },
  { id: 2, name: 'Pixel Pioneer #42', collection: 'Retro Punks', price: 0.8, rarity: 'rare' },
  { id: 3, name: 'Abstract Realm #12', collection: 'Abstract Visions', price: 3.2, rarity: 'epic' },
  { id: 4, name: 'Phantom Circuit', collection: 'Cyber Pets', price: 3.2, rarity: 'epic' },
  { id: 5, name: 'Kraken of the Abyss', collection: 'Crypto Creatures', price: 7.8, rarity: 'legendary' },
  { id: 6, name: 'Solstice Meditation', collection: 'Zen Gardens', price: 1.4, rarity: 'rare' },
  { id: 7, name: 'Titan Warframe MK-IV', collection: 'Battle Mechs', price: 6.5, rarity: 'legendary' },
  { id: 8, name: 'Resonance Protocol', collection: 'Sound Waves', price: 2.1, rarity: 'epic' },
  { id: 9, name: 'Governance Sigil #007', collection: 'DAO Emblems', price: 4.0, rarity: 'epic' },
  { id: 10, name: 'Infinity Shard', collection: 'Magic Crystals', price: 9.9, rarity: 'mythic' },
  { id: 11, name: 'Pixel Paladin', collection: 'Gaming Nostalgia', price: 1.6, rarity: 'rare' },
  { id: 12, name: 'Void Walker', collection: 'Dimensional Beings', price: 5.5, rarity: 'legendary' },
]

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'mythic': return 'text-red-400'
    case 'legendary': return 'text-yellow-400'
    case 'epic': return 'text-purple-400'
    case 'rare': return 'text-blue-400'
    default: return 'text-gray-400'
  }
}

const getRarityBg = (rarity: string) => {
  switch (rarity) {
    case 'mythic': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'legendary': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'epic': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'rare': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

export function Portfolio() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({})
  const [holdingsExpanded, setHoldingsExpanded] = useState(true)
  const [stakingExpanded, setStakingExpanded] = useState<boolean | null>(null)
  const [lpExpanded, setLpExpanded] = useState<boolean | null>(null)
  const [alluriaExpanded, setAlluriaExpanded] = useState(MOCK_ALLURIA_POSITIONS.length > 0)
  const [artivyaExpanded, setArtivyaExpanded] = useState(MOCK_ARTIVYA_NFTS.length > 0)
  const [activeSection, setActiveSection] = useState<string>('holdings')
  const [discoveredTokens, setDiscoveredTokens] = useState<Array<{
    address: string; symbol: string; name: string; decimals: number; logo: string | null; balance: string;
  }>>([])
  const [tokensLoading, setTokensLoading] = useState(false)
  const [hiddenTokens, setHiddenTokens] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('dao-hidden-tokens')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })
  const [showTokenSettings, setShowTokenSettings] = useState(false)

  const toggleTokenVisibility = (key: string) => {
    setHiddenTokens(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      localStorage.setItem('dao-hidden-tokens', JSON.stringify([...next]))
      return next
    })
  }

  // Scroll spy for nav active indicator
  useEffect(() => {
    const sectionIds = ['holdings', 'staking', 'eloqura', 'alluria', 'artivya']
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-220px 0px -50% 0px', threshold: 0 }
    )
    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  // Discover all ERC-20 tokens via Alchemy serverless function
  useEffect(() => {
    let isInitial = true
    const discover = async () => {
      if (!address) { setDiscoveredTokens([]); return }
      if (isInitial) setTokensLoading(true)
      try {
        const res = await fetch(`/.netlify/functions/wallet-tokens?address=${address}`)
        if (res.ok) {
          const data = await res.json()
          setDiscoveredTokens(data.tokens || [])
        }
      } catch (err) {
        console.error('Token discovery failed:', err)
      } finally {
        setTokensLoading(false)
        isInitial = false
      }
    }
    discover()
    const interval = setInterval(discover, 60000)
    return () => clearInterval(interval)
  }, [address])

  // Fetch token prices via Uniswap V3 QuoterV2 + Eloqura DEX fallback
  useEffect(() => {
    const fetchPrices = async () => {
      if (!publicClient) return
      const prices: Record<string, number> = {}

      // Merge discovered tokens + baseline pricing tokens (deduplicated)
      const seen = new Set<string>()
      const pricingTokens: Array<{ symbol: string; address: string; decimals: number }> = [
        { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      ]
      seen.add('0x0000000000000000000000000000000000000000')
      for (const t of discoveredTokens) {
        const addr = t.address.toLowerCase()
        if (!seen.has(addr)) { pricingTokens.push({ symbol: t.symbol, address: addr, decimals: t.decimals }); seen.add(addr) }
      }
      for (const t of PRICING_TOKENS) {
        const addr = t.address.toLowerCase()
        if (!seen.has(addr)) { pricingTokens.push({ symbol: t.symbol, address: addr, decimals: t.decimals }); seen.add(addr) }
      }

      for (const token of pricingTokens) {
        // USDC = $1
        if (token.symbol === 'USDC') { prices['USDC'] = 1; continue }

        // Use Uniswap WETH address for ETH/WETH when querying quoter
        const quoterAddress = (token.symbol === 'ETH' || token.symbol === 'WETH')
          ? UNISWAP_WETH : token.address as `0x${string}`

        let priceFound = false

        // Tier 1: Direct token → USDC via Uniswap V3
        for (const fee of FEE_TIERS) {
          try {
            const result = await publicClient.simulateContract({
              address: UNISWAP_QUOTER_V2,
              abi: QUOTER_ABI,
              functionName: 'quoteExactInputSingle',
              args: [{ tokenIn: quoterAddress, tokenOut: USDC_ADDRESS, amountIn: parseUnits('1', token.decimals), fee, sqrtPriceLimitX96: 0n }],
            })
            const usdPrice = parseFloat(formatUnits(result.result[0], 6))
            if (usdPrice > 0) { prices[token.symbol] = usdPrice; priceFound = true; break }
          } catch { continue }
        }

        // Tier 2: token → WETH → USDC via Uniswap V3
        if (!priceFound && token.symbol !== 'WETH' && token.symbol !== 'ETH') {
          for (const fee of FEE_TIERS) {
            try {
              const result = await publicClient.simulateContract({
                address: UNISWAP_QUOTER_V2,
                abi: QUOTER_ABI,
                functionName: 'quoteExactInputSingle',
                args: [{ tokenIn: quoterAddress, tokenOut: UNISWAP_WETH, amountIn: parseUnits('1', token.decimals), fee, sqrtPriceLimitX96: 0n }],
              })
              const wethAmount = parseFloat(formatUnits(result.result[0], 18))
              if (wethAmount > 0 && prices['ETH']) {
                prices[token.symbol] = wethAmount * prices['ETH']; priceFound = true; break
              } else if (wethAmount > 0) {
                for (const wethFee of FEE_TIERS) {
                  try {
                    const wethResult = await publicClient.simulateContract({
                      address: UNISWAP_QUOTER_V2,
                      abi: QUOTER_ABI,
                      functionName: 'quoteExactInputSingle',
                      args: [{ tokenIn: UNISWAP_WETH, tokenOut: USDC_ADDRESS, amountIn: parseUnits('1', 18), fee: wethFee, sqrtPriceLimitX96: 0n }],
                    })
                    const wethUsd = parseFloat(formatUnits(wethResult.result[0], 6))
                    if (wethUsd > 0) { prices[token.symbol] = wethAmount * wethUsd; priceFound = true; break }
                  } catch { continue }
                }
                if (priceFound) break
              }
            } catch { continue }
          }
        }

        // Tier 3: Eloqura DEX pool reserves (for OEC and Eloqura-only tokens)
        if (!priceFound) {
          try {
            const pairAddress = await publicClient.readContract({
              address: ELOQURA_FACTORY,
              abi: FACTORY_ABI,
              functionName: 'getPair',
              args: [token.address as `0x${string}`, USDC_ADDRESS],
            }) as `0x${string}`

            if (pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000') {
              const [reserves, token0] = await Promise.all([
                publicClient.readContract({ address: pairAddress, abi: PAIR_ABI, functionName: 'getReserves' }) as Promise<[bigint, bigint, number]>,
                publicClient.readContract({ address: pairAddress, abi: PAIR_ABI, functionName: 'token0' }) as Promise<`0x${string}`>,
              ])
              const isToken0 = token0.toLowerCase() === token.address.toLowerCase()
              const tokenReserve = parseFloat(formatUnits(isToken0 ? reserves[0] : reserves[1], token.decimals))
              const usdcReserve = parseFloat(formatUnits(isToken0 ? reserves[1] : reserves[0], 6))
              if (tokenReserve > 0) { prices[token.symbol] = usdcReserve / tokenReserve; priceFound = true }
            }
          } catch {}
        }

        // ETH and WETH share price
        if (token.symbol === 'ETH' && prices['ETH'] && !prices['WETH']) prices['WETH'] = prices['ETH']
        if (token.symbol === 'WETH' && prices['WETH'] && !prices['ETH']) prices['ETH'] = prices['WETH']
      }

      // Also store prices by lowercase address for address-based lookups
      for (const t of pricingTokens) {
        const a = t.address.toLowerCase()
        if (prices[t.symbol] !== undefined) prices[a] = prices[t.symbol]
      }
      prices['eth'] = prices['ETH'] || 0

      setTokenPrices(prices)
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 60000)
    return () => clearInterval(interval)
  }, [publicClient, discoveredTokens])

  const getPrice = (symbol: string) => tokenPrices[symbol] || 0

  // Get native ETH balance
  const { data: ethBalance } = useBalance({ address })

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

  // Auto-expand sections with positions, collapse those without (only set once when data loads)
  useEffect(() => {
    if (stakingExpanded === null && stakingPositions.length > 0) {
      setStakingExpanded(activeStakingCount > 0)
    }
  }, [stakingPositions, activeStakingCount, stakingExpanded])

  useEffect(() => {
    if (lpExpanded === null && lpPositions.length > 0) {
      setLpExpanded(activeLpCount > 0)
    }
  }, [lpPositions, activeLpCount, lpExpanded])

  // Use false as fallback while loading
  const isStakingExpanded = stakingExpanded ?? false
  const isLpExpanded = lpExpanded ?? false

  // Section totals
  const visibleTokens = discoveredTokens.filter(t => !hiddenTokens.has(t.address.toLowerCase()))
  const tokensWithBalance = visibleTokens.length + (ethBalance && !hiddenTokens.has('eth') && parseFloat(ethBalance.formatted || '0') > 0 ? 1 : 0)
  const totalStakedDisplay = stakingPositions.reduce((sum, p) => sum + parseFloat(formatUnits(p.userStaked, p.stakingDecimals)), 0)
  const totalPendingDisplay = stakingPositions.reduce((sum, p) => sum + parseFloat(formatUnits(p.pendingRewards, p.rewardsDecimals)), 0)

  // USD value computations (include ALL tokens in portfolio total regardless of visibility)
  const ethUsdValue = ethBalance ? parseFloat(ethBalance.formatted || '0') * getPrice('ETH') : 0
  const holdingsUsdTotal = ethUsdValue + discoveredTokens.reduce((sum, t) => {
    const balance = parseFloat(formatUnits(BigInt(t.balance), t.decimals))
    return sum + balance * getPrice(t.address.toLowerCase())
  }, 0)

  const stakingUsdTotal = stakingPositions.reduce((sum, p) => {
    const staked = parseFloat(formatUnits(p.userStaked, p.stakingDecimals)) * getPrice(p.stakingSymbol)
    const rewards = parseFloat(formatUnits(p.pendingRewards, p.rewardsDecimals)) * getPrice(p.rewardsSymbol)
    return sum + staked + rewards
  }, 0)

  const lpUsdTotal = lpPositions.filter(p => p.userLpBalance > 0n).reduce((sum, lp) => {
    if (lp.totalSupply === 0n) return sum
    const userToken0 = (lp.reserve0 * lp.userLpBalance) / lp.totalSupply
    const userToken1 = (lp.reserve1 * lp.userLpBalance) / lp.totalSupply
    const val0 = parseFloat(formatUnits(userToken0, lp.token0Decimals)) * getPrice(lp.token0Symbol)
    const val1 = parseFloat(formatUnits(userToken1, lp.token1Decimals)) * getPrice(lp.token1Symbol)
    return sum + val0 + val1
  }, 0)

  // Alluria & Artivya mock data totals
  const alluriaPositionCount = MOCK_ALLURIA_POSITIONS.length
  const alluriaNetValue = MOCK_ALLURIA_POSITIONS.reduce((sum, p) => sum + (p.collateralValue - p.borrowed), 0)
  const artivyaNFTCount = MOCK_ARTIVYA_NFTS.length
  const artivyaTotalOec = MOCK_ARTIVYA_NFTS.reduce((sum, n) => sum + n.price, 0)
  const artivyaUsdTotal = artivyaTotalOec * getPrice(OEC_ADDRESS)

  const portfolioValueUsd = holdingsUsdTotal + stakingUsdTotal + lpUsdTotal + alluriaNetValue + artivyaUsdTotal

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)
  }

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
      <div style={{ background: 'linear-gradient(180deg, #080c12 0%, #0a0e15 50%, #090d13 100%)' }}>
        {/* Sticky top section: cards + nav */}
        <div className="sticky top-0 z-30 bg-[#080c12] pb-0">
          <div className="p-4 md:p-5 pb-0 max-w-7xl mx-auto">
            {/* Portfolio Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card className="p-4 border border-cyan-500/30 bg-[#0b0f16] hover:border-cyan-500/50 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] via-white/[0.01] to-transparent pointer-events-none" />
            <div className="relative z-10">
              <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>Portfolio Value</span>
              </p>
              <div className="text-2xl font-bold text-white">{formatPrice(portfolioValueUsd)}</div>
              <div className="text-xs text-gray-500 mt-1">{tokensWithBalance} asset{tokensWithBalance !== 1 ? 's' : ''} · {totalDefiPositions} position{totalDefiPositions !== 1 ? 's' : ''}</div>
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
                {discoveredTokens.length + 1}
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

            {/* Section Nav */}
            <nav className="flex items-center space-x-1 mt-3 pb-0.5 overflow-x-auto">
              {[
                { id: 'holdings', label: 'Holdings' },
                { id: 'staking', label: 'OEC Staking' },
                { id: 'eloqura', label: 'Eloqura LP' },
                { id: 'alluria', label: 'Alluria' },
                { id: 'artivya', label: 'Artivya NFTs' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className={`w-[90px] text-center py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    activeSection === item.id
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg'
                  }`}
                  style={activeSection === item.id ? { borderBottom: '2px solid #ff00ff' } : undefined}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="border-b border-gray-700" />
        </div>

        {/* Scrollable sections */}
        <div className="p-4 md:p-5 pt-3 max-w-7xl mx-auto space-y-3">

        {/* Token Holdings */}
        <Card id="holdings" className="border border-gray-700 bg-[#030712] rounded-lg shadow-md shadow-black/50 overflow-hidden scroll-mt-[200px]">
          <div className="p-5">
          <div
            className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-800/30 -m-2 p-2 rounded-lg transition-colors"
            onClick={() => setHoldingsExpanded(!holdingsExpanded)}
          >
            <div className="flex items-center space-x-3">
              <h2 className="text-xl leading-tight font-bold text-gray-300 uppercase tracking-wide">Holdings</h2>
              <button
                onClick={(e) => { e.stopPropagation(); setShowTokenSettings(true) }}
                className="p-1 rounded hover:bg-gray-700 transition-colors"
                title="Token visibility settings"
              >
                <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
              {holdingsExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div className="flex items-center space-x-3">
              {holdingsUsdTotal > 0 && <span className="text-xl leading-tight text-cyan-400 font-bold">{formatPrice(holdingsUsdTotal)}</span>}
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 bg-[#161b22] text-gray-300 hover:bg-[#1c2128] hover:text-white text-xs rounded-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open('https://eloqura.oeconomia.io/swap', '_blank')
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                <span className="w-[72px] text-center">Go to Swap</span>
              </Button>
            </div>
          </div>

          {holdingsExpanded && (
            <div>
              <div className="flex items-center justify-between py-2 px-3 mb-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <span className="text-xs text-gray-400">{tokensWithBalance} token{tokensWithBalance !== 1 ? 's' : ''} held</span>
                {hiddenTokens.size > 0 && (
                  <span className="text-xs text-gray-500">{hiddenTokens.size} hidden</span>
                )}
              </div>
              {tokensLoading ? (
                <LoadingSpinner text="Discovering tokens" size="lg" />
              ) : (
                <div className="divide-y divide-gray-800">
                  {/* ETH Balance */}
                  {ethBalance && !hiddenTokens.has('eth') && (
                    <div className="flex items-center justify-between p-2">
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
                        <div className="text-sm text-cyan-400">
                          {ethUsdValue > 0 ? formatPrice(ethUsdValue) : '---'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Discovered ERC-20 Token Balances (auto-discovered, filtered by visibility) */}
                  {visibleTokens.map((token) => {
                    const meta = KNOWN_TOKEN_META[token.address.toLowerCase()]
                    const displayName = meta?.name || token.name
                    const displaySymbol = meta?.symbol || token.symbol
                    const displayLogo = meta?.logo || token.logo
                    const balance = parseFloat(formatUnits(BigInt(token.balance), token.decimals))
                    const usdValue = balance * getPrice(token.address.toLowerCase())
                    return (
                      <div key={token.address} className="flex items-center justify-between p-2">
                        <div className="flex items-center space-x-2">
                          {displayLogo ? (
                            <img
                              src={displayLogo}
                              alt={displaySymbol}
                              className="w-7 h-7 rounded-full"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `<div class="w-7 h-7 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-white font-bold text-xs">${displaySymbol.slice(0, 3)}</div>`;
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {displaySymbol.slice(0, 3)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{displayName}</div>
                            <div className="text-sm text-gray-400">{displaySymbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatNumber(balance)} {displaySymbol}</div>
                          <div className="text-sm text-cyan-400">
                            {usdValue > 0 ? formatPrice(usdValue) : '---'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          </div>
        </Card>

        {/* Token Visibility Modal */}
        {showTokenSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowTokenSettings(false)}>
            <div className="bg-[#0b0f16] border border-gray-700 rounded-xl p-5 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Token Visibility</h3>
                <button onClick={() => setShowTokenSettings(false)} className="p-1 rounded hover:bg-gray-700 transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-2">
                {/* ETH toggle */}
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50">
                  <div className="flex items-center space-x-2">
                    <img src="https://assets.coingecko.com/coins/images/279/small/ethereum.png" alt="ETH" className="w-6 h-6 rounded-full" />
                    <div>
                      <div className="text-sm font-medium">Sepolia ETH</div>
                      <div className="text-xs text-gray-400">ETH</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTokenVisibility('eth')}
                    className={`w-10 h-5 rounded-full transition-colors relative ${!hiddenTokens.has('eth') ? 'bg-cyan-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${!hiddenTokens.has('eth') ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {/* Discovered token toggles */}
                {discoveredTokens.map((token) => {
                  const meta = KNOWN_TOKEN_META[token.address.toLowerCase()]
                  const displayName = meta?.name || token.name
                  const displaySymbol = meta?.symbol || token.symbol
                  const displayLogo = meta?.logo || token.logo
                  return (
                    <div key={token.address} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50">
                      <div className="flex items-center space-x-2">
                        {displayLogo ? (
                          <img src={displayLogo} alt={displaySymbol} className="w-6 h-6 rounded-full" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        ) : (
                          <div className="w-6 h-6 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                            {displaySymbol.slice(0, 3)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium">{displayName}</div>
                          <div className="text-xs text-gray-400">{displaySymbol}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleTokenVisibility(token.address.toLowerCase())}
                        className={`w-10 h-5 rounded-full transition-colors relative ${!hiddenTokens.has(token.address.toLowerCase()) ? 'bg-cyan-500' : 'bg-gray-600'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${!hiddenTokens.has(token.address.toLowerCase()) ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                <button
                  onClick={() => { setHiddenTokens(new Set()); localStorage.removeItem('dao-hidden-tokens') }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Show All
                </button>
                <Button
                  size="sm"
                  onClick={() => setShowTokenSettings(false)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded-lg"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* OEC Staking Positions */}
        <Card id="staking" className="border border-gray-700 bg-[#030712] rounded-lg shadow-md shadow-black/50 overflow-hidden scroll-mt-[200px]">
          <div className="p-5">
          <div
            className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-800/30 -m-2 p-2 rounded-lg transition-colors"
            onClick={() => setStakingExpanded(!isStakingExpanded)}
          >
            <div className="flex items-center space-x-3">
              <Coins className="w-4 h-4 text-purple-400" />
              <h2 className="text-xl leading-tight font-bold text-gray-300 uppercase tracking-wide">OEC Staking</h2>
              <span className="text-xs text-gray-500">({poolCount} pool{poolCount !== 1 ? 's' : ''})</span>
              {isStakingExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div className="flex items-center space-x-3">
              {stakingUsdTotal > 0 && <span className="text-xl leading-tight text-cyan-400 font-bold">{formatPrice(stakingUsdTotal)}</span>}
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 bg-[#161b22] text-gray-300 hover:bg-[#1c2128] hover:text-white text-xs rounded-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open('https://staking.oeconomia.io/pools', '_blank')
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                <span className="w-[72px] text-center">Go to Staking</span>
              </Button>
            </div>
          </div>

          {isStakingExpanded && (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <span className="text-xs text-gray-400">Total Staked: {formatCompact(totalStakedDisplay)} OEC</span>
                {totalPendingDisplay > 0 && (
                  <span className="text-xs text-yellow-400 flex items-center space-x-1">
                    <Gift className="w-3 h-3" />
                    <span>Pending: {formatCompact(totalPendingDisplay)} OEC</span>
                  </span>
                )}
              </div>
              {stakingLoading ? (
                <LoadingSpinner text="Loading staking positions" size="lg" />
              ) : stakingPositions.filter(p => p.userStaked > 0n).length === 0 ? (
                <div className="text-center py-6">
                  <Sprout className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No active stakes found</p>
                </div>
              ) : (
                stakingPositions.filter(pool => pool.userStaked > 0n).map((pool) => {
                  const gradients = [
                    { bg: 'from-cyan-500/5 to-blue-600/5', hover: 'hover:from-cyan-500/10 hover:to-blue-600/10', border: 'border-cyan-500/30', icon: 'from-cyan-500 to-blue-600', badge: 'bg-cyan-500/20 text-cyan-400' },
                    { bg: 'from-purple-500/5 to-pink-600/5', hover: 'hover:from-purple-500/10 hover:to-pink-600/10', border: 'border-purple-500/30', icon: 'from-purple-500 to-pink-600', badge: 'bg-purple-500/20 text-purple-400' },
                    { bg: 'from-green-500/5 to-teal-600/5', hover: 'hover:from-green-500/10 hover:to-teal-600/10', border: 'border-green-500/30', icon: 'from-green-500 to-teal-600', badge: 'bg-green-500/20 text-green-400' },
                    { bg: 'from-orange-500/5 to-red-600/5', hover: 'hover:from-orange-500/10 hover:to-red-600/10', border: 'border-orange-500/30', icon: 'from-orange-500 to-red-600', badge: 'bg-orange-500/20 text-orange-400' },
                  ]
                  const g = gradients[pool.poolId % gradients.length]
                  return (
                  <Card key={pool.poolId} className={`p-4 border ${g.border} bg-gradient-to-r ${g.bg} ${g.hover} transition-all duration-200`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-r ${g.icon} flex items-center justify-center`}>
                          <Sprout className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{pool.stakingSymbol} Staking</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${g.badge}`}>
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
                        <div className="text-xs text-cyan-400">
                          {pool.userStaked > 0n && getPrice(pool.stakingSymbol) > 0
                            ? formatPrice(parseFloat(formatUnits(pool.userStaked, pool.stakingDecimals)) * getPrice(pool.stakingSymbol))
                            : '---'}
                        </div>
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
                  )
                })
              )}
            </div>
          )}
          </div>
        </Card>

        {/* Eloqura LP Positions */}
        <Card id="eloqura" className="border border-gray-700 bg-[#030712] rounded-lg shadow-md shadow-black/50 overflow-hidden scroll-mt-[200px]">
          <div className="p-5">
          <div
            className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-800/30 -m-2 p-2 rounded-lg transition-colors"
            onClick={() => setLpExpanded(!isLpExpanded)}
          >
            <div className="flex items-center space-x-3">
              <Droplets className="w-4 h-4 text-teal-400" />
              <h2 className="text-xl leading-tight font-bold text-gray-300 uppercase tracking-wide">Eloqura Liquidity</h2>
              <span className="text-xs text-gray-500">({activeLpCount} position{activeLpCount !== 1 ? 's' : ''})</span>
              {isLpExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div className="flex items-center space-x-3">
              {lpUsdTotal > 0 && <span className="text-xl leading-tight text-cyan-400 font-bold">{formatPrice(lpUsdTotal)}</span>}
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 bg-[#161b22] text-gray-300 hover:bg-[#1c2128] hover:text-white text-xs rounded-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open('https://eloqura.oeconomia.io/liquidity', '_blank')
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                <span className="w-[72px] text-center">Go to Eloqura</span>
              </Button>
            </div>
          </div>

          {isLpExpanded && (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <span className="text-xs text-gray-400">{activeLpCount} active position{activeLpCount !== 1 ? 's' : ''}</span>
              </div>
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
                          {(() => {
                            const lpVal = parseFloat(formatUnits(userToken0, lp.token0Decimals)) * getPrice(lp.token0Symbol)
                              + parseFloat(formatUnits(userToken1, lp.token1Decimals)) * getPrice(lp.token1Symbol)
                            return lpVal > 0
                              ? <div className="text-xs text-cyan-400">{formatPrice(lpVal)}</div>
                              : <div className="text-xs text-gray-400">{userShare > 0 ? `${userShare.toFixed(2)}% share` : '---'}</div>
                          })()}
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

        {/* Alluria Positions & Stakes */}
        <Card id="alluria" className="border border-gray-700 bg-[#030712] rounded-lg shadow-md shadow-black/50 overflow-hidden scroll-mt-[200px]">
          <div className="p-5">
          <div
            className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-800/30 -m-2 p-2 rounded-lg transition-colors"
            onClick={() => setAlluriaExpanded(!alluriaExpanded)}
          >
            <div className="flex items-center space-x-3">
              <Gem className="w-4 h-4 text-amber-400" />
              <h2 className="text-xl leading-tight font-bold text-gray-300 uppercase tracking-wide">Alluria Positions & Stakes</h2>
              <span className="text-xs text-gray-500">({alluriaPositionCount} position{alluriaPositionCount !== 1 ? 's' : ''})</span>
              {alluriaExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div className="flex items-center space-x-3">
              {alluriaNetValue > 0 && <span className="text-xl leading-tight text-cyan-400 font-bold">{formatPrice(alluriaNetValue)}</span>}
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 bg-[#161b22] text-gray-300 hover:bg-[#1c2128] hover:text-white text-xs rounded-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open('https://alluria.oeconomia.io', '_blank')
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                <span className="w-[72px] text-center">Go to Alluria</span>
              </Button>
            </div>
          </div>

          {alluriaExpanded && (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <span className="text-xs text-gray-400">{alluriaPositionCount} lending position{alluriaPositionCount !== 1 ? 's' : ''}</span>
              </div>
              {alluriaPositionCount === 0 ? (
                <div className="text-center py-6">
                  <Gem className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No Alluria positions or stakes</p>
                  <p className="text-xs text-gray-500 mt-1">Stake or participate in Alluria to see your positions here</p>
                </div>
              ) : (
                MOCK_ALLURIA_POSITIONS.map((pos) => {
                  const netValue = pos.collateralValue - pos.borrowed
                  const ratioColor = pos.ratio < 120 ? 'text-red-400' : pos.ratio < 150 ? 'text-yellow-400' : 'text-green-400'
                  return (
                    <Card key={pos.id} className="p-4 border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5 hover:from-amber-500/10 hover:to-orange-500/10 transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{pos.collateral} Lending</span>
                              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">CDP #{pos.id}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              Collateral → Borrow ALUD
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatPrice(netValue)}</div>
                          <div className="text-xs text-cyan-400">Net value</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-700/50">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Collateral</div>
                          <div className="text-sm">{pos.collateralAmount} {pos.collateral}</div>
                          <div className="text-xs text-gray-500">{formatPrice(pos.collateralValue)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Borrowed</div>
                          <div className="text-sm">{formatCompact(pos.borrowed)} ALUD</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Ratio</div>
                          <div className={`text-sm font-medium ${ratioColor}`}>{pos.ratio}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Interest</div>
                          <div className="text-sm">{pos.interestRate}% APR</div>
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

        {/* Artivya NFTs */}
        <Card id="artivya" className="border border-gray-700 bg-[#030712] rounded-lg shadow-md shadow-black/50 overflow-hidden scroll-mt-[200px]">
          <div className="p-5">
          <div
            className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-800/30 -m-2 p-2 rounded-lg transition-colors"
            onClick={() => setArtivyaExpanded(!artivyaExpanded)}
          >
            <div className="flex items-center space-x-3">
              <Palette className="w-4 h-4 text-pink-400" />
              <h2 className="text-xl leading-tight font-bold text-gray-300 uppercase tracking-wide">Artivya NFTs</h2>
              <span className="text-xs text-gray-500">({artivyaNFTCount} NFT{artivyaNFTCount !== 1 ? 's' : ''})</span>
              {artivyaExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div className="flex items-center space-x-3">
              {artivyaUsdTotal > 0 && <span className="text-xl leading-tight text-cyan-400 font-bold">{formatPrice(artivyaUsdTotal)}</span>}
              {artivyaUsdTotal === 0 && artivyaTotalOec > 0 && <span className="text-xl leading-tight text-cyan-400 font-bold">{formatCompact(artivyaTotalOec)} OEC</span>}
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 bg-[#161b22] text-gray-300 hover:bg-[#1c2128] hover:text-white text-xs rounded-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open('https://artivya.oeconomia.io', '_blank')
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                <span className="w-[72px] text-center">Go to Artivya</span>
              </Button>
            </div>
          </div>

          {artivyaExpanded && (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <span className="text-xs text-gray-400">{artivyaNFTCount} NFT{artivyaNFTCount !== 1 ? 's' : ''} · {formatCompact(artivyaTotalOec)} OEC total</span>
              </div>
              {artivyaNFTCount === 0 ? (
                <div className="text-center py-6">
                  <Palette className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No Artivya NFTs</p>
                  <p className="text-xs text-gray-500 mt-1">Collect NFTs on Artivya to see them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {MOCK_ARTIVYA_NFTS.map((nft) => {
                    const nftUsd = nft.price * getPrice(OEC_ADDRESS)
                    return (
                      <Card key={nft.id} className="p-3 border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5 hover:from-pink-500/10 hover:to-purple-500/10 transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                            <img src="/oec-logo.png" alt="NFT" className="w-7 h-7 rounded" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{nft.name}</div>
                            <div className="text-xs text-gray-400 truncate">{nft.collection}</div>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded border ${getRarityBg(nft.rarity)}`}>
                                {nft.rarity}
                              </span>
                              <span className="text-xs text-white font-medium">{nft.price} OEC</span>
                              {nftUsd > 0 && <span className="text-xs text-cyan-400">{formatPrice(nftUsd)}</span>}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
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
