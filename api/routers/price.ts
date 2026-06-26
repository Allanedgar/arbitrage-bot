import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";

export const priceRouter = createRouter({
  ticks: {
    list: publicQuery
      .input(z.object({ exchange: z.string().optional(), pair: z.string().optional(), limit: z.number().default(100) }).optional())
      .query(async ({ input }) => {
        const db = getDb();
        const conditions = [];
        if (input?.exchange) conditions.push(eq(schema.priceTicks.exchange, input.exchange));
        if (input?.pair) conditions.push(eq(schema.priceTicks.pair, input.pair));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        return db.select().from(schema.priceTicks).where(where).orderBy(desc(schema.priceTicks.timestamp)).limit(input?.limit ?? 100);
      }),
    latest: publicQuery
      .input(z.object({ exchange: z.string(), pair: z.string() }))
      .query(async ({ input }) => {
        const db = getDb();
        const rows = await db.select().from(schema.priceTicks).where(and(eq(schema.priceTicks.exchange, input.exchange), eq(schema.priceTicks.pair, input.pair))).orderBy(desc(schema.priceTicks.timestamp)).limit(1);
        return rows.at(0) ?? null;
      }),
    create: publicQuery
      .input(z.object({ exchange: z.string(), pair: z.string(), price: z.string(), volume24h: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const result = await db.insert(schema.priceTicks).values(input as any).returning();
        return result[0];
      }),
    bulkCreate: publicQuery
      .input(z.array(z.object({ exchange: z.string(), pair: z.string(), price: z.string(), volume24h: z.string().optional() })))
      .mutation(async ({ input }) => {
        const db = getDb();
        const result = await db.insert(schema.priceTicks).values(input as any).returning();
        return result;
      }),
  },
  summary: publicQuery.query(async () => {
    const db = getDb();
    const latestPrices = await db.selectDistinctOn([schema.priceTicks.exchange, schema.priceTicks.pair], {
      exchange: schema.priceTicks.exchange,
      pair: schema.priceTicks.pair,
      price: schema.priceTicks.price,
      volume24h: schema.priceTicks.volume24h,
      timestamp: schema.priceTicks.timestamp,
    }).from(schema.priceTicks).orderBy(schema.priceTicks.exchange, schema.priceTicks.pair, desc(schema.priceTicks.timestamp));
    const byExchange = latestPrices.reduce((acc: Record<string, typeof latestPrices>, tick) => {
      if (!acc[tick.exchange]) acc[tick.exchange] = [];
      acc[tick.exchange].push(tick);
      return acc;
    }, {} as Record<string, typeof latestPrices>);
    return { totalPairs: latestPrices.length, exchanges: Object.keys(byExchange).length, byExchange, lastUpdated: new Date().toISOString() };
  }),
  cleanup: publicQuery
    .input(z.object({ olderThanHours: z.number().default(24) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const cutoff = new Date(Date.now() - input.olderThanHours * 60 * 60 * 1000);
      await db.delete(schema.priceTicks).where(sql`${schema.priceTicks.timestamp} < ${cutoff}`);
      return { success: true };
    }),
});