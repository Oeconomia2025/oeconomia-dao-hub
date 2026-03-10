# Quick Start

Get the OEC DAO Hub running locally for development.

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL connection (Neon recommended)

## Installation

```bash
cd oeconomia-dao-hub
npm install
```

## Environment Setup

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:pass@host/dbname
NODE_ENV=development
PORT=5000
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

See [Environment Variables](../deployment/environment-variables.md) for the full list.

## Run Development Server

```bash
npm run dev
```

This starts both the Express backend and Vite frontend dev server. The app will be available at `http://localhost:5000`.

## TypeScript Check

```bash
npm run check
```

## Production Build

```bash
npm run build
```

Outputs to `dist/public/` for Netlify deployment. See [Deploy Guide](../deployment/deploy-guide.md) for production deployment steps.
