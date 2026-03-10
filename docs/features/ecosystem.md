# Ecosystem

Browse and navigate to all Oeconomia DAO protocols.

**Source:** `client/src/pages/ecosystem.tsx`

## Overview

The Ecosystem page serves as a directory of all protocols in the Oeconomia DAO. Each protocol is displayed as a card with key metrics and a direct link.

## Protocols

| Protocol       | Type    | URL                                  | Description                    |
| -------------- | ------- | ------------------------------------ | ------------------------------ |
| OEC Pantheon   | Hub     | https://oeconomia.io                 | Main DAO dashboard             |
| OEC Staking    | Staking | https://staking.oeconomia.io         | Multi-pool staking with APR    |
| Eloqura        | DEX     | https://eloqura.oeconomia.io         | Automated market maker DEX     |
| Alluria        | Lending | https://alluria.oeconomia.io         | Lending and borrowing protocol |
| Artivya        | NFTs    | https://artivya.oeconomia.io         | NFT marketplace                |
| Iridescia      | DeFi    | https://iridescia.oeconomia.io       | Advanced DeFi protocols        |

## Protocol Cards

Each card displays:
- Protocol name and logo
- Category badge
- TVL (Total Value Locked)
- Active users
- APY (where applicable)
- 24h volume (where applicable)

## Dynamic Routing

The Ecosystem page supports protocol-specific views via URL parameter:

```
/ecosystem/:protocol?
```

Navigating to `/ecosystem/eloqura` shows the Eloqura-specific detail view with deeper metrics.
