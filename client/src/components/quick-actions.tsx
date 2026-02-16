import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TestnetModal } from "./testnet-modal";

interface QuickActionsProps {
  contractAddress: string;
}

export function QuickActions({ contractAddress }: QuickActionsProps) {
  const [showTestnetModal, setShowTestnetModal] = useState(false);

  return (
    <>
      <div>
        <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 relative overflow-hidden">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="bg-crypto-blue/10 hover:bg-crypto-blue/20 border-crypto-blue/30 rounded-lg p-4 h-auto flex-col space-y-2 group cursor-default"
              disabled
            >
              <img src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/Eloqura.png" alt="Eloqura" className="w-8 h-8 rounded-full" />
              <div className="text-center">
                <div className="font-medium">Trade on Eloqura</div>
                <div className="text-sm text-gray-400">Coming soon</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="bg-crypto-green/10 hover:bg-crypto-green/20 border-crypto-green/30 rounded-lg p-4 h-auto flex-col space-y-2 group cursor-default"
              disabled
            >
              <img src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/Etherscan%20Darkmode.png" alt="Etherscan" className="w-8 h-8 rounded" />
              <div className="text-center">
                <div className="font-medium">View on Etherscan</div>
                <div className="text-sm text-gray-400">Coming soon</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowTestnetModal(true)}
              className="bg-crypto-gold/10 hover:bg-crypto-gold/20 border-crypto-gold/30 rounded-lg p-4 h-auto flex-col space-y-2 group"
            >
              <img src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/images/OEC%20Logo.png" alt="OEC" className="w-8 h-8 rounded-full group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="font-medium">Testnet Version</div>
                <div className="text-sm text-gray-400">Test deployment info</div>
              </div>
            </Button>
          </div>
        </Card>
      </div>

      <TestnetModal
        isOpen={showTestnetModal}
        onClose={() => setShowTestnetModal(false)}
      />
    </>
  );
}
