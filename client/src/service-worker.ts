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

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<import("workbox-precaching").PrecacheEntry>;
};

const APP_SHELL_URL = "/index.html";
const STATIC_ASSETS_CACHE = "gold-tracker-static-v1";
const STATIC_MEDIA_CACHE = "gold-tracker-media-v1";
const PRICE_DATA_CACHE = "gold-tracker-prices-v1";
const BROADCAST_CHANNEL_NAME = "gold-tracker-notifications";

clientsClaim();
self.skipWaiting();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const navigationHandler = createHandlerBoundToURL(APP_SHELL_URL);

registerRoute(
  ({ request }) => request.mode === "navigate",
  async ({ event }) => {
    try {
      return await navigationHandler({ event });
    } catch (error) {
      const cached = await matchPrecache(APP_SHELL_URL);
      if (cached) {
        return cached;
      }

      throw error;
    }
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
