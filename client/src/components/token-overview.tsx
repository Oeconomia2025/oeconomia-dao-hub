import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TrendingUp, BarChart3, ArrowUpDown, Droplets, DollarSign } from "lucide-react";
import type { TokenData } from "@shared/schema";
import { useNetworkStatus } from "@/hooks/use-token-data";

interface TokenOverviewProps {
  tokenData?: any; // Accept both TokenData and Live Coin Watch format
  isLoading: boolean;
}

export function TokenOverview({ tokenData, isLoading }: TokenOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 border border-gray-800/60 bg-[#0b0f16] rounded-lg">
            <Skeleton className="h-4 w-20 mb-4" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] rounded-lg text-center">
          <p className="text-gray-400">Live data unavailable on static deployment</p>
          <p className="text-gray-500 text-sm mt-2">Connect to a development environment for real-time token data</p>
        </Card>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(5);
    return parseFloat(fixed).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 5
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  const formatMarketCap = (cap: number) => formatNumber(cap);
  const formatVolume = (vol: number) => formatNumber(vol);
  const formatLiquidity = (liq: number) => formatNumber(liq);
  // Handle both database format (Live Coin Watch) and TokenData format
  const price = tokenData.rate || tokenData.price || 0;
  const symbol = tokenData.code || tokenData.symbol || 'ETH';
  const name = tokenData.name || 'Ethereum';
  const marketCap = tokenData.cap || tokenData.marketCap || 0;
  const volume24h = tokenData.volume || tokenData.volume24h || 0;
  const priceChange24h = tokenData.delta?.day || tokenData.priceChangePercent24h || 0;
  const totalSupply = tokenData.totalSupply || 0;
  const circulatingSupply = tokenData.circulatingSupply || 0;

  const formatSupply = (supply: number) => `${formatNumber(supply)} ${symbol}`;

  const { data: networkStatus } = useNetworkStatus();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
      {/* ETH Network Card */}
      <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-200 text-sm font-medium">ETH Network</h3>
            <img src="/eth-logo.png" alt="ETH" className="w-7 h-7 opacity-70" />
          </div>
          {networkStatus ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Gas Price</span>
                <span className="text-green-400">{networkStatus.gasPrice} Gwei</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-400">Block</span>
                <span className="text-white">{networkStatus.blockNumber.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">Unable to fetch network status</div>
          )}
        </div>
      </Card>

      {/* Market Cap Card */}
      <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-200 text-sm font-medium">Market Cap</h3>
            <BarChart3 className="text-gray-300 w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-white drop-shadow-sm">${formatMarketCap(marketCap)}</div>
          <div className="text-sm text-gray-400 mt-2">
            Total Supply: {totalSupply ? formatNumber(totalSupply) : 'N/A'} {symbol}
          </div>
        </div>
      </Card>

      {/* Volume Card */}
      <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-200 text-sm font-medium">24h Volume</h3>
            <ArrowUpDown className="text-gray-300 w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-white drop-shadow-sm">${formatVolume(volume24h)}</div>
          <div className="text-sm text-gray-400 mt-2">
            Volume Statistics
          </div>
        </div>
      </Card>

      {/* Circulating Supply Card */}
      <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-200 text-sm font-medium">Circulating Supply</h3>
            <DollarSign className="text-gray-300 w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-white drop-shadow-sm">{formatNumber(circulatingSupply)}</div>
          <div className="text-sm text-gray-400 mt-2">{symbol} in circulation</div>
        </div>
      </Card>
    </div>
  );
}