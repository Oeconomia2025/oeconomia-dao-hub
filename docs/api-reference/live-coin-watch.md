# Live Coin Watch Integration

Cached market data from Live Coin Watch, synced to PostgreSQL.

## Overview

The DAO Hub integrates with Live Coin Watch for real-time market data. Data is synced to the Neon PostgreSQL database on a schedule, and the frontend reads from the database cache — not directly from the Live Coin Watch API.

This approach minimizes external API calls and ensures the dashboard works even when external services are down.

## Sync Architecture

```
Live Coin Watch API
        │
        ▼  (scheduled sync)
┌──────────────────┐
│  Neon PostgreSQL  │
│  (cached data)    │
└────────┬─────────┘
         │
         ▼  (read on request)
┌──────────────────┐
│  Netlify Function │
│  (serve to UI)    │
└──────────────────┘
```

## Endpoints

### GET /live-coin-watch-coins

Returns all cached coin data.

### GET /live-coin-watch-token

Returns data for a specific token.

| Parameter | Type   | Required | Description  |
| --------- | ------ | -------- | ------------ |
| `code`    | string | Yes      | Token code   |

### GET /live-coin-watch-historical

Historical data for a token.

| Parameter | Type   | Required | Description                   |
| --------- | ------ | -------- | ----------------------------- |
| `code`    | string | Yes      | Token code                    |
| `range`   | string | No       | `7d`, `30d`, `90d`, `1y`      |

### GET /live-coin-watch-status

Returns the last sync timestamp and status.

```json
{
  "lastSync": "2026-03-10T12:00:00Z",
  "status": "success",
  "coinsTracked": 150
}
```

### POST /live-coin-watch-sync

Manually trigger a data sync from Live Coin Watch.

{% hint style="warning" %}
**Rate Limits:** The Live Coin Watch free tier has daily request limits. Avoid triggering manual syncs frequently.
{% endhint %}

## Backend Services

**Source:** `server/services/live-coin-watch-api.ts`, `server/services/live-coin-watch-sync.ts`

The sync service runs as a background task on the Express server (local dev) and can be triggered via the serverless function (production).
