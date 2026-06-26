import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  numeric,
  boolean,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const opportunityStatusEnum = pgEnum("opportunity_status", ["active", "expired", "executed", "failed"]);
export const opportunityTypeEnum = pgEnum("opportunity_type", ["spatial", "triangular", "statistical", "cross_chain", "stablecoin_peg", "nft_floor", "governance", "derivatives"]);
export const tradeStatusEnum = pgEnum("trade_status", ["pending", "executing", "completed", "failed", "cancelled"]);
export const bridgeNameEnum = pgEnum("bridge_name", ["wormhole", "polygon_pos", "arbitrum", "optimism", "hop", "synapse", "layerzero", "celer"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  walletAddress: varchar("wallet_address", { length: 42 }).unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const exchangeConnections = pgTable("exchange_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  exchangeName: varchar("exchange_name", { length: 50 }).notNull(),
  exchangeType: varchar("exchange_type", { length: 10 }).notNull().default("cex"),
  apiKey: varchar("api_key", { length: 255 }),
  apiSecret: varchar("api_secret", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  chain: varchar("chain", { length: 20 }).notNull(),
  contractAddress: varchar("contract_address", { length: 42 }),
  decimals: integer("decimals").default(18).notNull(),
  isStablecoin: boolean("is_stablecoin").default(false).notNull(),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const arbitrageOpportunities = pgTable("arbitrage_opportunities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  opportunityType: opportunityTypeEnum("opportunity_type").notNull(),
  sourceExchange: varchar("source_exchange", { length: 50 }).notNull(),
  targetExchange: varchar("target_exchange", { length: 50 }).notNull(),
  sourceChain: varchar("source_chain", { length: 20 }),
  targetChain: varchar("target_chain", { length: 20 }),
  sourceToken: varchar("source_token", { length: 20 }).notNull(),
  targetToken: varchar("target_token", { length: 20 }).notNull(),
  sourcePrice: numeric("source_price", { precision: 30, scale: 18 }).notNull(),
  targetPrice: numeric("target_price", { precision: 30, scale: 18 }).notNull(),
  priceDeltaPct: numeric("price_delta_pct", { precision: 10, scale: 4 }).notNull(),
  estimatedProfit: numeric("estimated_profit", { precision: 20, scale: 8 }).notNull(),
  estimatedGasCost: numeric("estimated_gas_cost", { precision: 20, scale: 8 }),
  bridgeFee: numeric("bridge_fee", { precision: 20, scale: 8 }),
  netProfit: numeric("net_profit", { precision: 20, scale: 8 }),
  riskScore: numeric("risk_score", { precision: 5, scale: 2 }).notNull(),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }).default("50"),
  liquidityScore: numeric("liquidity_score", { precision: 5, scale: 2 }),
  requiredCapital: numeric("required_capital", { precision: 20, scale: 8 }),
  executionPath: jsonb("execution_path"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  status: opportunityStatusEnum("status").default("active").notNull(),
  metadata: jsonb("metadata"),
});

export const executedTrades = pgTable("executed_trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  opportunityId: integer("opportunity_id").references(() => arbitrageOpportunities.id),
  executionType: varchar("execution_type", { length: 20 }).notNull(),
  sourceChain: varchar("source_chain", { length: 20 }),
  targetChain: varchar("target_chain", { length: 20 }),
  sourceExchange: varchar("source_exchange", { length: 50 }),
  targetExchange: varchar("target_exchange", { length: 50 }),
  sourceToken: varchar("source_token", { length: 20 }).notNull(),
  targetToken: varchar("target_token", { length: 20 }).notNull(),
  amountIn: numeric("amount_in", { precision: 20, scale: 8 }).notNull(),
  amountOut: numeric("amount_out", { precision: 20, scale: 8 }),
  gasUsed: numeric("gas_used", { precision: 20, scale: 0 }),
  gasPrice: numeric("gas_price", { precision: 30, scale: 18 }),
  transactionHash: varchar("transaction_hash", { length: 66 }),
  bridgeName: varchar("bridge_name", { length: 50 }),
  bridgeFeePaid: numeric("bridge_fee_paid", { precision: 20, scale: 8 }),
  slippage: numeric("slippage", { precision: 10, scale: 4 }),
  status: tradeStatusEnum("status").notNull(),
  errorMessage: text("error_message"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const bridgeRoutes = pgTable("bridge_routes", {
  id: serial("id").primaryKey(),
  sourceChain: varchar("source_chain", { length: 20 }).notNull(),
  targetChain: varchar("target_chain", { length: 20 }).notNull(),
  bridgeName: bridgeNameEnum("bridge_name").notNull(),
  averageFee: numeric("average_fee", { precision: 20, scale: 8 }).notNull(),
  averageTime: integer("average_time").notNull(),
  securityScore: numeric("security_score", { precision: 5, scale: 2 }).notNull(),
  reliabilityScore: numeric("reliability_score", { precision: 5, scale: 2 }),
  congestionLevel: varchar("congestion_level", { length: 10 }).default("low"),
  isActive: boolean("is_active").default(true).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const priceTicks = pgTable("price_ticks", {
  id: serial("id").primaryKey(),
  exchange: varchar("exchange", { length: 50 }).notNull(),
  pair: varchar("pair", { length: 30 }).notNull(),
  price: numeric("price", { precision: 30, scale: 18 }).notNull(),
  volume24h: numeric("volume_24h", { precision: 30, scale: 8 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  alertType: varchar("alert_type", { length: 30 }).notNull(),
  conditions: jsonb("conditions").notNull(),
  notificationChannels: jsonb("notification_channels").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  triggeredCount: integer("triggered_count").default(0).notNull(),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const walletBalances = pgTable("wallet_balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  chain: varchar("chain", { length: 20 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 20 }).notNull(),
  tokenAddress: varchar("token_address", { length: 42 }),
  balance: numeric("balance", { precision: 30, scale: 18 }).notNull(),
  balanceUsd: numeric("balance_usd", { precision: 20, scale: 8 }),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});