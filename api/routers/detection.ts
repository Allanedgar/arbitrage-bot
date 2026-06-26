import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

const EXCHANGES = [
  "binance", "coinbase", "kraken", "uniswap_v3",
  "pancakeswap", "sushiswap", "curve",
];

const CHAINS = [
  "ethereum", "bsc", "polygon", "arbitrum", "optimism", "solana",
];

const PAIRS = [
  { base: "BTC", quote: "USDT" },
  { base: "ETH", quote: "USDT" },
  { base: "ETH", quote: "BTC" },
  { base: "BNB", quote: "USDT" },
  { base: "SOL", quote: "USDT" },
  { base: "MATIC", quote: "USDT" },
  { base: "ARB", quote: "USDT" },
  { base: "OP", quote: "USDT" },
  { base: "USDC", quote: "USDT" },
  { base: "DAI", quote: "USDT" },
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateOpportunity(): Omit<
  typeof schema.arbitrageOpportunities.$inferInsert,
  "id" | "createdAt"
> {
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  const sourceExchange = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
  let targetExchange = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
  while (targetExchange === sourceExchange) {
    targetExchange = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
  }

  const sourceChain = CHAINS[Math.floor(Math.random() * CHAINS.length)];
  let targetChain = CHAINS[Math.floor(Math.random() * CHAINS.length)];
  if (Math.random() > 0.3) {
    targetChain = sourceChain;
  }

  const basePrice = randomBetween(100, 50000);
  const priceDeltaPct = randomBetween(0.1, 5.0);
  const targetPrice = basePrice * (1 + priceDeltaPct / 100);

  const estimatedProfit = randomBetween(10, 500);
  const estimatedGasCost = randomBetween(1, 50);
  const bridgeFee = sourceChain !== targetChain ? randomBetween(5, 100) : 0;
  const netProfit = estimatedProfit - estimatedGasCost - (bridgeFee || 0);

  const riskScore = randomBetween(1, 100);
  const confidenceScore = randomBetween(30, 95);
  const liquidityScore = randomBetween(40, 98);

  const opportunityTypes = ["spatial", "triangular", "statistical", "cross_chain", "stablecoin_peg"] as const;
  const opportunityType = sourceChain !== targetChain
    ? "cross_chain"
    : opportunityTypes[Math.floor(Math.random() * opportunityTypes.length)];

  return {
    opportunityType: opportunityType as any,
    sourceExchange,
    targetExchange,
    sourceChain,
    targetChain,
    sourceToken: pair.base,
    targetToken: pair.quote,
    sourcePrice: String(basePrice),
    targetPrice: String(targetPrice),
    priceDeltaPct: String(priceDeltaPct.toFixed(4)),
    estimatedProfit: String(estimatedProfit.toFixed(8)),
    estimatedGasCost: String(estimatedGasCost.toFixed(8)),
    bridgeFee: String(bridgeFee.toFixed(8)),
    netProfit: String(Math.max(0, netProfit).toFixed(8)),
    riskScore: String(riskScore.toFixed(2)),
    confidenceScore: String(confidenceScore.toFixed(2)),
    liquidityScore: String(liquidityScore.toFixed(2)),
    requiredCapital: String(randomBetween(100, 10000).toFixed(8)),
    executionPath: JSON.stringify([
      { step: 1, action: "buy", exchange: sourceExchange, token: pair.base },
      { step: 2, action: sourceChain !== targetChain ? "bridge" : "swap", from: sourceChain, to: targetChain },
      { step: 3, action: "sell", exchange: targetExchange, token: pair.base },
    ]),
    status: "active" as any,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    metadata: JSON.stringify({
      blockNumber: Math.floor(randomBetween(18000000, 20000000)),
      gasPrice: randomBetween(10, 100).toFixed(2),
      mevRisk: riskScore > 70 ? "high" : riskScore > 40 ? "medium" : "low",
    }),
  };
}

export const detectionRouter = createRouter({
  simulate: publicQuery
    .input(z.object({ count: z.number().default(10) }).optional())
    .mutation(async ({ input }) => {
      const db = getDb();
      const count = input?.count ?? 10;
      const opportunities = [];

      for (let i = 0; i < count; i++) {
        const opp = generateOpportunity();
        const result = await db
          .insert(schema.arbitrageOpportunities)
          .values(opp as any)
          .returning();
        opportunities.push(result[0]);
      }

      return opportunities;
    }),

  scan: publicQuery
    .input(z.object({
      exchanges: z.array(z.string()).optional(),
      minProfit: z.number().default(0),
      maxRisk: z.number().default(100),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [
        eq(schema.arbitrageOpportunities.status, "active" as any),
      ];

      if (input?.minProfit) {
        conditions.push(gte(schema.arbitrageOpportunities.netProfit, String(input.minProfit)));
      }
      if (input?.maxRisk) {
        conditions.push(gte(schema.arbitrageOpportunities.riskScore, String(input.maxRisk)));
      }

      const opportunities = await db
        .select()
        .from(schema.arbitrageOpportunities)
        .where(and(...conditions))
        .orderBy(desc(schema.arbitrageOpportunities.netProfit))
        .limit(50);

      return {
        count: opportunities.length,
        opportunities,
        scanTime: new Date().toISOString(),
      };
    }),

  cleanup: publicQuery
    .input(z.object({ olderThanMinutes: z.number().default(30) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(schema.arbitrageOpportunities)
        .set({ status: "expired" as any })
        .where(
          and(
            eq(schema.arbitrageOpportunities.status, "active" as any),
            gte(schema.arbitrageOpportunities.expiresAt, new Date(0))
          )
        );

      return { success: true, cutoff: new Date(Date.now() - (input?.olderThanMinutes ?? 30) * 60 * 1000).toISOString() };
    }),
});