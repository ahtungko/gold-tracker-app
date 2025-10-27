/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  matchPrecache,
  precacheAndRoute,
} from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import {
  DEFAULT_NOTIFICATION_BADGE,
  DEFAULT_NOTIFICATION_ICON,
  DEFAULT_NOTIFICATION_URL,
  parseNotificationPayload,
} from "./lib/pwa/pushPayload";
import type { NormalizedNotificationPayload } from "./lib/pwa/pushPayload";
import { base64UrlToUint8Array, normalizePushSubscriptionJSON } from "./lib/pwa/pushSubscription";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<import("workbox-precaching").PrecacheEntry>;
};

type PrecacheManifestEntry = string | import("workbox-precaching").PrecacheEntry;

function toPathname(url: string): string {
  return new URL(url, self.location.origin).pathname;
}

function getManifestEntryPath(entry: PrecacheManifestEntry): string {
  if (typeof entry === "string") {
    return toPathname(entry);
  }

  return toPathname(entry.url);
}

function ensureAppShellEntry(entries: ReadonlyArray<PrecacheManifestEntry>, appShellPathname: string): PrecacheManifestEntry[] {
  const manifest = Array.from(entries);
  const hasAppShell = manifest.some((entry) => getManifestEntryPath(entry) === appShellPathname);

  if (!hasAppShell) {
    manifest.push({
      url: appShellPathname,
      revision: `${Date.now()}`,
    });
  }

  return manifest;
}

const APP_SHELL_URL = "/index.html";
const APP_SHELL_PATHNAME = toPathname(APP_SHELL_URL);
const APP_SHELL_CACHE_KEYS = Array.from(
  new Set(
    [
      APP_SHELL_PATHNAME,
      APP_SHELL_URL,
      APP_SHELL_PATHNAME.startsWith("/") ? APP_SHELL_PATHNAME.slice(1) : APP_SHELL_PATHNAME,
    ].filter(Boolean),
  ),
);
const STATIC_ASSETS_CACHE = "gold-tracker-static-v1";
const STATIC_MEDIA_CACHE = "gold-tracker-media-v1";
const PRICE_DATA_CACHE = "gold-tracker-prices-v1";
const BROADCAST_CHANNEL_NAME = "gold-tracker-notifications";
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

async function getCachedAppShell(): Promise<Response | undefined> {
  for (const key of APP_SHELL_CACHE_KEYS) {
    const match = await matchPrecache(key);
    if (match) {
      return match;
    }
  }

  return undefined;
}

async function respondWithAppShell(event: FetchEvent, originalError?: unknown): Promise<Response> {
  const cached = await getCachedAppShell();
  if (cached) {
    return cached;
  }

  const preloadResponse = await event.preloadResponse;
  if (preloadResponse) {
    return preloadResponse;
  }

  try {
    return await fetch(APP_SHELL_PATHNAME, { cache: "reload" });
  } catch (fetchError) {
    if (originalError) {
      throw originalError;
    }

    throw fetchError;
  }
}

clientsClaim();
self.skipWaiting();

const precacheManifest = ensureAppShellEntry(self.__WB_MANIFEST, APP_SHELL_PATHNAME);

precacheAndRoute(precacheManifest);
cleanupOutdatedCaches();

let navigationHandler: ReturnType<typeof createHandlerBoundToURL> | null = null;

try {
  navigationHandler = createHandlerBoundToURL(APP_SHELL_PATHNAME);
} catch (error) {
  console.warn(
    "[PWA] Falling back to network navigation handling because the app shell is missing from the precache manifest.",
    error,
  );
}

registerRoute(
  ({ request }) => request.mode === "navigate",
  async ({ event }) => {
    if (navigationHandler) {
      try {
        return await navigationHandler({ event });
      } catch (error) {
        return respondWithAppShell(event, error);
      }
    }

    return respondWithAppShell(event);
  },
);

registerRoute(
  ({ request, sameOrigin }) =>
    sameOrigin && ["style", "script", "worker", "font"].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: STATIC_ASSETS_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 7,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(
  ({ request, sameOrigin }) => sameOrigin && request.destination === "image",
  new CacheFirst({
    cacheName: STATIC_MEDIA_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(
  ({ url, request, sameOrigin }) => {
    if (request.method !== "GET") {
      return false;
    }

    if (url.hostname === "data-asg.goldprice.org") {
      return true;
    }

    if (sameOrigin && url.pathname.startsWith("/api/trpc")) {
      return url.search.includes("gold.getCurrentPrice") || url.pathname.includes("gold.getCurrentPrice");
    }

    return false;
  },
  new StaleWhileRevalidate({
    cacheName: PRICE_DATA_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 5,
        purgeOnQuotaError: true,
      }),
    ],
  }),
  "GET",
);

type BroadcastType = "NOTIFICATION_RECEIVED" | "NOTIFICATION_CLICKED" | "NOTIFICATION_CLOSED";

interface BroadcastPayload {
  title: string;
  body: string;
  tag: string;
  data: NotificationOptions["data"];
  receivedAt: number;
}

const broadcastChannel = "BroadcastChannel" in self ? new BroadcastChannel(BROADCAST_CHANNEL_NAME) : null;

async function broadcastNotification(type: BroadcastType, payload: BroadcastPayload): Promise<void> {
  const message = { type, payload } as const;

  if (broadcastChannel) {
    broadcastChannel.postMessage(message);
  }

  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage(message);
  }
}

