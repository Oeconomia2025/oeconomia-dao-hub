import type { Handler } from '@netlify/functions';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const SEPOLIA_RPC_URL = ALCHEMY_API_KEY
  ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  : "https://rpc.sepolia.org";

async function rpcCall(method: string, params: unknown[] = []) {
  const res = await fetch(SEPOLIA_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    // Fetch real data from Sepolia via Alchemy RPC
    const [blockNumberHex, gasPriceHex] = await Promise.all([
      rpcCall("eth_blockNumber"),
      rpcCall("eth_gasPrice"),
    ]);

    const blockNumber = parseInt(blockNumberHex, 16);
    const gasPriceWei = parseInt(gasPriceHex, 16);
    const gasPriceGwei = Math.round(gasPriceWei / 1e9 * 100) / 100; // Convert wei → gwei

    // Get latest block for timestamp
    const block = await rpcCall("eth_getBlockByNumber", [blockNumberHex, false]);
    const blockTimestamp = parseInt(block.timestamp, 16);
    const lastBlockTime = new Date(blockTimestamp * 1000).toISOString();

    // Check health: block should be recent (within 5 minutes)
    const ageSeconds = Math.floor(Date.now() / 1000) - blockTimestamp;
    const isHealthy = ageSeconds < 300;

    const networkStatus = {
      blockNumber,
      gasPrice: gasPriceGwei,
      isHealthy,
      lastBlockTime,
      network: "sepolia",
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(networkStatus),
    };
  } catch (error) {
    console.error("Error fetching network status:", error);
    // Return degraded response instead of 500 so the UI still works
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        blockNumber: 0,
        gasPrice: 0,
        isHealthy: false,
        lastBlockTime: new Date().toISOString(),
        network: "sepolia",
        error: error instanceof Error ? error.message : "RPC call failed",
      }),
    };
  }
};
