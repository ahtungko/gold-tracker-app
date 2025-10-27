export interface NormalizedPushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh?: string;
    auth?: string;
  };
}

export interface PushSubscriptionMetadata {
  userAgent?: string;
  language?: string;
  platform?: string;
  source?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mapNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

export function normalizePushSubscriptionJSON(
  input: PushSubscriptionJSON | null | undefined,
): NormalizedPushSubscription | null {
  if (!input || typeof input.endpoint !== "string" || !input.endpoint) {
    return null;
  }

  const keysCandidate = "keys" in input && isRecord(input.keys) ? (input.keys as Record<string, unknown>) : {};
  const normalizedKeys: NormalizedPushSubscription["keys"] = {};

  const p256dh = keysCandidate.p256dh;
  if (typeof p256dh === "string" && p256dh) {
    normalizedKeys.p256dh = p256dh;
  }

  const auth = keysCandidate.auth;
  if (typeof auth === "string" && auth) {
    normalizedKeys.auth = auth;
  }

  return {
    endpoint: input.endpoint,
    expirationTime: mapNullableNumber(input.expirationTime ?? null),
    keys: normalizedKeys,
  };
}

function hasToJSON(candidate: unknown): candidate is { toJSON: () => PushSubscriptionJSON } {
  return Boolean(candidate) && typeof candidate === "object" && typeof (candidate as { toJSON?: unknown }).toJSON === "function";
}

export function serializePushSubscription(
  input: PushSubscription | PushSubscriptionJSON | null | undefined,
): NormalizedPushSubscription | null {
  if (!input) {
    return null;
  }

  const json = hasToJSON(input) ? input.toJSON() : (input as PushSubscriptionJSON);
  return normalizePushSubscriptionJSON(json);
}

export function base64UrlToUint8Array(base64String: string): Uint8Array {
  if (!base64String) {
    return new Uint8Array();
  }

  const normalized = base64String.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized.padEnd(normalized.length + paddingLength, "=");

  let binaryString: string;

  if (typeof atob === "function") {
    binaryString = atob(padded);
  } else if (typeof Buffer !== "undefined") {
    binaryString = Buffer.from(padded, "base64").toString("binary");
  } else {
    throw new Error("No base64 decoder available in this environment");
  }

  const outputArray = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    outputArray[i] = binaryString.charCodeAt(i);
  }

  return outputArray;
}
