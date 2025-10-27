import path from "node:path";
import webPush, { type PushSubscription as WebPushSubscription } from "web-push";
import {
  DEFAULT_PREFERRED_CURRENCY,
  PushSubscriptionPayload,
  SubscriptionMetadataPayload,
  getPreferredCurrency,
  normalizeMetadata,
  normalizeSubscription,
} from "./push/schemas";
import { SubscriptionStore, StoredSubscription } from "./push/subscriptionStore";
import { fetchGoldPrice, type GoldPriceQuote } from "./goldPriceService";

export interface RegisterResult {
  subscription: StoredSubscription;
}

export interface NotificationStats {
  total: number;
  delivered: number;
  failures: number;
  pruned: number;
  skipped: number;
}

interface DeliveryResult {
  delivered: boolean;
  pruned: boolean;
  failure: boolean;
  skipped: boolean;
}

interface PushNotificationServiceOptions {
  intervalMs?: number;
  defaultSubject?: string;
}

const DEFAULT_INTERVAL_MS = 60_000;
export const SUBSCRIPTION_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_SUBJECT = "mailto:notifications@gold-tracker.app";
const STORAGE_ENV_KEY = "PUSH_SUBSCRIPTIONS_PATH";

export function resolveSubscriptionStorePath(): string {
  const configured = process.env[STORAGE_ENV_KEY];
  if (configured && configured.trim()) {
    return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  }
  return path.resolve(process.cwd(), "storage", "push-subscriptions.json");
}

export class PushNotificationService {
  private readonly store: SubscriptionStore;
  private readonly intervalMs: number;
  private readonly fallbackSubject: string;
  private timer: NodeJS.Timeout | null = null;
  private notifyInFlight = false;
  private pendingRun = false;
  private vapidPublicKey: string | null = null;
  private vapidPrivateKey: string | null = null;
  private vapidSubject: string = DEFAULT_SUBJECT;
  private configured = false;

  constructor(store: SubscriptionStore, options: PushNotificationServiceOptions = {}) {
    this.store = store;
    this.intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
    this.fallbackSubject = options.defaultSubject ?? DEFAULT_SUBJECT;
    this.syncConfiguration();
  }

  isEnabled(): boolean {
    this.syncConfiguration();
    return this.configured;
  }

  getPublicKey(): string | null {
    this.syncConfiguration();
    return this.vapidPublicKey;
  }

  async register(
    rawSubscription: PushSubscriptionPayload,
    metadata?: SubscriptionMetadataPayload | null,
  ): Promise<RegisterResult> {
    this.syncConfiguration();

    if (!this.configured) {
      throw new Error("Push notifications are not configured");
    }

    const normalizedSubscription = normalizeSubscription(rawSubscription);
    const normalizedMetadata = normalizeMetadata(metadata);
    const subscription = this.store.upsert(normalizedSubscription, normalizedMetadata);

    return { subscription };
  }

  async unregister(endpoint: string): Promise<boolean> {
    const removed = this.store.remove(endpoint);
    await this.store.flush();
    return removed;
  }

  async notifySubscribers(): Promise<NotificationStats> {
    this.syncConfiguration();

    const subscriptions = this.store.list();
    if (!this.configured || subscriptions.length === 0) {
      return {
        total: subscriptions.length,
        delivered: 0,
        failures: 0,
        pruned: 0,
        skipped: subscriptions.length,
      };
    }

    const grouped = new Map<string, StoredSubscription[]>();
    for (const subscription of subscriptions) {
      const currency = getPreferredCurrency(subscription.metadata, DEFAULT_PREFERRED_CURRENCY);
      if (!grouped.has(currency)) {
        grouped.set(currency, []);
      }
      grouped.get(currency)!.push(subscription);
    }

    const quotes = new Map<string, GoldPriceQuote>();

    for (const currency of grouped.keys()) {
      try {
        const quote = await fetchGoldPrice(currency);
        quotes.set(currency, quote);
      } catch (error) {
        console.error(`[push] Failed to fetch gold price for ${currency}:`, error);
      }
    }

    const deliveryPromises: Promise<DeliveryResult>[] = [];

    for (const [currency, group] of grouped.entries()) {
      const quote = quotes.get(currency);
      if (!quote) {
        for (const _ of group) {
          deliveryPromises.push(
            Promise.resolve({ delivered: false, pruned: false, failure: false, skipped: true } satisfies DeliveryResult),
          );
        }
        continue;
      }

      const payload = formatGoldPriceNotification(quote);
      for (const subscription of group) {
        deliveryPromises.push(
          this.sendNotification(subscription, payload, quote.timestamp).catch(error => {
            console.error(`[push] Unexpected error delivering notification:`, error);
            return { delivered: false, pruned: false, failure: true, skipped: false } as DeliveryResult;
          }),
        );
      }
    }

    const results = await Promise.all(deliveryPromises);

    const stats: NotificationStats = {
      total: subscriptions.length,
      delivered: 0,
      failures: 0,
      pruned: 0,
      skipped: 0,
    };

    for (const result of results) {
      if (result.skipped) {
        stats.skipped += 1;
      } else if (result.delivered) {
        stats.delivered += 1;
      } else {
        stats.failures += 1;
      }
      if (result.pruned) {
        stats.pruned += 1;
      }
    }

    return stats;
  }

