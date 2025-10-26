# Gold Tracker

Gold Tracker is a full-stack TypeScript application for monitoring live gold and silver spot prices and keeping a personal ledger of bullion purchases. The project combines a modern React 19 + Tailwind CSS client with an Express + tRPC backend that proxies the public goldprice.org service and ships as a Progressive Web App (PWA) optimised for mobile and desktop users.

## Table of contents
- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Available scripts](#available-scripts)
- [Environment variables](#environment-variables)
- [Usage](#usage)
  - [Prices dashboard](#prices-dashboard)
  - [Purchase tracker](#purchase-tracker)
  - [Language & navigation](#language--navigation)
- [Data & APIs](#data--apis)
- [Development guidelines](#development-guidelines)
- [Testing](#testing)
- [Build & deployment](#build--deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview
- Live spot pricing for gold (XAU) and silver (XAG) with automatic refresh.
- Local-first purchase tracking with precise decimal handling for weights, costs, and valuations.
- Responsive layout designed around a mobile-first bottom navigation with support for multiple languages.
- Ships as a single repository containing the client, server, and shared utilities for type-safe end-to-end development.

## Features
- **Live metals dashboard** – displays spot price, daily change, percentage movement, and closing prices for gold and silver with data refreshed every 60 seconds.
- **Unit conversion** – toggle between grams and troy ounces; calculations use `decimal.js-light` for up to eight decimal places of precision.
- **Multi-currency quoting** – fetch prices in Malaysian Ringgit (MYR) or US Dollars (USD) by default. Extend the currency list via `client/src/lib/currencies.ts`.
- **Purchase tracker** – add, edit, and delete bullion purchases with fields for purity, weight, price-per-gram, and total cost. Data is persisted client-side in `localStorage`.
- **Portfolio analytics** – automatic summarisation of total weight, cost basis, estimated value, and profit/loss for gold and silver holdings.
- **CSV import & export** – bulk import purchase history and export filtered datasets (gold-only, silver-only, or all) directly from the UI.
- **Internationalisation** – built-in language switcher with English (`en`) and Chinese (`zh`) translations managed by `react-i18next`.
- **PWA ready** – service worker and manifest provided by `vite-plugin-pwa` for installable, offline-capable experiences.
- **Modern UI components** – shadcn/ui + Radix primitives, animated transitions, toasts (`sonner`), and accessibility-focused focus states.

## Tech stack
- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui, Radix UI, Wouter, @tanstack/react-query, Recharts, i18next.
- **Backend**: Express 4, tRPC 11, SuperJSON, node-fetch (via native `fetch`), tsx/esbuild for bundling.
- **Shared utilities**: `decimal.js-light` for precision math, zod for runtime validation, shared constants/types under `/shared`.
- **Tooling**: pnpm, Prettier, Vitest + React Testing Library, Vite PWA plugin.

## Project structure
```
/
├── client/                # React application (Vite root)
│   ├── public/            # Static assets & PWA icons
│   └── src/
│       ├── components/    # UI, layout, purchase tracker, charts, tests
│       ├── config/        # Navigation configuration
│       ├── contexts/      # Theme context
│       ├── hooks/         # Custom hooks (prices, purchases, viewport helpers)
│       ├── lib/           # Utilities (API, formatting, storage, animations)
│       ├── locales/       # i18n resources (en, zh)
│       ├── pages/         # Route components (Home, Tracker, NotFound)
│       └── main.tsx       # Client bootstrap
├── server/                # Express + tRPC API server
│   ├── _core/             # Server bootstrap, context, Vite integration
│   ├── routers/           # Feature routers (e.g. goldRouter)
│   └── routers.ts         # Root app router
├── shared/                # Shared constants and types between client & server
├── docs/                  # Supplemental project documentation
├── package.json           # Scripts & workspace metadata
├── pnpm-lock.yaml
└── vite.config.ts         # Vite + PWA configuration
```

## Getting started
### Prerequisites
- Node.js **18.x** or newer
- [pnpm](https://pnpm.io/) **10.x** (see `package.json` for the exact package manager version)

### Installation
1. **Clone** the repository and switch to the project directory:
   ```bash
   git clone <repository-url>
   cd gold-tracker-app
   ```
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Configure environment variables**: copy the sample file and adjust values as needed.
   ```bash
   cp .env.example .env
   ```
   At a minimum you may want to set:
   ```dotenv
   VITE_APP_TITLE="Gold Tracker"
   VITE_APP_LOGO="https://example.com/logo.svg"
   PORT=3000
   ```
4. **Start the development server**:
   ```bash
   pnpm dev
   ```
   The Express server starts first and mounts Vite in middleware mode. The app prefers port `3000`, falling back to the next available port if necessary—check the terminal output for the exact URL.

### Available scripts
| Command        | Description |
|----------------|-------------|
| `pnpm dev`     | Runs the Express server with Vite middleware for the client (hot reload enabled). |
| `pnpm build`   | Builds the React client (`dist/public`) and bundles the server into `dist/index.js`. |
| `pnpm start`   | Runs the production build from the `dist` directory. Requires `pnpm build` first. |
| `pnpm test`    | Executes the Vitest test suite. |
| `pnpm check`   | Type-checks the project with `tsc --noEmit`. |
| `pnpm format`  | Formats the codebase using Prettier. |

## Environment variables
Environment variables are read from the project root `.env` file. Vite-specific values must be prefixed with `VITE_` to be exposed to the client.

| Variable        | Scope        | Description                                                 | Default |
|-----------------|--------------|-------------------------------------------------------------|---------|
| `VITE_APP_TITLE`| Client       | Application title used in the UI.                          | `App` |
| `VITE_APP_LOGO` | Client       | Logo URL displayed in supported components.                | Placeholder SVG |
| `PORT`          | Server       | Preferred port for the Express server. Falls back if busy. | `3000` |

## Usage
### Prices dashboard
- Accessible at the root route (`/`).
- Select your desired quote currency from the dropdown (MYR or USD by default).
- Toggle between grams and troy ounces to convert the displayed spot prices.
- View live metrics for gold (XAU) and silver (XAG): latest price, daily change, percentage movement, closing price, and last update timestamp.
- Data automatically refreshes every 60 seconds via the `gold.getCurrentPrice` tRPC query.

### Purchase tracker
- Navigate to `/tracker` using the bottom navigation.
- Add new purchases with details such as metal type, item name, weight, purity, price-per-gram, total cost, and purchase date.
- Purchases persist in the browser’s `localStorage`, so data remains across sessions on the same device.
- Edit or delete existing entries via the purchase list.
- Import purchase history from CSV files generated by the app or other systems.
- Export current holdings to CSV (gold only, silver only, or all metals) straight from the summary panel.
- Summary cards provide current estimated value and profit/loss based on the latest spot prices.

### Language & navigation
- The floating language switcher lets users toggle between English and Chinese translations instantly.
- The mobile-first bottom navigation exposes the two primary routes (“Prices” and “Tracker”) and shows the current application version sourced from `package.json`.

## Data & APIs
- The backend resides in `server/` and exposes a type-safe API through tRPC.
- `goldRouter` currently provides two procedures:
  - `gold.getCurrentPrice` – fetches real-time data from `https://data-asg.goldprice.org/dbXRates/{currency}`.
  - `gold.getHistoricalData` – placeholder that presently returns an empty dataset (goldprice.org does not expose historical quotes).
- Requests are debounced and refetched every 60 seconds on the client. No API key is required for the current integration.

## Development guidelines
- Follow the conventions described in [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, commit messages, and pull request expectations.
- Use the provided Tailwind CSS design tokens and shadcn/ui primitives to keep the interface consistent.
- Prefer tRPC procedures for client/server communication so type definitions stay centralised in `/shared`.
- Run `pnpm format` before submitting changes to ensure Prettier formatting.

## Testing
- Unit and component tests are written with Vitest and React Testing Library.
- Execute all tests locally with:
  ```bash
  pnpm test
  ```
  Vitest is already configured via `vitest.config.ts` for JSX testing with JSDOM.

## Build & deployment
1. Build the project:
   ```bash
   pnpm build
   ```
   - Client assets are emitted to `dist/public`.
   - The Express server bundle (`index.js`) and supporting files are emitted to `dist/`.
2. Serve the production build:
   ```bash
   pnpm start
   ```
   This runs the compiled server from the `dist` directory and serves the pre-built client assets.

## Troubleshooting
- **No price data** – ensure your machine can reach `https://data-asg.goldprice.org`. The endpoint occasionally rate-limits; retry after a short delay.
- **Port already in use** – the server automatically increments the port (3000 → 3019). Check the terminal output for the active port.
- **Stale or corrupted purchase data** – clear `localStorage` keys `gold_tracker_purchases` and `gold_tracker_currency` in your browser to reset the tracker.
- **CSV import errors** – verify your CSV includes all expected headers and numeric values. The parser expects comma-separated values with nine columns (see `lib/storage.ts`).

## Contributing
Contributions are welcome! Review the [CONTRIBUTING.md](CONTRIBUTING.md) guidelines for coding standards, workflows, and issue triage before opening a pull request.

## License
This project is licensed under the MIT License. Refer to the `license` field in [`package.json`](package.json) for attribution details.