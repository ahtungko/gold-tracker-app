import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

const pushSubscriptionSchema = z
  .object({
    endpoint: z.string().min(1),
    expirationTime: z.number().nullable().optional(),
    keys: z
      .object({
        p256dh: z.string().min(1).optional(),
        auth: z.string().min(1).optional(),
      })
      .partial()
      .optional(),
  })
  .strip();

const metadataSchema = z
  .object({
    userAgent: z.string().optional(),
    language: z.string().optional(),
    platform: z.string().optional(),
    source: z.string().optional(),
  })
  .optional();

type NormalizedSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh?: string;
    auth?: string;
  };
};

type StoredSubscription = NormalizedSubscription & {
  metadata?: z.infer<typeof metadataSchema>;
  createdAt: number;
  updatedAt: number;
};

const subscriptionStore = new Map<string, StoredSubscription>();

function normalizeSubscription(input: z.infer<typeof pushSubscriptionSchema>): NormalizedSubscription {
  const keys = input.keys ?? {};
  const normalizedKeys: NormalizedSubscription["keys"] = {};

  if (typeof keys.p256dh === "string" && keys.p256dh) {
    normalizedKeys.p256dh = keys.p256dh;
  }

  if (typeof keys.auth === "string" && keys.auth) {
    normalizedKeys.auth = keys.auth;
  }

  return {
    endpoint: input.endpoint,
    expirationTime: typeof input.expirationTime === "number" ? input.expirationTime : null,
    keys: normalizedKeys,
  };
}

export const notificationsRouter = router({
  getPublicKey: publicProcedure.query(() => {
    const publicKey = process.env.WEB_PUSH_PUBLIC_KEY ?? process.env.VITE_VAPID_PUBLIC_KEY ?? "";

    if (!publicKey) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Push notifications are not configured.",
      });
    }

    return { publicKey } as const;
  }),

  subscribe: publicProcedure
    .input(
      z.object({
        subscription: pushSubscriptionSchema,
        metadata: metadataSchema,
      }),
    )
    .mutation(({ input }) => {
      const normalized = normalizeSubscription(input.subscription);
      const now = Date.now();
      const existing = subscriptionStore.get(normalized.endpoint);

      subscriptionStore.set(normalized.endpoint, {
        ...normalized,
        metadata: input.metadata,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });

      return {
        success: true,
        subscription: normalized,
      } as const;
    }),

  unsubscribe: publicProcedure
    .input(
      z.object({
        endpoint: z.string().min(1),
      }),
    )
    .mutation(({ input }) => {
      const existed = subscriptionStore.get(input.endpoint);
      subscriptionStore.delete(input.endpoint);

      return {
        success: true,
        removed: Boolean(existed),
      } as const;
    }),
});
