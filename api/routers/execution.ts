import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";

export const executionRouter = createRouter({
  trades: {
    list: publicQuery
      .input(z.object({ userId: z.number(), status: z.string().optional(), limit: z.number().default(50) }).optional())
      .query(async ({ input }) => {
        const db = getDb();
        const conditions = [];
        if (input?.userId) conditions.push(eq(schema.executedTrades.userId, input.userId));
        if (input?.status) conditions.push(eq(schema.executedTrades.status, input.status as any));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        return db.select().from(schema.executedTrades).where(where).orderBy(desc(schema.executedTrades.executedAt)).limit(input?.limit ?? 50);
      }),

    create: publicQuery
      .input(z.object({ userId: z.number(), opportunityId: z.number().optional(), executionType: z.string(), sourceChain: z.string().optional(), targetChain: z.string().optional(), sourceExchange: z.string().optional(), targetExchange: z.string().optional(), sourceToken: z.string(), targetToken: z.string(), amountIn: z.string(), bridgeName: z.string().optional(), status: z.string().default("pending") }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const result = await db.insert(schema.executedTrades).values(input as any).returning();
        return result[0];
      }),

    update: publicQuery
      .input(z.object({ id: z.number(), status: z.string().optional(), amountOut: z.string().optional(), gasUsed: z.string().optional(), gasPrice: z.string().optional(), transactionHash: z.string().optional(), bridgeFeePaid: z.string().optional(), slippage: z.string().optional(), errorMessage: z.string().optional(), completedAt: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const db = getDb();
        const result = await db.update(schema.executedTrades).set({ ...updates, completedAt: updates.completedAt ? new Date(updates.completedAt) : undefined } as any).where(eq(schema.executedTrades.id, id)).returning();
        return result[0];
      }),

    stats: publicQuery
      .input(z.object({ userId: z.number() }).optional())
      .query(async ({ input }) => {
        const db = getDb();
        const conditions = [];
        if (input?.userId) conditions.push(eq(schema.executedTrades.userId, input.userId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const [totalTrades, completedTrades, totalVolume] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(schema.executedTrades).where(where),
          db.select({ count: sql<number>`count(*)` }).from(schema.executedTrades).where(and(where, eq(schema.executedTrades.status, "completed" as any))),
          db.select({ total: sql<string>`coalesce(sum(${schema.executedTrades.amountIn}), 0)` }).from(schema.executedTrades).where(where),
        ]);
        return { totalTrades: totalTrades[0]?.count ?? 0, completedTrades: completedTrades[0]?.count ?? 0, totalVolume: totalVolume[0]?.total ?? "0" };
      }),
  },
});