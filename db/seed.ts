import { getDb } from "../api/queries/connection";
import * as schema from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed tokens
  const tokensData = [
    { symbol: "BTC", name: "Bitcoin", chain: "ethereum", decimals: 8, isStablecoin: false },
    { symbol: "ETH", name: "Ethereum", chain: "ethereum", decimals: 18, isStablecoin: false },
    { symbol: "BNB", name: "BNB", chain: "bsc", decimals: 18, isStablecoin: false },
    { symbol: "SOL", name: "Solana", chain: "solana", decimals: 9, isStablecoin: false },
    { symbol: "MATIC", name: "Polygon", chain: "polygon", decimals: 18, isStablecoin: false },
    { symbol: "ARB", name: "Arbitrum", chain: "arbitrum", decimals: 18, isStablecoin: false },
    { symbol: "OP", name: "Optimism", chain: "optimism", decimals: 18, isStablecoin: false },
    { symbol: "USDT", name: "Tether", chain: "ethereum", decimals: 6, isStablecoin: true },
    { symbol: "USDC", name: "USD Coin", chain: "ethereum", decimals: 6, isStablecoin: true },
    { symbol: "DAI", name: "Dai", chain: "ethereum", decimals: 18, isStablecoin: true },
  ];

  for (const token of tokensData) {
    await db.insert(schema.tokens).values(token).onConflictDoNothing();
  }
  console.log("Seeded tokens");

  // Seed bridge routes
  const bridgeData = [
    { sourceChain: "ethereum", targetChain: "polygon", bridgeName: "polygon_pos" as any, averageFee: "12.50", averageTime: 180, securityScore: "85.00", reliabilityScore: "92.00", isActive: true },
    { sourceChain: "ethereum", targetChain: "arbitrum", bridgeName: "arbitrum" as any, averageFee: "8.20", averageTime: 600, securityScore: "90.00", reliabilityScore: "88.00", isActive: true },
    { sourceChain: "ethereum", targetChain: "optimism", bridgeName: "optimism" as any, averageFee: "7.80", averageTime: 300, securityScore: "88.00", reliabilityScore: "90.00", isActive: true },
    { sourceChain: "ethereum", targetChain: "bsc", bridgeName: "celer" as any, averageFee: "15.00", averageTime: 240, securityScore: "78.00", reliabilityScore: "85.00", isActive: true },
    { sourceChain: "ethereum", targetChain: "solana", bridgeName: "wormhole" as any, averageFee: "25.00", averageTime: 900, securityScore: "75.00", reliabilityScore: "80.00", isActive: true },
    { sourceChain: "polygon", targetChain: "arbitrum", bridgeName: "hop" as any, averageFee: "18.50", averageTime: 300, securityScore: "82.00", reliabilityScore: "86.00", isActive: true },
    { sourceChain: "bsc", targetChain: "polygon", bridgeName: "synapse" as any, averageFee: "10.00", averageTime: 200, securityScore: "80.00", reliabilityScore: "84.00", isActive: true },
    { sourceChain: "arbitrum", targetChain: "optimism", bridgeName: "hop" as any, averageFee: "14.20", averageTime: 250, securityScore: "83.00", reliabilityScore: "87.00", isActive: true },
  ];

  for (const route of bridgeData) {
    await db.insert(schema.bridgeRoutes).values(route).onConflictDoNothing();
  }
  console.log("Seeded bridge routes");

  // Seed some initial opportunities
  const opportunityTypes = ["spatial", "triangular", "cross_chain", "stablecoin_peg"] as const;
  const exchanges = ["binance", "uniswap_v3", "pancakeswap", "sushiswap", "kraken", "coinbase"];
  const pairs = [
    { source: "BTC", target: "USDT" },
    { source: "ETH", target: "USDT" },
    { source: "ETH", target: "BTC" },
    { source: "SOL", target: "USDT" },
    { source: "ARB", target: "ETH" },
  ];

  for (let i = 0; i < 8; i++) {
    const pair = pairs[i % pairs.length];
    const sourceEx = exchanges[i % exchanges.length];
    const targetEx = exchanges[(i + 1) % exchanges.length];
    const type = opportunityTypes[i % opportunityTypes.length];
    const isCrossChain = type === "cross_chain";
    const chains = ["ethereum", "bsc", "polygon", "arbitrum"];
    const sourceChain = chains[i % chains.length];
    const targetChain = isCrossChain ? chains[(i + 1) % chains.length] : sourceChain;

    const priceDelta = (Math.random() * 4 + 0.5).toFixed(4);
    const basePrice = (Math.random() * 40000 + 100).toFixed(2);
    const profit = (Math.random() * 200 + 10).toFixed(8);
    const gasCost = (Math.random() * 30 + 2).toFixed(8);
    const bridgeFee = isCrossChain ? (Math.random() * 50 + 5).toFixed(8) : "0";

    await db.insert(schema.arbitrageOpportunities).values({
      opportunityType: type,
      sourceExchange: sourceEx,
      targetExchange: targetEx,
      sourceChain,
      targetChain,
      sourceToken: pair.source,
      targetToken: pair.target,
      sourcePrice: basePrice,
      targetPrice: (parseFloat(basePrice) * (1 + parseFloat(priceDelta) / 100)).toFixed(2),
      priceDeltaPct: priceDelta,
      estimatedProfit: profit,
      estimatedGasCost: gasCost,
      bridgeFee,
      netProfit: (parseFloat(profit) - parseFloat(gasCost) - parseFloat(bridgeFee)).toFixed(8),
      riskScore: (Math.random() * 60 + 10).toFixed(2),
      confidenceScore: (Math.random() * 40 + 50).toFixed(2),
      liquidityScore: (Math.random() * 40 + 50).toFixed(2),
      requiredCapital: (Math.random() * 5000 + 500).toFixed(8),
      status: "active" as any,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    } as any);
  }
  console.log("Seeded opportunities");

  console.log("Seed complete!");
}

seed().catch(console.error);