import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";

export const walletRouter = createRouter({
  balances: {
    list: publicQuery
      .input(z.object({ userId: z.number(), chain: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const db = getDb();
        const conditions = [];
        if (input?.userId) conditions.push(eq(schema.walletBalances.userId, input.userId));
        if (input?.chain) conditions.push(eq(schema.walletBalances.chain, input.chain));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        return db.select().from(schema.walletBalances).where(where).orderBy(desc(schema.walletBalances.balanceUsd));
      }),
    upsert: publicQuery
      .input(z.object({ userId: z.number(), chain: z.string(), tokenSymbol: z.string(), tokenAddress: z.string().optional(), balance: z.string(), balanceUsd: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const existing = await db.select().from(schema.walletBalances).where(
          and(eq(schema.walletBalances.userId, input.userId), eq(schema.walletBalances.chain, input.chain), eq(schema.walletBalances.tokenSymbol, input.tokenSymbol))
        ).limit(1);
        if (existing[0]) {
          await db.update(schema.walletBalances).set({ balance: input.balance, balanceUsd: input.balanceUsd, lastUpdated: new Date() }).where(eq(schema.walletBalances.id, existing[0].id));
          return { ...existing[0], ...input, lastUpdated: new Date() };
        }
        const result = await db.insert(schema.walletBalances).values({ ...input, lastUpdated: new Date() } as any).returning();
        return result[0];
      }),
    totalValue: publicQuery
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const db = getDb();
        const result = await db.select({
          totalUsd: sql<string>`coalesce(sum(${schema.walletBalances.balanceUsd}), 0)`,
          chains: sql<number>`count(distinct ${schema.walletBalances.chain})`,
          tokens: sql<number>`count(*)`,
        }).from(schema.walletBalances).where(eq(schema.walletBalances.userId, input.userId));
        return { totalUsd: result[0]?.totalUsd ?? "0", chainCount: result[0]?.chains ?? 0, tokenCount: result[0]?.tokens ?? 0 };
      }),
  },
  updateAddress: publicQuery
    .input(z.object({ userId: z.number(), walletAddress: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(schema.users).set({ walletAddress: input.walletAddress }).where(eq(schema.users.id, input.userId));
      return { success: true };
    }),
});