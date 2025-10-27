import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SubscriptionStore } from "./subscriptionStore";

function createTempFilePath(): string {
  return path.join(tmpdir(), `push-store-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
}

async function readFileIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

describe("SubscriptionStore", () => {
  it("persists subscriptions to disk", async () => {
    const storagePath = createTempFilePath();
    const store = new SubscriptionStore(storagePath, { debounceMs: 0 });

    store.upsert(
      {
        endpoint: "https://example.com/subscription",
        expirationTime: null,
        keys: { p256dh: "key123", auth: "auth" },
      },
      { preferredCurrency: "usd" },
    );

    await store.flush();

    const persisted = await readFileIfExists(storagePath);
    expect(persisted).not.toBeNull();

    const reloaded = new SubscriptionStore(storagePath, { debounceMs: 0 });
    const loaded = reloaded.get("https://example.com/subscription");

    expect(loaded).toBeDefined();
    expect(loaded?.metadata?.preferredCurrency).toBe("USD");
    expect(loaded?.createdAt).toBeGreaterThan(0);
    expect(loaded?.updatedAt).toBeGreaterThan(0);
  });

  it("marks deliveries and updates timestamps", async () => {
    const storagePath = createTempFilePath();
    const store = new SubscriptionStore(storagePath, { debounceMs: 0 });

    store.upsert(
      {
        endpoint: "https://example.com/notify",
        expirationTime: null,
        keys: {},
      },
      undefined,
    );

    const deliveredAt = Date.now();
    const updated = store.markDelivered("https://example.com/notify", deliveredAt);
    expect(updated?.lastNotifiedAt).toBe(deliveredAt);
    expect(updated?.updatedAt).toBe(deliveredAt);

    await store.flush();

    const reloaded = new SubscriptionStore(storagePath, { debounceMs: 0 });
    const loaded = reloaded.get("https://example.com/notify");
    expect(loaded?.lastNotifiedAt).toBe(deliveredAt);
  });

  it("removes subscriptions", async () => {
    const storagePath = createTempFilePath();
    const store = new SubscriptionStore(storagePath, { debounceMs: 0 });

    store.upsert(
      {
        endpoint: "https://example.com/remove",
        expirationTime: null,
        keys: {},
      },
      undefined,
    );

    const removed = store.remove("https://example.com/remove");
    expect(removed).toBe(true);

    await store.flush();

    const reloaded = new SubscriptionStore(storagePath, { debounceMs: 0 });
    expect(reloaded.get("https://example.com/remove")).toBeUndefined();
  });
});
