# Cross-Chain Arbitrage & Bridge Opportunity Finder

A comprehensive arbitrage detection and execution platform that identifies profitable trading opportunities across multiple blockchains, exchanges, and bridging solutions.

## Features

- **Real-time Detection**: Identifies arbitrage opportunities across 50+ exchanges and 15+ bridges
- **Cross-Chain Execution**: Automated trading across Ethereum, BSC, Solana, Polygon, Arbitrum, Optimism
- **Risk-Managed**: Built-in protection with risk scoring and confidence metrics
- **Bridge Comparison**: Compare fees, speed, and security across bridge protocols
- **Alert System**: Custom alerts for price deltas, profit thresholds, and risk levels
- **Portfolio Tracking**: Multi-chain wallet balance monitoring

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Hono + tRPC 11.x + Drizzle ORM |
| Database | PostgreSQL (via Supabase) |
| Auth | OAuth 2.0 + JWT Sessions |

## Database Schema

The application uses a PostgreSQL database with the following tables:

- `users` - User accounts with OAuth
- `exchange_connections` - Exchange API credentials
- `tokens` - Supported trading pairs
- `arbitrage_opportunities` - Detected arbitrage opportunities
- `executed_trades` - Trade execution history
- `bridge_routes` - Cross-chain bridge route data
- `price_ticks` - Real-time price data
- `alerts` - User-configured alerts
- `wallet_balances` - Portfolio tracking

## API Endpoints (tRPC Routers)

| Router | Description |
|--------|-------------|
| `arbitrage` | Opportunity CRUD and statistics |
| `bridge` | Bridge route management and comparison |
| `exchange` | Exchange connections and token lists |
| `execution` | Trade execution and history |
| `price` | Price data management |
| `alert` | Alert CRUD and triggering |
| `wallet` | Wallet and balance management |
| `detection` | Simulated arbitrage detection engine |
| `auth` | Authentication (OAuth) |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env and fill in your credentials

# Push database schema
npm run db:push

# Seed sample data
npx tsx db/seed.ts

# Start development server
npm run dev
```

## Project Structure

```
├── api/                    # Backend API
│   ├── routers/           # tRPC routers
│   ├── queries/           # Database queries
│   └── lib/              # Utilities
├── db/                    # Database schema & migrations
│   ├── schema.ts         # PostgreSQL schema
│   └── seed.ts           # Seed data
├── src/                   # Frontend
│   ├── pages/            # Route pages
│   ├── components/       # UI components
│   └── hooks/            # React hooks
└── contracts/            # Shared types
```

## Note

This is a demonstration application with simulated data. No real trades are executed.
