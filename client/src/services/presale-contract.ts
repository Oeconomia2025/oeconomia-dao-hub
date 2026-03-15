import { createPublicClient, createWalletClient, http, custom, parseUnits, formatUnits, type Address } from 'viem';
import { sepolia } from 'viem/chains';

// ============================================================
// Placeholder addresses — TODO: Replace with actual addresses
// ============================================================
export const PRESALE_CONTRACT: Address = '0x0000000000000000000000000000000000000000'; // TODO: Replace
export const OEC_TOKEN: Address = '0x0000000000000000000000000000000000000000';       // TODO: Replace
export const USDC_TOKEN: Address = '0x0000000000000000000000000000000000000000';      // TODO: Replace
export const CHAIN_ID = 11155111; // Sepolia — TODO: Replace with target chain

export const PRESALE_PRICE = 0.0025;       // USDC per OEC
export const HARD_CAP = 175_000_000;       // OEC tokens
export const HARD_CAP_USDC = 437_500;      // USDC value
export const USDC_DECIMALS = 6;
export const OEC_DECIMALS = 18;

// ============================================================
// ABIs (minimal — only what presale page needs)
// ============================================================
export const PRESALE_ABI = [
  {
    name: 'buyTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'usdcAmount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'tokensSold',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'hardCap',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'presaleEndTime',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'presaleActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getUserAllocation',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'hasClaimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ============================================================
// Client helpers
// ============================================================
function getPublicClient() {
  return createPublicClient({
    chain: sepolia,
    transport: http(),
  });
}

function getWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet provider found');
  }
  return createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  });
}

// ============================================================
// Read functions
// ============================================================
export async function getTokensSold(): Promise<bigint> {
  const client = getPublicClient();
  return client.readContract({
    address: PRESALE_CONTRACT,
    abi: PRESALE_ABI,
    functionName: 'tokensSold',
  });
}

export async function getHardCap(): Promise<bigint> {
  const client = getPublicClient();
  return client.readContract({
    address: PRESALE_CONTRACT,
    abi: PRESALE_ABI,
    functionName: 'hardCap',
  });
}

export async function getPresaleEndTime(): Promise<bigint> {
  const client = getPublicClient();
  return client.readContract({
    address: PRESALE_CONTRACT,
    abi: PRESALE_ABI,
    functionName: 'presaleEndTime',
  });
}

export async function getPresaleActive(): Promise<boolean> {
  const client = getPublicClient();
  return client.readContract({
    address: PRESALE_CONTRACT,
    abi: PRESALE_ABI,
    functionName: 'presaleActive',
  });
}

export async function getUserAllocation(address: Address): Promise<bigint> {
  const client = getPublicClient();
  return client.readContract({
    address: PRESALE_CONTRACT,
    abi: PRESALE_ABI,
    functionName: 'getUserAllocation',
    args: [address],
  });
}

export async function getHasClaimed(address: Address): Promise<boolean> {
  const client = getPublicClient();
  return client.readContract({
    address: PRESALE_CONTRACT,
    abi: PRESALE_ABI,
    functionName: 'hasClaimed',
    args: [address],
  });
}

export async function getUsdcAllowance(owner: Address): Promise<bigint> {
  const client = getPublicClient();
  return client.readContract({
    address: USDC_TOKEN,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner, PRESALE_CONTRACT],
  });
}

export async function getUsdcBalance(address: Address): Promise<bigint> {
  const client = getPublicClient();
  return client.readContract({
    address: USDC_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });
}

// ============================================================
// Write functions
// ============================================================
export async function approveUsdc(amount: string): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const [account] = await wallet.getAddresses();
  const amountWei = parseUnits(amount, USDC_DECIMALS);

  const hash = await wallet.writeContract({
    account,
    address: USDC_TOKEN,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [PRESALE_CONTRACT, amountWei],
  });

  // Wait for confirmation
  const publicClient = getPublicClient();
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function buyTokens(usdcAmount: string): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const [account] = await wallet.getAddresses();
  const amountWei = parseUnits(usdcAmount, USDC_DECIMALS);

  const hash = await wallet.writeContract({
    account,
    address: PRESALE_CONTRACT,
    abi: PRESALE_ABI,
    functionName: 'buyTokens',
    args: [amountWei],
  });

  const publicClient = getPublicClient();
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function claimTokens(): Promise<`0x${string}`> {
  const wallet = getWalletClient();
  const [account] = await wallet.getAddresses();

  const hash = await wallet.writeContract({
    account,
    address: PRESALE_CONTRACT,
    abi: PRESALE_ABI,
    functionName: 'claimTokens',
    args: [],
  });

  const publicClient = getPublicClient();
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// ============================================================
// Formatting helpers
// ============================================================
export function formatOec(amount: bigint): string {
  return Number(formatUnits(amount, OEC_DECIMALS)).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
}

export function formatUsdc(amount: bigint): string {
  return Number(formatUnits(amount, USDC_DECIMALS)).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
}

export function usdcToOec(usdcAmount: number): number {
  return usdcAmount / PRESALE_PRICE;
}

export function oecToUsdc(oecAmount: number): number {
  return oecAmount * PRESALE_PRICE;
}
