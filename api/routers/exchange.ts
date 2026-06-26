import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";

export const exchangeRouter = createRouter({
  connections: {
    list: publicQuery
      .input(z.object({ userId: z.number() }).optional())
      .query(async ({ input }) => {
        const db = getDb();
        if (!input?.userId) return [];
        return db.select().from(schema.exchangeConnections).where(eq(schema.exchangeConnections.userId, input.userId)).orderBy(desc(schema.exchangeConnections.createdAt));
      }),

    create: publicQuery
      .input(z.object({ userId: z.number(), exchangeName: z.string(), exchangeType: z.string().default("cex"), apiKey: z.string().optional(), apiSecret: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const result = await db.insert(schema.exchangeConnections).values(input as any).returning();
        return result[0];
      }),

    delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(schema.exchangeConnections).where(eq(schema.exchangeConnections.id, input.id));
      return { success: true };
    }),

    toggle: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select().from(schema.exchangeConnections).where(eq(schema.exchangeConnections.id, input.id)).limit(1);
      if (!existing[0]) return { success: false };
      await db.update(schema.exchangeConnections).set({ isActive: !existing[0].isActive }).where(eq(schema.exchangeConnections.id, input.id));
      return { success: true, isActive: !existing[0].isActive };
    }),
  },

  tokens: {
    list: publicQuery.query(async () => {
      const db = getDb();
      return db.select().from(schema.tokens).where(eq(schema.tokens.isActive, true));
    }),
    create: publicQuery
      .input(z.object({ symbol: z.string(), name: z.string(), chain: z.string(), contractAddress: z.string().optional(), decimals: z.number().default(18), isStablecoin: z.boolean().default(false), logoUrl: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const result = await db.insert(schema.tokens).values(input as any).returning();
        return result[0];
      }),
  },
});