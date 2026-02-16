import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TokenData } from "@shared/schema";

interface TokenInfoPanelProps {
  tokenData?: TokenData;
  isLoading: boolean;
}

export function TokenInfoPanel({ tokenData, isLoading }: TokenInfoPanelProps) {
  if (isLoading) {
    return (
      <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] rounded-lg">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 relative overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">Contract Information</h3>
      <div className="space-y-2">
        <div className="flex justify-between p-2 rounded-md hover:bg-[var(--crypto-dark)] transition-colors">
          <span className="text-gray-400">Network</span>
          <span className="text-crypto-green">ETH</span>
        </div>
        <div className="flex justify-between p-2 rounded-md hover:bg-[var(--crypto-dark)] transition-colors">
          <span className="text-gray-400">Decimals</span>
          <span>18</span>
        </div>
      </div>
    </Card>
  );
}
