import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import {
  NormalizedPushSubscription,
  NormalizedSubscriptionMetadata,
  normalizeMetadata,
} from "./schemas";

export interface StoredSubscription extends NormalizedPushSubscription {
  metadata?: NormalizedSubscriptionMetadata;
  createdAt: number;
  updatedAt: number;
  lastNotifiedAt?: number;
}

export interface SubscriptionStoreOptions {
  debounceMs?: number;
}

export class SubscriptionStore {
  private readonly filePath: string;
  private readonly debounceMs: number;
  private readonly store = new Map<string, StoredSubscription>();
  private persistTimer: NodeJS.Timeout | null = null;
  private persistPromise: Promise<void> | null = null;

  constructor(filePath: string, options: SubscriptionStoreOptions = {}) {
    this.filePath = path.resolve(filePath);
    this.debounceMs = Math.max(0, options.debounceMs ?? 250);
    this.loadFromDisk();
  }

  /**
   * Returns a snapshot copy of all subscriptions.
   */
  list(): StoredSubscription[] {
    return Array.from(this.store.values()).map(cloneSubscription);
  }

  /**
   * Retrieve a subscription by endpoint.
   */
  get(endpoint: string): StoredSubscription | undefined {
    const record = this.store.get(endpoint);
    return record ? cloneSubscription(record) : undefined;
  }

  /**
   * Add or update a subscription and persist to disk.
   */
  upsert(
    subscription: NormalizedPushSubscription,
    metadata?: NormalizedSubscriptionMetadata | null,
  ): StoredSubscription {
    const now = Date.now();
    const existing = this.store.get(subscription.endpoint);

    const normalizedMetadata = normalizeMetadata(metadata);
    const record: StoredSubscription = {
      ...subscription,
      metadata: normalizedMetadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      lastNotifiedAt: existing?.lastNotifiedAt,
    };

    this.store.set(subscription.endpoint, record);
    this.schedulePersist();

    return cloneSubscription(record);
  }

  /**
   * Remove a subscription by endpoint.
   */
  remove(endpoint: string): boolean {
    const existed = this.store.delete(endpoint);
    if (existed) {
      this.schedulePersist();
    }
    return existed;
  }

  /**
   * Update the delivery metadata for a subscription.
   */
  markDelivered(endpoint: string, timestamp: number = Date.now()): StoredSubscription | undefined {
    const current = this.store.get(endpoint);
    if (!current) {
      return undefined;
    }

    const updated: StoredSubscription = {
      ...current,
      updatedAt: timestamp,
      lastNotifiedAt: timestamp,
    };

    this.store.set(endpoint, updated);
    this.schedulePersist();

    return cloneSubscription(updated);
  }

  /**
   * Ensure all pending writes complete.
   */
  async flush(): Promise<void> {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
      this.persistPromise = this.persist();
    }

    if (this.persistPromise) {
      await this.persistPromise;
    }
  }

  private loadFromDisk() {
    if (!fs.existsSync(this.filePath)) {
      return;
    }

    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      if (!raw.trim()) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.warn(`[push] Subscription store file contained invalid data, ignoring.`);
        return;
      }

      for (const item of parsed) {
        if (!item || typeof item !== "object") {
          continue;
        }
        const candidate = item as Partial<StoredSubscription>;
        if (typeof candidate.endpoint !== "string" || !candidate.endpoint) {
          continue;
        }

        const normalized: StoredSubscription = {
          endpoint: candidate.endpoint,
          expirationTime: typeof candidate.expirationTime === "number" ? candidate.expirationTime : null,
          keys: {
            ...(candidate.keys?.p256dh ? { p256dh: candidate.keys.p256dh } : {}),
            ...(candidate.keys?.auth ? { auth: candidate.keys.auth } : {}),
          },
          metadata: normalizeMetadata(candidate.metadata),
          createdAt: typeof candidate.createdAt === "number" ? candidate.createdAt : Date.now(),
          updatedAt: typeof candidate.updatedAt === "number" ? candidate.updatedAt : Date.now(),
          lastNotifiedAt:
            typeof candidate.lastNotifiedAt === "number" ? candidate.lastNotifiedAt : undefined,
        };

        this.store.set(normalized.endpoint, normalized);
      }
    } catch (error) {
      console.error(`[push] Failed to load subscription store:`, error);
    }
  }

  private schedulePersist() {
    if (this.debounceMs === 0) {
      this.persistPromise = this.persist();
      return;
    }

    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
    }

    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.persistPromise = this.persist();
    }, this.debounceMs);
  }

  private async persist(): Promise<void> {
    const tempPath = `${this.filePath}.${randomUUID()}.tmp`;

    try {
      const data = JSON.stringify(Array.from(this.store.values()), null, 2);
      const directory = path.dirname(this.filePath);
      await fsPromises.mkdir(directory, { recursive: true });

      await fsPromises.writeFile(tempPath, data, "utf-8");
      try {
        await fsPromises.rename(tempPath, this.filePath);
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err?.code === "EEXIST" || err?.code === "EPERM") {
          await fsPromises.rm(this.filePath, { force: true });
          await fsPromises.rename(tempPath, this.filePath);
        } else if (err?.code === "ENOENT") {
          await fsPromises.writeFile(this.filePath, data, "utf-8");
          await fsPromises.rm(tempPath, { force: true });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error(`[push] Failed to persist subscription store:`, error);
      try {
        await fsPromises.rm(tempPath, { force: true });
      } catch {
        // ignore cleanup errors
      }
    } finally {
      this.persistPromise = null;
    }
  }
}

function cloneSubscription(record: StoredSubscription): StoredSubscription {
  return {
    ...record,
    keys: { ...record.keys },
    metadata: record.metadata ? { ...record.metadata } : undefined,
  };
}
