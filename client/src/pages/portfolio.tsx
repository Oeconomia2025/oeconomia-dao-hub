import { useAccount, useBalance } from 'wagmi'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet, TrendingUp, DollarSign, PieChart, Plus, ExternalLink, Droplets, Sprout, Gift, ChevronDown, ChevronUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { WalletConnect } from "@/components/wallet-connect"
import { WalletSetupGuide } from "@/components/wallet-setup-guide"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Layout } from "@/components/layout"

interface TokenBalance {
  address: string
  symbol: string
  name: string
  balance: string
  decimals: number
  price?: number
  value?: number
}

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
  const [watchedTokens, setWatchedTokens] = useState<string[]>([
    '0x55d398326f99059fF775485246999027B3197955', // USDT
    '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
    '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // ETH
    '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', // BTCB
  ])

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

  // Get native BNB balance
  const { data: bnbBalance } = useBalance({
    address,
  })

  // Fetch token balances for watched tokens
  const { data: tokenBalances, isLoading: balancesLoading } = useQuery({
    queryKey: ['/api/portfolio', address, watchedTokens],
    queryFn: async () => {
      if (!address) return []
      const response = await fetch(`/api/portfolio/${address}?tokens=${watchedTokens.join(',')}`)
      if (!response.ok) throw new Error('Failed to fetch portfolio')
      return response.json()
    },
    enabled: !!address && isConnected,
    refetchInterval: 60000, // Refresh every 60 seconds (doubled to reduce API rate limiting)
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

  // Token logo mapping - matches swap page logos
  const getTokenLogo = (symbol: string, address?: string) => {
    const logoMap: Record<string, string> = {
      'OEC': '/oec-logo.png',
      'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
      'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=032',
      'BUSD': 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png',
      'USDC': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
      'ETH': 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
      'WETH': 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
      'BTCB': 'https://assets.coingecko.com/coins/images/14108/small/Binance-bitcoin.png',
      'BTC': 'https://assets.coingecko.com/coins/images/14108/small/Binance-bitcoin.png',
      'CAKE': 'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo_.png',
      'XVS': 'https://assets.coingecko.com/coins/images/12677/small/venus.png'
    }
    
    // Use address-based fallback if symbol lookup fails
    if (address) {
      const addressLookup: Record<string, string> = {
        '0x55d398326f99059fF775485246999027B3197955': 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=032',
        '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56': 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png',
        '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
        '0x2170Ed0880ac9A755fd29B2688956BD959F933F8': 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
        '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c': 'https://assets.coingecko.com/coins/images/14108/small/Binance-bitcoin.png',
        '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
      };
      return addressLookup[address.toLowerCase()] || logoMap[symbol.toUpperCase()] || '/oec-logo.png';
    }
    
    return logoMap[symbol.toUpperCase()] || '/oec-logo.png'
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
                      window.open(`https://bscscan.com/address/${address}`, '_blank')
                    }
                  }}
                >
                  View on BSCScan <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
            <div className="relative z-10">
              <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Assets Tracked</p>
              <div className="text-2xl font-bold text-white">
                {(tokenBalances?.length || 0) + 1}
              </div>
              <div className="text-xs text-gray-500 mt-1">Including BNB</div>
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
                  {/* BNB Balance */}
                  {bnbBalance && parseFloat(bnbBalance.formatted) > 0 && (
                    <div className="flex items-center justify-between p-2 bg-[var(--crypto-dark)]/50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={getTokenLogo('BNB')} 
                          alt="BNB" 
                          className="w-7 h-7 rounded-full"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<div class="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xs">BNB</div>';
                          }}
                        />
                        <div>
                          <div className="font-medium">Binance Coin</div>
                          <div className="text-sm text-gray-400">BNB</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatNumber(parseFloat(bnbBalance.formatted || '0'))} BNB</div>
                        <div className="text-sm text-gray-400">Native BNB</div>
                      </div>
                    </div>
                  )}

                  {/* Token Balances */}
                  {tokenBalances?.map((token: TokenBalance) => {
                    const balance = parseFloat(token.balance) / Math.pow(10, token.decimals)
                    
                    return (
                      <div key={token.address} className="flex items-center justify-between p-2 bg-[var(--crypto-dark)]/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={getTokenLogo(token.symbol, token.address)} 
                            alt={token.symbol} 
                            className="w-7 h-7 rounded-full"
                            onError={(e) => {
                              // Fallback if image fails to load
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
                          <div className="font-medium">{formatNumber(balance)} {token.symbol}</div>
                          <div className="text-sm text-gray-400">
                            {token.value && token.value > 0 && isFinite(token.value) ? formatPrice(token.value) : '---'}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {(!tokenBalances || tokenBalances.length === 0) && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No token balances found</p>
                    </div>
                  )}
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