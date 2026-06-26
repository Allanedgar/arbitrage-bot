import { authRouter } from "./auth-router";
import { arbitrageRouter } from "./routers/arbitrage";
import { bridgeRouter } from "./routers/bridge";
import { exchangeRouter } from "./routers/exchange";
import { executionRouter } from "./routers/execution";
import { priceRouter } from "./routers/price";
import { alertRouter } from "./routers/alert";
import { walletRouter } from "./routers/wallet";
import { detectionRouter } from "./routers/detection";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  arbitrage: arbitrageRouter,
  bridge: bridgeRouter,
  exchange: exchangeRouter,
  execution: executionRouter,
  price: priceRouter,
  alert: alertRouter,
  wallet: walletRouter,
  detection: detectionRouter,
});

export type AppRouter = typeof appRouter;