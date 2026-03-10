# Dashboard

The main landing page showing OEC token analytics and market overview.

**Source:** `client/src/pages/dashboard.tsx`

## Overview

The Dashboard provides a comprehensive view of OEC token performance and ecosystem activity. All data is sourced from the PostgreSQL database via Netlify serverless functions, with blockchain data fetched via Alchemy.

## Sections

### Token Overview Cards

Top-level metrics displayed as cards:

- **Price** — Current OEC price with 24h change percentage
- **Market Cap** — Circulating supply × price
- **24h Volume** — Trading volume across DEXs
- **Holders** — Total unique OEC holders

### Price Chart

Historical price visualization using Recharts. Supports multiple timeframes and displays ETH data as a reference baseline (OEC-specific data pending mainnet launch).

### Volume & Liquidity Analytics

DEX trading metrics including:
- 24h / 7d / 30d volume
- Total liquidity across pools
- Volume-to-liquidity ratio

### Holder Statistics

Distribution of OEC holdings:
- Top holder addresses
- Holder count over time
- Concentration metrics

### Token Information Panel

Static reference data:
- Contract address
- Decimals, total supply
- Network (Sepolia)
- Fee structure

### Recent Transactions

Table showing latest OEC transactions with:
- Transaction hash (linked to Etherscan)
- From / To addresses
- Amount
- Timestamp

### Quick Actions

Shortcut buttons for common operations:
- Swap (links to Eloqura DEX)
- Bridge
- Stake (links to OEC Staking)
- Add Liquidity

## Data Sources

| Data            | Source                          |
| --------------- | ------------------------------- |
| Token price     | Netlify `token-data` function   |
| Price history   | Netlify `token-historical-data` |
| Volume          | Netlify `volume-analytics`      |
| Holder stats    | Netlify `holders` function      |
| Transactions    | Netlify `transactions` function |
