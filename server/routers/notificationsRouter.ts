import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getPreferredCurrency,
  pushSubscriptionSchema,
  subscriptionMetadataSchema,
} from "../services/push/schemas";
import {
  SUBSCRIPTION_REFRESH_INTERVAL_MS,
  pushNotificationService,
  subscriptionStore,
} from "../services/pushNotificationService";

const subscribeInputSchema = z.object({
  subscription: pushSubscriptionSchema,
  metadata: subscriptionMetadataSchema.optional(),
});

const unsubscribeInputSchema = z.object({
  endpoint: z.string().trim().min(1),
});

export const notificationsRouter = router({
  getPublicKey: publicProcedure.query(() => {
    const publicKey = pushNotificationService.getPublicKey();
    const enabled = pushNotificationService.isEnabled();

    return {
      enabled,
      publicKey,
      refreshIntervalSeconds: Math.floor(SUBSCRIPTION_REFRESH_INTERVAL_MS / 1000),
    } as const;
  }),

  status: publicProcedure.query(() => {
    const subscriptions = subscriptionStore.list();
    const currencies = new Set<string>();

    for (const subscription of subscriptions) {
      currencies.add(getPreferredCurrency(subscription.metadata));
    }

    return {
      enabled: pushNotificationService.isEnabled(),
      total: subscriptions.length,
      currencies: Array.from(currencies),
    } as const;
  }),

  subscribe: publicProcedure
    .input(subscribeInputSchema)
    .mutation(async ({ input }) => {
      try {
        const { subscription } = await pushNotificationService.register(input.subscription, input.metadata);
        const nextRefreshAt = new Date(Date.now() + SUBSCRIPTION_REFRESH_INTERVAL_MS).toISOString();

        return {
          success: true,
          endpoint: subscription.endpoint,
          preferredCurrency: getPreferredCurrency(subscription.metadata),
          nextRefreshAt,
        } as const;
      } catch (error) {
        if (error instanceof Error && /not configured/i.test(error.message)) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: error.message,
            cause: error,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to register push subscription",
          cause: error,
        });
      }
    }),

  unsubscribe: publicProcedure
    .input(unsubscribeInputSchema)
    .mutation(async ({ input }) => {
      const removed = await pushNotificationService.unregister(input.endpoint);

      return {
        success: true,
        removed,
      } as const;
    }),
});
