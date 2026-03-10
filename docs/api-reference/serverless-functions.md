# Serverless Functions

Overview of the 20 Netlify serverless functions powering the DAO Hub backend.

**Source:** `netlify/functions/`

## Overview

All production API traffic goes through Netlify serverless functions rather than the Express server. Each function connects to the Neon PostgreSQL database via `DATABASE_URL` and uses Drizzle ORM for queries.

## Function Categories

### Token Data

| Function                  | Method | Description                          |
| ------------------------- | ------ | ------------------------------------ |
| `token-data`              | GET    | Fetch token info by code             |
| `token-coins-data`        | GET    | Get all coins database               |
| `token-historical-data`   | GET    | Historical price data                |
| `token-supply-data`       | GET    | Supply metrics (circulating, total)  |
| `token`                   | GET    | Generic token endpoint               |

### Market Data

| Function              | Method | Description                          |
| --------------------- | ------ | ------------------------------------ |
| `token-history`       | GET    | Price history for charts             |
| `price-history`       | GET    | Historical pricing                   |
| `eth-history`         | GET    | ETH-specific price history           |
| `volume-analytics`    | GET    | Volume and liquidity data            |

### Portfolio & User

| Function        | Method | Description                          |
| --------------- | ------ | ------------------------------------ |
| `portfolio`     | GET    | User portfolio tracking              |
| `wallet-tokens` | GET    | Wallet token holdings                |

### Governance & Holders

| Function        | Method | Description                          |
| --------------- | ------ | ------------------------------------ |
| `holders`       | GET    | Token holder information             |
| `transactions`  | GET    | Transaction history                  |

### Live Coin Watch

| Function                       | Method | Description                    |
| ------------------------------ | ------ | ------------------------------ |
| `live-coin-watch-coins`        | GET    | All coins (cached)             |
| `live-coin-watch-token`        | GET    | Specific token data            |
| `live-coin-watch-historical`   | GET    | Historical data                |
| `live-coin-watch-status`       | GET    | Sync status                    |
| `live-coin-watch-sync`         | POST   | Trigger data sync              |

### Admin / Utilities

| Function                  | Method | Description                    |
| ------------------------- | ------ | ------------------------------ |
| `authentic-token-sync`    | POST   | Token sync service             |
| `refresh-livecoinwatch`   | POST   | Manual data refresh            |
| `network-status`          | GET    | Network health check           |

## Database Connection

All functions connect to Neon PostgreSQL using the serverless driver:

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);
```

{% hint style="info" %}
**External Module:** The `ws` package is marked as an external module in `netlify.toml` to support Neon's serverless WebSocket connections.
{% endhint %}
