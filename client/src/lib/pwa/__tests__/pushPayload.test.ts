import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFICATION_BADGE,
  DEFAULT_NOTIFICATION_BODY,
  DEFAULT_NOTIFICATION_ICON,
  DEFAULT_NOTIFICATION_TAG,
  DEFAULT_NOTIFICATION_TITLE,
  DEFAULT_NOTIFICATION_URL,
  parseNotificationPayload,
} from "../../pwa/pushPayload";

describe("parseNotificationPayload", () => {
  it("normalises a rich payload", () => {
    const timestamp = Date.now();
    const result = parseNotificationPayload({
      title: "Spot price surge",
      body: "Gold is up 2.1% in the last hour",
      url: "/tracker",
      icon: "/custom-icon.png",
      badge: "/custom-badge.png",
      tag: "custom-tag",
      image: "/hero.png",
      timestamp,
      data: { currency: "USD", metal: "XAU" },
      actions: [
        { action: "open", title: "Open app" },
        { action: "dismiss", title: "Dismiss" },
        { action: "", title: "invalid" },
      ],
      vibrate: [100, 50, "not-a-number"],
      silent: true,
      requireInteraction: true,
    });

    expect(result.title).toBe("Spot price surge");
    expect(result.options.body).toBe("Gold is up 2.1% in the last hour");
    expect(result.options.icon).toBe("/custom-icon.png");
    expect(result.options.badge).toBe("/custom-badge.png");
    expect(result.options.tag).toBe("custom-tag");
    expect(result.options.image).toBe("/hero.png");
    expect(result.options.timestamp).toBe(timestamp);
    expect(result.options.data.url).toBe("/tracker");
    expect(result.options.data.meta).toEqual({ currency: "USD", metal: "XAU" });
    expect(result.options.data.payload.title).toBe("Spot price surge");
    expect(result.options.data.sentAt).toBe(timestamp);
    expect(result.options.actions).toEqual([
      { action: "open", title: "Open app" },
      { action: "dismiss", title: "Dismiss" },
    ]);
    expect(result.options.vibrate).toEqual([100, 50]);
    expect(result.options.requireInteraction).toBe(true);
    expect(result.options.silent).toBe(true);
  });

  it("falls back to defaults when payload is empty", () => {
    const result = parseNotificationPayload(null);

    expect(result.title).toBe(DEFAULT_NOTIFICATION_TITLE);
    expect(result.options.body).toBe(DEFAULT_NOTIFICATION_BODY);
    expect(result.options.icon).toBe(DEFAULT_NOTIFICATION_ICON);
    expect(result.options.badge).toBe(DEFAULT_NOTIFICATION_BADGE);
    expect(result.options.tag).toBe(DEFAULT_NOTIFICATION_TAG);
    expect(result.options.data.url).toBe(DEFAULT_NOTIFICATION_URL);
    expect(result.options.data.meta).toBeNull();
    expect(result.options.data.sentAt).toBeNull();
  });

  it("treats a plain string as the notification body", () => {
    const result = parseNotificationPayload("Market update available");

    expect(result.title).toBe(DEFAULT_NOTIFICATION_TITLE);
    expect(result.options.body).toBe("Market update available");
    expect(result.options.data.payload.body).toBe("Market update available");
  });

  it("parses JSON strings when provided", () => {
    const result = parseNotificationPayload(
      JSON.stringify({ title: "Parsed", body: "From JSON", url: "/" })
    );

    expect(result.title).toBe("Parsed");
    expect(result.options.body).toBe("From JSON");
    expect(result.options.data.payload.title).toBe("Parsed");
  });
});
