import { z } from "zod";

export const pushSubscriptionSchema = z
  .object({
    endpoint: z.string().trim().min(1),
    expirationTime: z.number().int().nullable().optional(),
    keys: z
      .object({
        p256dh: z.string().trim().min(1),
        auth: z.string().trim().min(1),
      })
      .partial()
      .optional(),
  })
  .strip();

export const subscriptionMetadataSchema = z
  .object({
    currency: z.string().trim().min(3).max(6).optional(),
    preferredCurrency: z.string().trim().min(3).max(6).optional(),
    userAgent: z.string().trim().optional(),
    language: z.string().trim().optional(),
    platform: z.string().trim().optional(),
    source: z.string().trim().optional(),
    timezone: z.string().trim().optional(),
  })
  .strip();

export type PushSubscriptionPayload = z.infer<typeof pushSubscriptionSchema>;
export type SubscriptionMetadataPayload = z.infer<typeof subscriptionMetadataSchema>;

export interface NormalizedPushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh?: string;
    auth?: string;
  };
}

export interface NormalizedSubscriptionMetadata extends SubscriptionMetadataPayload {
  preferredCurrency?: string;
}

export const DEFAULT_PREFERRED_CURRENCY = "USD" as const;

export function normalizeSubscription(input: PushSubscriptionPayload): NormalizedPushSubscription {
  const normalizedKeys: NormalizedPushSubscription["keys"] = {};
  const keys = input.keys ?? {};

  if (typeof keys.p256dh === "string" && keys.p256dh.trim()) {
    normalizedKeys.p256dh = keys.p256dh.trim();
  }

  if (typeof keys.auth === "string" && keys.auth.trim()) {
    normalizedKeys.auth = keys.auth.trim();
  }

  const expirationTime =
    typeof input.expirationTime === "number" && Number.isFinite(input.expirationTime)
      ? input.expirationTime
      : null;

  return {
    endpoint: input.endpoint.trim(),
    expirationTime,
    keys: normalizedKeys,
  };
}

export function normalizeMetadata(
  metadata?: SubscriptionMetadataPayload | null,
): NormalizedSubscriptionMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  const cleanedEntries = Object.entries(metadata).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        acc[key] = trimmed;
      }
    }
    return acc;
  }, {});

  const preferredSource = cleanedEntries.preferredCurrency ?? cleanedEntries.currency;
  const normalizedCurrency = preferredSource ? preferredSource.toUpperCase() : undefined;

  if (normalizedCurrency) {
    cleanedEntries.preferredCurrency = normalizedCurrency;
  } else {
    delete cleanedEntries.preferredCurrency;
  }

  if (!Object.keys(cleanedEntries).length) {
    return undefined;
  }

  return cleanedEntries as NormalizedSubscriptionMetadata;
}

export function getPreferredCurrency(
  metadata: NormalizedSubscriptionMetadata | undefined,
  fallback: string = DEFAULT_PREFERRED_CURRENCY,
): string {
  if (!metadata) {
    return fallback;
  }

  const candidate = metadata.preferredCurrency ?? metadata.currency;
  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim().toUpperCase();
  }

  return fallback;
}
