import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";

export const bridgeRouter = createRouter({
  list: publicQuery
    .input(z.object({ sourceChain: z.string().optional(), targetChain: z.string().optional(), isActive: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.sourceChain) conditions.push(eq(schema.bridgeRoutes.sourceChain, input.sourceChain));
      if (input?.targetChain) conditions.push(eq(schema.bridgeRoutes.targetChain, input.targetChain));
      if (input?.isActive !== undefined) conditions.push(eq(schema.bridgeRoutes.isActive, input.isActive));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(schema.bridgeRoutes).where(where).orderBy(desc(schema.bridgeRoutes.securityScore));
    }),

  getBestRoute: publicQuery
    .input(z.object({ sourceChain: z.string(), targetChain: z.string(), prioritize: z.enum(["speed", "cost", "security"]).default("cost") }))
    .query(async ({ input }) => {
      const db = getDb();
      const routes = await db.select().from(schema.bridgeRoutes).where(and(
        eq(schema.bridgeRoutes.sourceChain, input.sourceChain),
        eq(schema.bridgeRoutes.targetChain, input.targetChain),
        eq(schema.bridgeRoutes.isActive, true)
      ));
      return routes.sort((a, b) => {
        if (input.prioritize === "speed") return a.averageTime - b.averageTime;
        if (input.prioritize === "cost") return parseFloat(a.averageFee) - parseFloat(b.averageFee);
        return parseFloat(b.securityScore) - parseFloat(a.securityScore);
      });
    }),

  upsert: publicQuery
    .input(z.object({ sourceChain: z.string(), targetChain: z.string(), bridgeName: z.string(), averageFee: z.string(), averageTime: z.number(), securityScore: z.string(), reliabilityScore: z.string().optional(), congestionLevel: z.string().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select().from(schema.bridgeRoutes).where(
        and(eq(schema.bridgeRoutes.sourceChain, input.sourceChain), eq(schema.bridgeRoutes.targetChain, input.targetChain), eq(schema.bridgeRoutes.bridgeName, input.bridgeName as any))
      ).limit(1);
      if (existing[0]) {
        await db.update(schema.bridgeRoutes).set({ ...input, bridgeName: input.bridgeName as any, lastUpdated: new Date() }).where(eq(schema.bridgeRoutes.id, existing[0].id));
        return { ...existing[0], ...input, lastUpdated: new Date() };
      }
      const result = await db.insert(schema.bridgeRoutes).values({ ...input, bridgeName: input.bridgeName as any } as any).returning();
      return result[0];
    }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const routes = await db.select().from(schema.bridgeRoutes).where(eq(schema.bridgeRoutes.isActive, true));
    const totalRoutes = routes.length;
    const avgFee = routes.reduce((sum, r) => sum + parseFloat(r.averageFee), 0) / (totalRoutes || 1);
    const avgTime = routes.reduce((sum, r) => sum + r.averageTime, 0) / (totalRoutes || 1);
    const avgSecurity = routes.reduce((sum, r) => sum + parseFloat(r.securityScore), 0) / (totalRoutes || 1);
    return { totalRoutes, averageFee: avgFee.toFixed(8), averageTimeSeconds: Math.round(avgTime), averageSecurity: avgSecurity.toFixed(2) };
  }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(schema.bridgeRoutes).where(eq(schema.bridgeRoutes.id, input.id));
    return { success: true };
  }),
});