  start(): void {
    if (this.timer) {
      return;
    }

    this.syncConfiguration();
    if (!this.configured) {
      console.warn("[push] Push notifications are disabled because VAPID credentials are missing.");
      return;
    }

    const run = async () => {
      if (this.notifyInFlight) {
        this.pendingRun = true;
        return;
      }
      this.notifyInFlight = true;
      try {
        const stats = await this.notifySubscribers();
        if (stats.delivered || stats.pruned || stats.failures) {
          console.info(
            `[push] Notifications delivered=${stats.delivered} failures=${stats.failures} pruned=${stats.pruned} total=${stats.total}`,
          );
        }
      } catch (error) {
        console.error("[push] Failed to notify subscribers:", error);
      } finally {
        this.notifyInFlight = false;
        if (this.pendingRun) {
          this.pendingRun = false;
          void run();
        }
      }
    };

    this.timer = setInterval(() => {
      void run();
    }, this.intervalMs);
    this.timer.unref?.();

    void run();
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.store.flush();
  }

  private async sendNotification(
    subscription: StoredSubscription,
    payload: string,
    timestamp: number,
  ): Promise<DeliveryResult> {
    try {
      const topicCurrency = getPreferredCurrency(subscription.metadata, DEFAULT_PREFERRED_CURRENCY).toLowerCase();
      await webPush.sendNotification(getWebPushSubscription(subscription), payload, {
        TTL: Math.ceil(this.intervalMs / 1000) + 30,
        urgency: "high",
        topic: `gold-${topicCurrency}`,
      });
      this.store.markDelivered(subscription.endpoint, toEpochMilliseconds(timestamp));
      return { delivered: true, pruned: false, failure: false, skipped: false };
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      const maskedEndpoint = maskEndpoint(subscription.endpoint);

      if (statusCode === 404 || statusCode === 410) {
        console.warn(`[push] Removing unreachable subscription: ${maskedEndpoint}`);
        this.store.remove(subscription.endpoint);
        return { delivered: false, pruned: true, failure: false, skipped: false };
      }

      console.error(`[push] Failed to deliver notification to ${maskedEndpoint}:`, error);
      return { delivered: false, pruned: false, failure: true, skipped: false };
    }
  }

  private syncConfiguration(): void {
    const publicKey = (
      process.env.VAPID_PUBLIC_KEY ??
      process.env.WEB_PUSH_PUBLIC_KEY ??
      process.env.VITE_VAPID_PUBLIC_KEY ??
      ""
    ).trim();
    const privateKey = (process.env.VAPID_PRIVATE_KEY ?? process.env.WEB_PUSH_PRIVATE_KEY ?? "").trim();
    const subject = (
      process.env.VAPID_SUBJECT ??
      process.env.WEB_PUSH_CONTACT ??
      this.fallbackSubject
    ).trim() || this.fallbackSubject;

    const publicChanged = publicKey !== this.vapidPublicKey;
    const privateChanged = privateKey !== this.vapidPrivateKey;
    const subjectChanged = subject !== this.vapidSubject;

    if (publicChanged || privateChanged || subjectChanged) {
      this.vapidPublicKey = publicKey || null;
      this.vapidPrivateKey = privateKey || null;
      this.vapidSubject = subject;
      this.configured = Boolean(this.vapidPublicKey && this.vapidPrivateKey);

      if (this.configured) {
        webPush.setVapidDetails(this.vapidSubject, this.vapidPublicKey!, this.vapidPrivateKey!);
      }
    }
  }
}

export function formatGoldPriceNotification(quote: GoldPriceQuote): string {
  const price = formatCurrency(quote.xauPrice, quote.currency);
  const changeValue = formatChange(quote.chgXau);
  const changePercentage = formatPercentage(quote.pcXau);
  const direction = quote.chgXau >= 0 ? "▲" : "▼";

  const body = `${price} ${direction} ${changeValue} (${changePercentage})`;

  const payload = {
    title: `Gold price update (${quote.currency})`,
    body,
    tag: `gold-price-${quote.currency.toLowerCase()}`,
    data: {
      currency: quote.currency,
      price: quote.xauPrice,
      change: quote.chgXau,
      changePercent: quote.pcXau,
      timestamp: quote.timestamp,
    },
  };

  return JSON.stringify(payload);
}

function formatCurrency(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) {
    return `0.00 ${currency}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
}

function formatChange(change: number): string {
  if (!Number.isFinite(change)) {
    return "0.00";
  }
  const sign = change >= 0 ? "+" : "-";
  return `${sign}${Math.abs(change).toFixed(2)}`;
}

function formatPercentage(percentage: number): string {
  if (!Number.isFinite(percentage)) {
    return "0.00%";
  }
  const sign = percentage >= 0 ? "+" : "-";
  return `${sign}${Math.abs(percentage).toFixed(2)}%`;
}

function getWebPushSubscription(subscription: StoredSubscription): WebPushSubscription {
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? undefined,
    keys: {
      ...(subscription.keys.p256dh ? { p256dh: subscription.keys.p256dh } : {}),
      ...(subscription.keys.auth ? { auth: subscription.keys.auth } : {}),
    },
  } as WebPushSubscription;
}

function maskEndpoint(endpoint: string): string {
  if (endpoint.length <= 20) {
    return endpoint;
  }
  return `${endpoint.slice(0, 25)}…${endpoint.slice(-8)}`;
}

function toEpochMilliseconds(value: number): number {
  if (!Number.isFinite(value)) {
    return Date.now();
  }
  return value > 1_000_000_000_000 ? Math.round(value) : Math.round(value * 1000);
}

const subscriptionStorePath = resolveSubscriptionStorePath();
export const subscriptionStore = new SubscriptionStore(subscriptionStorePath);
export const pushNotificationService = new PushNotificationService(subscriptionStore);