function normalisePushEvent(event: PushEvent): NormalizedNotificationPayload {
  if (!event.data) {
    return parseNotificationPayload(undefined);
  }

  try {
    return parseNotificationPayload(event.data.json());
  } catch {
    try {
      return parseNotificationPayload(event.data.text());
    } catch {
      return parseNotificationPayload(undefined);
    }
  }
}

function withDefaults(payload: NormalizedNotificationPayload, receivedAt: number): NormalizedNotificationPayload {
  const options = {
    ...payload.options,
    icon: payload.options.icon || DEFAULT_NOTIFICATION_ICON,
    badge: payload.options.badge || DEFAULT_NOTIFICATION_BADGE,
    data: {
      ...payload.options.data,
      receivedAt,
    },
  };

  if (!options.data.url) {
    options.data.url = DEFAULT_NOTIFICATION_URL;
  }

  return {
    ...payload,
    options,
  };
}

async function callNotificationsProcedure(path: string, payload: unknown): Promise<void> {
  try {
    await fetch(`/api/trpc/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 0: { json: payload } }),
      credentials: "include",
    });
  } catch (error) {
    console.error(`[PWA] Failed to call ${path}`, error);
  }
}

async function syncSubscription(subscription: PushSubscription): Promise<void> {
  const normalized = normalizePushSubscriptionJSON(subscription.toJSON());

  if (!normalized) {
    console.warn("[PWA] Unable to serialise push subscription");
    return;
  }

  await callNotificationsProcedure("notifications.subscribe", {
    subscription: normalized,
    metadata: {
      source: "service-worker",
      userAgent: self.navigator.userAgent,
      language: self.navigator.language,
      platform: self.navigator.platform,
    },
  });
}

async function removeSubscription(endpoint: string | null | undefined): Promise<void> {
  if (!endpoint) {
    return;
  }

  await callNotificationsProcedure("notifications.unsubscribe", { endpoint });
}

self.addEventListener("push", (event) => {
  const receivedAt = Date.now();

  event.waitUntil(
    (async () => {
      const parsed = withDefaults(normalisePushEvent(event), receivedAt);

      await self.registration.showNotification(parsed.title, parsed.options);

      await broadcastNotification("NOTIFICATION_RECEIVED", {
        title: parsed.title,
        body: parsed.options.body,
        tag: parsed.options.tag,
        data: parsed.options.data,
        receivedAt,
      });
    })(),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  if (!VAPID_PUBLIC_KEY) {
    console.warn("[PWA] pushsubscriptionchange triggered but no VAPID public key is configured");
    return;
  }

  event.waitUntil(
    (async () => {
      try {
        const applicationServerKey = base64UrlToUint8Array(VAPID_PUBLIC_KEY);

        if (!applicationServerKey.length) {
          console.warn("[PWA] pushsubscriptionchange aborted due to invalid VAPID public key");
          return;
        }

        const subscription =
          event.newSubscription ??
          (await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          }));

        await syncSubscription(subscription);

        const oldEndpoint = event.oldSubscription?.endpoint;
        if (oldEndpoint && oldEndpoint !== subscription.endpoint) {
          await removeSubscription(oldEndpoint);
        }
      } catch (error) {
        console.error("[PWA] Failed to resubscribe after pushsubscriptionchange", error);
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationData = (event.notification.data || {}) as Record<string, unknown>;
  const targetUrl = typeof notificationData.url === "string" && notificationData.url ? notificationData.url : DEFAULT_NOTIFICATION_URL;

  event.waitUntil(
    (async () => {
      const absoluteUrl = new URL(targetUrl, self.location.origin).toString();
      const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const matchingClient = windowClients.find((client) => client.url === absoluteUrl);

      if (matchingClient) {
        await matchingClient.focus();
      } else {
        await self.clients.openWindow(absoluteUrl);
      }

      await broadcastNotification("NOTIFICATION_CLICKED", {
        title: event.notification.title ?? "",
        body: event.notification.body ?? "",
        tag: event.notification.tag ?? "",
        data: event.notification.data,
        receivedAt: Date.now(),
      });
    })(),
  );
});

self.addEventListener("notificationclose", (event) => {
  const notification = event.notification;

  event.waitUntil(
    broadcastNotification("NOTIFICATION_CLOSED", {
      title: notification.title ?? "",
      body: notification.body ?? "",
      tag: notification.tag ?? "",
      data: notification.data,
      receivedAt: Date.now(),
    }),
  );
});
