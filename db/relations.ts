import { relations } from "drizzle-orm";
import {
  users,
  exchangeConnections,
  arbitrageOpportunities,
  executedTrades,
  alerts,
  walletBalances,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  exchangeConnections: many(exchangeConnections),
  opportunities: many(arbitrageOpportunities),
  trades: many(executedTrades),
  alerts: many(alerts),
  walletBalances: many(walletBalances),
}));

export const exchangeConnectionsRelations = relations(
  exchangeConnections,
  ({ one }) => ({
    user: one(users, {
      fields: [exchangeConnections.userId],
      references: [users.id],
    }),
  })
);

export const arbitrageOpportunitiesRelations = relations(
  arbitrageOpportunities,
  ({ one, many }) => ({
    user: one(users, {
      fields: [arbitrageOpportunities.userId],
      references: [users.id],
    }),
    trades: many(executedTrades),
  })
);

export const executedTradesRelations = relations(executedTrades, ({ one }) => ({
  user: one(users, {
    fields: [executedTrades.userId],
    references: [users.id],
  }),
  opportunity: one(arbitrageOpportunities, {
    fields: [executedTrades.opportunityId],
    references: [arbitrageOpportunities.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
}));

export const walletBalancesRelations = relations(walletBalances, ({ one }) => ({
  user: one(users, {
    fields: [walletBalances.userId],
    references: [users.id],
  }),
}));