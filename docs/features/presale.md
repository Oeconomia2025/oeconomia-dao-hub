# Presale

OEC token presale interface for early supporters.

**Source:** `client/src/pages/presale.tsx`

## Overview

The Presale page allows users to purchase OEC tokens at a fixed rate using USDC before public launch. Requires a connected wallet on Sepolia testnet.

## Presale Parameters

| Parameter       | Value                       |
| --------------- | --------------------------- |
| Price           | 0.0025 USDC per OEC         |
| Hard Cap        | 175,000,000 OEC             |
| USDC Hard Cap   | 437,500 USDC                |
| Network         | Sepolia Testnet              |

{% hint style="warning" %}
**Contract Addresses:** Presale contract addresses are currently placeholders (`0x0000...0000`) awaiting deployment. The UI is fully built and will activate once contracts are deployed.
{% endhint %}

## Features

### Countdown Timer

Displays time remaining until presale ends:
- Days, Hours, Minutes, Seconds
- Updates in real-time

### USDC to OEC Calculator

- Input USDC amount
- See equivalent OEC tokens at the fixed rate
- Real-time conversion

### Progress Bar

Visual indicator showing:
- Tokens sold vs hard cap
- Percentage complete

### Buy Flow

1. **Approve USDC** — Approve the presale contract to spend your USDC
2. **Buy Tokens** — Execute `buyTokens()` with the approved amount
3. **Claim Tokens** — After presale ends, call `claimTokens()` to receive OEC

### Contract Interactions

**Source:** `client/src/services/presale-contract.ts`, `client/src/hooks/use-presale.ts`

The `usePresale()` hook polls the presale contract every 15 seconds for:
- `tokensSold` — Total OEC purchased
- `presaleEndTime` — Countdown target
- `presaleActive` — Whether presale is live
- `getUserAllocation(address)` — User's purchased amount
- `hasClaimed(address)` — Whether user already claimed

The hook gracefully handles placeholder contracts by skipping polling when addresses are zeroed out.
