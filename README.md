# Aave V3 Liquidation Dashboard

Search and analyze Aave V3 liquidation events across multiple networks with real-time USD pricing.

**Live:** [tools.traversa.dev/aave](https://tools.traversa.dev/aave)

## Features

- **Multi-network support** - Query liquidations across 13 chains: Ethereum, Arbitrum, Polygon, Optimism, Avalanche, Base, BNB Chain, Gnosis, Scroll, zkSync Era, Linea, and Metis
- **Flexible search** - Filter by date range, liquidated user address, or liquidator address
- **Statistics bar** - Total liquidations, collateral seized, debt repaid, and largest liquidation at a glance
- **Sortable table** - Sort by any column with pagination (50 per page)
- **Explorer links** - Direct links to transactions and addresses on each chain's block explorer
- **Dark/light theme** - Toggle with system preference detection

## Data Sources

The dashboard uses a two-tier fetching strategy:

1. **The Graph (primary)** - Queries Aave V3 subgraphs for complete data including USD prices. Requires a free API key from [Subgraph Studio](https://thegraph.com/studio/).
2. **Direct RPC (fallback)** - Queries on-chain event logs directly. Uses intelligent block estimation and chunked queries to minimize RPC calls. USD values are unavailable in this mode.

Configure your Graph API key via the Settings button in the header.

## Tech Stack

- React 19, Vite
- ethers.js 6 for RPC interaction
- The Graph for indexed blockchain data

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Configuration

The Graph API key can be set in two ways:
- Via the Settings UI in the app (stored in localStorage)
- Via `VITE_GRAPH_API_KEY` environment variable
