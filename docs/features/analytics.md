# Analytics

TVL tracking, volume metrics, and protocol-level analytics with interactive charts.

**Source:** `client/src/pages/analytics.tsx`

## Overview

The Analytics page aggregates data across all Oeconomia ecosystem protocols, providing filterable charts and metrics. Data is sourced from PostgreSQL snapshots synced from external market data providers.

## Features

### Protocol Filtering

Filter metrics by protocol category:

| Filter   | Protocols Included              |
| -------- | ------------------------------- |
| All      | Everything                      |
| Staking  | OEC Staking                     |
| DEX      | Eloqura                         |
| Bridge   | Cross-chain bridges             |
| Lending  | Alluria                         |
| NFT      | Artivya                         |

### Date Range Selection

View data across configurable windows:
- 7 days
- 30 days
- 90 days
- 1 year

### TVL (Total Value Locked)

Tracks total value deposited across all protocols. Displayed as an area chart with protocol breakdown.

### Volume Metrics

Trading volume aggregated from DEX activity:
- Daily volume
- Cumulative volume
- Volume by protocol

### Multi-Chart Visualizations

Built with Recharts, including:
- Area charts for TVL over time
- Bar charts for volume comparison
- Line charts for price trends

## Data Generation

{% hint style="info" %}
**Development Mode:** The analytics page uses mock data generation for UI development. Data points are generated programmatically to simulate realistic protocol metrics across the selected date range.
{% endhint %}

Production data will be sourced from the Netlify `volume-analytics` serverless function, which queries aggregated snapshots in the Neon PostgreSQL database.
