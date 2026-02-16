import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb } from "lucide-react";
import { useTopHolders } from "@/hooks/use-token-data";
import type { Holder, TokenData } from "@shared/schema";

interface HolderStatisticsProps {
  contractAddress: string;
  tokenData?: TokenData;
}

export function HolderStatistics({ contractAddress, tokenData }: HolderStatisticsProps) {
  const { data: topHolders, isLoading } = useTopHolders(contractAddress);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: number, symbol: string = "OEC") => {
    const fixed = balance.toFixed(5);
    const formatted = parseFloat(fixed).toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 5 
    });
    return `${formatted} ${symbol}`;
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-amber-600 to-amber-800';
      default:
        return 'from-crypto-gold to-crypto-blue';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 relative overflow-hidden">
        <h3 className="text-lg font-semibold mb-4">Top Holders</h3>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[var(--crypto-dark)]/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : !topHolders || topHolders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Holder data unavailable on static deployment</p>
            <p className="text-gray-500 text-sm mt-2">Requires live blockchain API access</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topHolders.slice(0, 10).map((holder) => (
              <div key={holder.address} className="flex items-center justify-between p-3 bg-[var(--crypto-dark)]/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 bg-gradient-to-r ${getRankColor(holder.rank)} rounded-full flex items-center justify-center text-xs font-bold text-black`}>
                    {holder.rank}
                  </div>
                  <code className="text-sm">{formatAddress(holder.address)}</code>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatBalance(holder.balance)}</div>
                  <div className="text-xs text-gray-400">{holder.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 relative overflow-hidden">
        <h3 className="text-lg font-semibold mb-4">Distribution</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Circulating Supply</span>
              <span>0 OEC (0%)</span>
            </div>
            <Progress
              value={0}
              className="h-2"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Operations Reserve</span>
              <span>0 OEC (0%)</span>
            </div>
            <Progress
              value={0}
              className="h-2"
            />
          </div>

          <div className="mt-6 p-4 bg-crypto-blue/10 rounded-lg border border-crypto-blue/20">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="text-crypto-blue w-5 h-5" />
              <span className="font-medium text-crypto-blue">Future Governance</span>
            </div>
            <p className="text-sm text-gray-400">
              Token designed for future staking/governance wrapper integration with Tally platform.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
