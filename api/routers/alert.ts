import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";

export const alertRouter = createRouter({
  list: publicQuery
    .input(z.object({ userId: z.number(), isActive: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.userId) conditions.push(eq(schema.alerts.userId, input.userId));
      if (input?.isActive !== undefined) conditions.push(eq(schema.alerts.isActive, input.isActive));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(schema.alerts).where(where).orderBy(desc(schema.alerts.createdAt));
    }),

  create: publicQuery
    .input(z.object({ userId: z.number(), name: z.string(), alertType: z.string(), conditions: z.any(), notificationChannels: z.any() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(schema.alerts).values({ ...input, isActive: true, triggeredCount: 0 } as any).returning();
      return result[0];
    }),

  update: publicQuery
    .input(z.object({ id: z.number(), name: z.string().optional(), conditions: z.any().optional(), notificationChannels: z.any().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const db = getDb();
      const result = await db.update(schema.alerts).set(updates as any).where(eq(schema.alerts.id, id)).returning();
      return result[0];
    }),

  trigger: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select().from(schema.alerts).where(eq(schema.alerts.id, input.id)).limit(1);
      if (!existing[0]) return { success: false };
      await db.update(schema.alerts).set({ triggeredCount: (existing[0].triggeredCount ?? 0) + 1, lastTriggeredAt: new Date() }).where(eq(schema.alerts.id, input.id));
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(schema.alerts).where(eq(schema.alerts.id, input.id));
      return { success: true };
    }),
});