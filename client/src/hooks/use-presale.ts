import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import {
  getTokensSold,
  getPresaleEndTime,
  getPresaleActive,
  getUserAllocation,
  getHasClaimed,
  getUsdcAllowance,
  getUsdcBalance,
  HARD_CAP,
  OEC_DECIMALS,
  USDC_DECIMALS,
  PRESALE_CONTRACT,
} from '@/services/presale-contract';

interface PresaleState {
  tokensSold: number;
  hardCap: number;
  presaleEndTime: number;       // Unix timestamp (seconds)
  timeRemaining: number;        // Seconds until end
  isPresaleActive: boolean;
  userAllocation: number;       // OEC allocated to connected user
  hasClaimed: boolean;
  usdcAllowance: number;
  usdcBalance: number;
  isLoading: boolean;
  error: string | null;
}

const POLL_INTERVAL = 15_000; // 15 seconds

// Don't poll if presale contract is zero address (placeholder)
const IS_PLACEHOLDER = PRESALE_CONTRACT === '0x0000000000000000000000000000000000000000';

export function usePresale(): PresaleState & { refetch: () => void } {
  const { address, isConnected } = useAccount();

  const [state, setState] = useState<PresaleState>({
    tokensSold: 0,
    hardCap: HARD_CAP,
    presaleEndTime: 0,
    timeRemaining: 0,
    isPresaleActive: true,  // Default to true for UI preview
    userAllocation: 0,
    hasClaimed: false,
    usdcAllowance: 0,
    usdcBalance: 0,
    isLoading: !IS_PLACEHOLDER,
    error: null,
  });

  const fetchPresaleData = useCallback(async () => {
    // Skip contract reads if using placeholder address
    if (IS_PLACEHOLDER) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const [tokensSoldRaw, endTimeRaw, isActive] = await Promise.all([
        getTokensSold(),
        getPresaleEndTime(),
        getPresaleActive(),
      ]);

      const tokensSold = Number(formatUnits(tokensSoldRaw, OEC_DECIMALS));
      const presaleEndTime = Number(endTimeRaw);
      const now = Math.floor(Date.now() / 1000);
      const timeRemaining = Math.max(0, presaleEndTime - now);

      let userAllocation = 0;
      let hasClaimed = false;
      let usdcAllowance = 0;
      let usdcBalance = 0;

      if (isConnected && address) {
        const [allocRaw, claimed, allowanceRaw, balanceRaw] = await Promise.all([
          getUserAllocation(address),
          getHasClaimed(address),
          getUsdcAllowance(address),
          getUsdcBalance(address),
        ]);
        userAllocation = Number(formatUnits(allocRaw, OEC_DECIMALS));
        hasClaimed = claimed;
        usdcAllowance = Number(formatUnits(allowanceRaw, USDC_DECIMALS));
        usdcBalance = Number(formatUnits(balanceRaw, USDC_DECIMALS));
      }

      setState({
        tokensSold,
        hardCap: HARD_CAP,
        presaleEndTime,
        timeRemaining,
        isPresaleActive: isActive,
        userAllocation,
        hasClaimed,
        usdcAllowance,
        usdcBalance,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.warn('Presale data fetch error:', err?.message);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Failed to load presale data',
      }));
    }
  }, [address, isConnected]);

  // Poll contract state
  useEffect(() => {
    fetchPresaleData();
    const interval = setInterval(fetchPresaleData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPresaleData]);

  // Countdown timer — ticks every second
  useEffect(() => {
    if (state.presaleEndTime === 0) return;
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, state.presaleEndTime - now);
      setState(prev => ({ ...prev, timeRemaining: remaining }));
    }, 1000);
    return () => clearInterval(timer);
  }, [state.presaleEndTime]);

  return { ...state, refetch: fetchPresaleData };
}
