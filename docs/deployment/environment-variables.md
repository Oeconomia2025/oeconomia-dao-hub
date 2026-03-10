# Environment Variables

Required environment variables for the OEC DAO Hub.

## Required

| Variable                        | Description                              | Where Set       |
| ------------------------------- | ---------------------------------------- | --------------- |
| `DATABASE_URL`                  | Neon PostgreSQL connection string        | Netlify / .env  |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID           | Netlify / .env  |

## Optional (API Integrations)

| Variable                    | Description                              | Default         |
| --------------------------- | ---------------------------------------- | --------------- |
| `COINGECKO_API_KEY`         | CoinGecko API key for market data        | —               |
| `ALCHEMY_API_KEY`           | Alchemy API key for blockchain queries   | —               |
| `MORALIS_API_KEY`           | Moralis API key (currently disabled)     | —               |
| `LIVE_COIN_WATCH_API_KEY`   | Live Coin Watch API key                  | —               |
| `BSCSCAN_API_KEY`           | BscScan API key                          | —               |

## Server

| Variable    | Description        | Default |
| ----------- | ------------------ | ------- |
| `NODE_ENV`  | Runtime environment | —       |
| `PORT`      | Server port         | `5000`  |

## Notes

- All `VITE_` prefixed variables are exposed to the frontend at build time
- `DATABASE_URL` must use the Neon serverless connection string format for Netlify functions
- API keys for disabled services (Moralis) can be omitted without breaking the app
- Set variables in the Netlify dashboard under **Site settings > Environment variables** for production
