import { z } from "zod";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";

export const arbitrageRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        status: z.string().optional(),
        type: z.string().optional(),
        minProfit: z.number().optional(),
        maxRisk: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input.status) {
        conditions.push(
          eq(schema.arbitrageOpportunities.status, input.status as any)
        );
      }
      if (input.type) {
        conditions.push(
          eq(
            schema.arbitrageOpportunities.opportunityType,
            input.type as any
          )
        );
      }
      if (input.minProfit) {
        conditions.push(
          gte(schema.arbitrageOpportunities.netProfit, String(input.minProfit))
        );
      }
      if (input.maxRisk) {
        conditions.push(
          gte(schema.arbitrageOpportunities.riskScore, String(input.maxRisk))
        );
      }

      const where =
        conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select()
        .from(schema.arbitrageOpportunities)
        .where(where)
        .orderBy(desc(schema.arbitrageOpportunities.detectedAt))
        .limit(input.limit)
        .offset(input.offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.arbitrageOpportunities)
        .where(where);

      return {
        items,
        total: countResult[0]?.count ?? 0,
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.arbitrageOpportunities)
        .where(eq(schema.arbitrageOpportunities.id, input.id))
        .limit(1);
      return rows.at(0) ?? null;
    }),

  create: publicQuery
    .input(
      z.object({
        opportunityType: z.string(),
        sourceExchange: z.string(),
        targetExchange: z.string(),
        sourceChain: z.string().optional(),
        targetChain: z.string().optional(),
        sourceToken: z.string(),
        targetToken: z.string(),
        sourcePrice: z.string(),
        targetPrice: z.string(),
        priceDeltaPct: z.string(),
        estimatedProfit: z.string(),
        estimatedGasCost: z.string().optional(),
        bridgeFee: z.string().optional(),
        netProfit: z.string().optional(),
        riskScore: z.string(),
        confidenceScore: z.string().optional(),
        liquidityScore: z.string().optional(),
        requiredCapital: z.string().optional(),
        executionPath: z.any().optional(),
        expiresAt: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db
        .insert(schema.arbitrageOpportunities)
        .values({
          ...input,
          status: "active",
          expiresAt: input.expiresAt
            ? new Date(input.expiresAt)
            : new Date(Date.now() + 5 * 60 * 1000),
        } as any)
        .returning();
      return result[0];
    }),

  stats: publicQuery.query(async () => {
    const db = getDb();

    const [activeCount, totalProfit, avgRisk] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.arbitrageOpportunities)
        .where(eq(schema.arbitrageOpportunities.status, "active" as any)),
      db
        .select({
          total: sql<string>`coalesce(sum(${schema.arbitrageOpportunities.netProfit}), 0)`,
        })
        .from(schema.arbitrageOpportunities)
        .where(eq(schema.arbitrageOpportunities.status, "executed" as any)),
      db
        .select({
          avg: sql<string>`coalesce(avg(${schema.arbitrageOpportunities.riskScore}), 0)`,
        })
        .from(schema.arbitrageOpportunities),
    ]);

    return {
      activeOpportunities: activeCount[0]?.count ?? 0,
      totalProfit: totalProfit[0]?.total ?? "0",
      averageRisk: avgRisk[0]?.avg ?? "0",
    };
  }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .delete(schema.arbitrageOpportunities)
        .where(eq(schema.arbitrageOpportunities.id, input.id));
      return { success: true };
    }),
});