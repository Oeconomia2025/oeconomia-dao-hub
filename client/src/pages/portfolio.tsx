import { useAccount, useBalance, useReadContracts } from 'wagmi'
import { erc20Abi, formatUnits } from 'viem'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Plus, ExternalLink, Droplets, Sprout, Gift, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
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

interface PoolFarm {
  id: string
  protocol: string
  type: 'pool' | 'farm'
  pair: string
  apr: number
  tvl: number
  userBalance: number
  userValue: number
  rewards?: {
    token: string
    amount: number
    value: number
  }[]
}

export function Portfolio() {
  const { address, isConnected } = useAccount()
  const [holdingsExpanded, setHoldingsExpanded] = useState(true)

  // Static pools/farms data - simplified for demo purposes
  const [poolsFarms] = useState<PoolFarm[]>([
    {
      id: 'demo-pool',
      protocol: 'Demo Protocol',
      type: 'pool',
      pair: 'Demo Pool',
      apr: 0,
      tvl: 0,
      userBalance: 0,
      userValue: 0,
      rewards: []
    }
  ])

  // Get native ETH balance
  const { data: ethBalance } = useBalance({
    address,
  })

  // Read ERC-20 balances directly from Sepolia
  const { data: tokenResults, isLoading: balancesLoading } = useReadContracts({
    contracts: address ? SEPOLIA_TOKENS.map(token => ({
      address: token.address,
      abi: erc20Abi,
      functionName: 'balanceOf' as const,
      args: [address],
    })) : [],
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 30000,
    },
  })

  // Map results to token data
  const tokenBalances = SEPOLIA_TOKENS.map((token, i) => {
    const result = tokenResults?.[i]
    const rawBalance = result?.status === 'success' ? (result.result as bigint) : 0n
    const balance = formatUnits(rawBalance, token.decimals)
    return {
      ...token,
      balance,
      rawBalance,
    }
  })

  const formatNumber = (num: number) => {
    if (isNaN(num) || !isFinite(num)) return '0'
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 5 
    })
  }

  const formatPrice = (price: number) => {
    if (isNaN(price) || !isFinite(price)) return '0'
    return formatNumber(price) // Display ETH values directly
  }

  const getTokenLogo = (symbol: string) => {
    const token = SEPOLIA_TOKENS.find(t => t.symbol === symbol)
    return token?.logo || '/oec-logo.png'
  }
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  // Remove portfolio value calculations
  
  // Total rewards value
  const totalRewardsValue = poolsFarms.reduce((sum, item) => {
    return sum + (item.rewards?.reduce((rewardSum, reward) => rewardSum + reward.value, 0) || 0)
  }, 0)

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
                {poolsFarms.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">Active pools & farms</div>
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

        {/* Pools & Farms */}
        <Card className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent pointer-events-none" />
          <div className="relative z-10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Pools & Farms</h2>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-[#161b22] text-gray-300 hover:bg-[#1c2128] hover:text-white text-xs rounded-lg"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Add Position
            </Button>
          </div>

          <div className="space-y-4">
            {poolsFarms.map((item) => (
              <Card key={item.id} className={`p-4 border transition-all duration-200 ${
                item.type === 'pool' 
                  ? 'border-teal-500/40 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 hover:from-teal-500/10 hover:to-cyan-500/10' 
                  : 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 to-green-500/5 hover:from-emerald-500/10 hover:to-green-500/10'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.type === 'pool' 
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500' 
                        : 'bg-gradient-to-r from-emerald-500 to-green-500'
                    }`}>
                      {item.type === 'pool' ? (
                        <Droplets className="w-5 h-5 text-white" />
                      ) : (
                        <Sprout className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{item.pair}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.type === 'pool' 
                            ? 'bg-teal-500/20 text-teal-400' 
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {item.type === 'pool' ? 'Pool' : 'Farm'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">{item.protocol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatPrice(item.userValue)}</div>
                    <div className="text-sm text-gray-400">
                      {item.type === 'pool' ? `${formatNumber(item.userBalance)} LP` : `${formatNumber(item.userBalance)} tokens`}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-3 border-t border-gray-700">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">APR</div>
                    <div className="text-sm font-medium text-crypto-green">
                      {item.apr.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">TVL</div>
                    <div className="text-sm">
                      {formatPrice(item.tvl)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Pending Rewards</div>
                    <div className="text-sm">
                      {item.rewards && item.rewards.length > 0 ? (
                        <div className="flex items-center space-x-1">
                          <Gift className="w-3 h-3 text-crypto-gold" />
                          <span>{formatPrice(item.rewards.reduce((sum, r) => sum + r.value, 0))}</span>
                        </div>
                      ) : (
                        <span>None</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className={`text-xs ${
                        item.type === 'pool'
                          ? 'border-teal-500/30 text-teal-400 hover:bg-teal-500/10'
                          : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      Claim
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className={`text-xs ${
                        item.type === 'pool'
                          ? 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                          : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                      }`}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {poolsFarms.length === 0 && (
              <div className="text-center py-8">
                <Droplets className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No DeFi positions found</p>
                <p className="text-sm text-gray-500">
                  Add liquidity or stake tokens to see your pools and farms here
                </p>
              </div>
            )}
          </div>
          </div>
        </Card>
        </div>
      </div>
    </Layout>
  )
}