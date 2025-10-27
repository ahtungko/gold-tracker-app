import { describe, expect, it } from "vitest";

import { base64UrlToUint8Array, normalizePushSubscriptionJSON } from "../pushSubscription";
import { evaluatePushSupport, isIosDevice } from "../pushSupport";

describe("push subscription helpers", () => {
  it("converts base64url strings to Uint8Array", () => {
    const result = base64UrlToUint8Array("AQAB");
    expect(Array.from(result)).toEqual([1, 0, 1]);
  });

  it("returns an empty array for empty input", () => {
    const result = base64UrlToUint8Array("");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });

  it("normalizes push subscription JSON payloads", () => {
    const normalized = normalizePushSubscriptionJSON({
      endpoint: "https://example.com",
      expirationTime: null,
      keys: {
        p256dh: "abc",
        auth: "def",
        extra: "ignore",
      },
    } as unknown as PushSubscriptionJSON);

    expect(normalized).toEqual({
      endpoint: "https://example.com",
      expirationTime: null,
      keys: {
        p256dh: "abc",
        auth: "def",
      },
    });
  });

  it("returns null for invalid subscription payloads", () => {
    expect(normalizePushSubscriptionJSON(undefined)).toBeNull();
    expect(normalizePushSubscriptionJSON({} as PushSubscriptionJSON)).toBeNull();
  });
});

describe("push support detection", () => {
  it("detects iOS devices", () => {
    expect(isIosDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"))
      .toBe(true);
    expect(isIosDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"))
      .toBe(false);
  });

  it("flags missing browser capabilities", () => {
    expect(evaluatePushSupport({ hasNotification: false }).reason).toBe("no-notification-api");
    expect(evaluatePushSupport({ hasNotification: true, hasServiceWorker: false }).reason).toBe("no-service-worker");
    expect(
      evaluatePushSupport({ hasNotification: true, hasServiceWorker: true, hasPushManager: false }).reason,
    ).toBe("no-push-manager");
  });

  it("requires standalone mode on iOS", () => {
    const result = evaluatePushSupport({
      hasNotification: true,
      hasServiceWorker: true,
      hasPushManager: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      standalone: false,
    });

    expect(result.reason).toBe("not-standalone");

    const okResult = evaluatePushSupport({
      hasNotification: true,
      hasServiceWorker: true,
      hasPushManager: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      standalone: true,
    });

    expect(okResult.supported).toBe(true);
  });
});
