# Deploy Guide

Instructions for deploying the OEC DAO Hub to Netlify.

## Prerequisites

- Netlify CLI installed (`npm i -g netlify-cli`)
- Netlify account linked to the project
- Neon PostgreSQL database provisioned
- Environment variables configured in Netlify dashboard

## Build

```bash
cd oeconomia-dao-hub
npx vite build --config vite.config.netlify.ts
```

This outputs:
- `dist/public/` — Static frontend assets
- Netlify functions are bundled via esbuild as part of the build process

## Deploy

```bash
npx netlify deploy --prod --dir=dist/public
```

## Netlify Configuration

The `netlify.toml` configures:

```toml
[build]
  publish = "dist/public"
  command = "npm install && vite build && esbuild ..."

[build.environment]
  NODE_VERSION = "20"

[functions]
  directory = "netlify/functions/dist"
  external_node_modules = ["ws"]
```

{% hint style="info" %}
**External Modules:** The `ws` package must be listed as an external module for Neon PostgreSQL's serverless WebSocket driver to work in Netlify functions.
{% endhint %}

## SPA Routing

All routes redirect to `index.html` for client-side routing:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Production URL

**Live:** [https://oeconomia.io](https://oeconomia.io)

## Monitoring

- Check Netlify function logs in the Netlify dashboard under **Functions** tab
- Database health can be verified via the `/network-status` serverless function
- Live Coin Watch sync status via `/live-coin-watch-status`
