# Portfolio

Track your DeFi positions and holdings across the Oeconomia ecosystem.

**Source:** `client/src/pages/portfolio.tsx`

## Overview

The Portfolio page shows a connected wallet's positions across all Oeconomia protocols — staking, DEX liquidity, lending, and token holdings.

## Features

### Holdings Overview

Aggregated view of all OEC-related token balances:
- Wallet balance (OEC, ELOQ, ALUR, ALUD)
- Staked positions
- LP token holdings
- Lending deposits

### Position Tracking

Per-protocol breakdown of active positions:
- **Staking** — Staked OEC amount, pending rewards, lock status
- **Eloqura DEX** — Liquidity positions, pool share percentage
- **Alluria** — Deposited collateral, borrowed amounts

### Balance History

Historical chart of portfolio value over time.

## Data Sources

Portfolio data is fetched from:
- Netlify `portfolio` serverless function
- Netlify `wallet-tokens` function for on-chain balances
- Direct blockchain reads via Wagmi for real-time position data

{% hint style="info" %}
**Wallet Required:** The Portfolio page requires a connected wallet to display position data.
{% endhint %}
