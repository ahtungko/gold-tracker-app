import { z } from "zod";
import { DEFAULT_CURRENCY } from "@shared/const";
import { publicProcedure, router } from "../_core/trpc";
import { fetchGoldPrice, fetchHistoricalData } from "../services/goldPriceService";

export const goldRouter = router({
  /**
   * Get current gold price in a specific currency
   */
  getCurrentPrice: publicProcedure
    .input(z.object({ currency: z.string().default(DEFAULT_CURRENCY) }))
    .query(async ({ input }) => {
      return await fetchGoldPrice(input.currency);
    }),

  /**
   * Get historical gold price data
   * Note: Returns empty array as goldprice.org API doesn't provide historical data
   */
  getHistoricalData: publicProcedure
    .input(
      z.object({
        currency: z.string().default(DEFAULT_CURRENCY),
        days: z.number().default(30),
      }),
    )
    .query(async ({ input }) => {
      return await fetchHistoricalData(input.currency, input.days);
    }),
});

