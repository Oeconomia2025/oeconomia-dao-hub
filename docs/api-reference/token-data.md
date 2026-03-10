# Token Data

Endpoints for retrieving OEC and ecosystem token information.

## GET /token-data

Fetch token metadata and current market data by token code.

**Source:** `netlify/functions/token-data.ts`

### Query Parameters

| Parameter | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| `code`    | string | Yes      | Token code (e.g., `OEC`) |

### Response

```json
{
  "name": "Oeconomia",
  "code": "OEC",
  "price": 7.37,
  "change24h": 2.5,
  "marketCap": 73700000,
  "volume24h": 1250000,
  "circulatingSupply": 10000000,
  "totalSupply": 100000000
}
```

## GET /token-historical-data

Historical price data for charting.

**Source:** `netlify/functions/token-historical-data.ts`

### Query Parameters

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| `code`    | string | Yes      | Token code                        |
| `range`   | string | No       | Time range: `7d`, `30d`, `90d`, `1y` |

### Response

```json
{
  "data": [
    { "timestamp": 1709596800, "price": 7.25, "volume": 500000 },
    { "timestamp": 1709683200, "price": 7.37, "volume": 620000 }
  ]
}
```

## GET /token-supply-data

Token supply metrics.

**Source:** `netlify/functions/token-supply-data.ts`

### Response

```json
{
  "totalSupply": "100000000",
  "circulatingSupply": "10000000",
  "burned": "0",
  "locked": "5000000"
}
```

## Known Token Fallbacks

The backend maintains hardcoded fallback data for known tokens when external APIs are unavailable:

| Token | Code  |
| ----- | ----- |
| USDT  | USDT  |
| WBNB  | WBNB  |
| ETH   | ETH   |
| USDC  | USDC  |
| BTCB  | BTCB  |
| CAKE  | CAKE  |
| DAI   | DAI   |
| BUSD  | BUSD  |
| LINK  | LINK  |
| ADA   | ADA   |
