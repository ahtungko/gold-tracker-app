export const DEFAULT_NOTIFICATION_TITLE = "Gold Tracker";
export const DEFAULT_NOTIFICATION_BODY = "Tap to view the latest precious metal prices.";
export const DEFAULT_NOTIFICATION_URL = "/";
export const DEFAULT_NOTIFICATION_TAG = "gold-tracker-price-update";
export const DEFAULT_NOTIFICATION_ICON = "/notification-icon-192.png";
export const DEFAULT_NOTIFICATION_BADGE = "/notification-badge-256.png";

interface RawNotificationPayload {
  title?: unknown;
  body?: unknown;
  url?: unknown;
  tag?: unknown;
  icon?: unknown;
  badge?: unknown;
  image?: unknown;
  timestamp?: unknown;
  silent?: unknown;
  requireInteraction?: unknown;
  vibrate?: unknown;
  data?: unknown;
  actions?: unknown;
}

interface NotificationActionShape {
  action: string;
  title: string;
  icon?: string;
}

export interface NormalizedNotificationPayload {
  title: string;
  options: NotificationOptions & {
    body: string;
    tag: string;
    icon: string;
    badge: string;
    data: NotificationPayloadData;
  };
}

export interface NotificationPayloadData {
  url: string;
  meta: Record<string, unknown> | null;
  payload: Record<string, unknown>;
  sentAt: number | null;
}

function parseCandidate(candidate: unknown): Record<string, unknown> {
  if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
    return candidate as Record<string, unknown>;
  }

  return {};
}

function parseActions(candidate: unknown): NotificationAction[] | undefined {
  if (!Array.isArray(candidate)) {
    return undefined;
  }

  const normalized: NotificationAction[] = [];

  for (const entry of candidate) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const action = "action" in entry && typeof (entry as Record<string, unknown>).action === "string"
      ? (entry as Record<string, unknown>).action.trim()
      : "";
    const title = "title" in entry && typeof (entry as Record<string, unknown>).title === "string"
      ? (entry as Record<string, unknown>).title.trim()
      : "";

    if (!action || !title) {
      continue;
    }

    const icon = "icon" in entry && typeof (entry as Record<string, unknown>).icon === "string"
      ? (entry as Record<string, unknown>).icon.trim() || undefined
      : undefined;

    normalized.push({ action, title, icon });
  }

  return normalized.length > 0 ? normalized : undefined;
}

function parseVibrate(candidate: unknown): number[] | undefined {
  if (!Array.isArray(candidate)) {
    return undefined;
  }

  const sequence = candidate
    .map((value) => (typeof value === "number" && Number.isFinite(value) ? value : null))
    .filter((value): value is number => value !== null);

  return sequence.length > 0 ? sequence : undefined;
}

function coerceNumber(candidate: unknown): number | undefined {
  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return candidate;
  }

  if (typeof candidate === "string") {
    const parsed = Number.parseFloat(candidate);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function parseRawPayload(input: unknown): RawNotificationPayload {
  if (typeof input === "string") {
    const trimmed = input.trim();

    if (!trimmed) {
      return {};
    }

    try {
      const parsed = JSON.parse(trimmed);
      return parseCandidate(parsed) as RawNotificationPayload;
    } catch {
      return { body: trimmed };
    }
  }

  if (input && typeof input === "object") {
    return parseCandidate(input) as RawNotificationPayload;
  }

  return {};
}

export function parseNotificationPayload(input: unknown): NormalizedNotificationPayload {
  const payload = parseRawPayload(input);

  const titleCandidate = typeof payload.title === "string" ? payload.title.trim() : "";
  const bodyCandidate = typeof payload.body === "string" ? payload.body.trim() : "";
  const urlCandidate = typeof payload.url === "string" ? payload.url.trim() : "";
  const tagCandidate = typeof payload.tag === "string" ? payload.tag.trim() : "";
  const iconCandidate = typeof payload.icon === "string" ? payload.icon.trim() : "";
  const badgeCandidate = typeof payload.badge === "string" ? payload.badge.trim() : "";
  const imageCandidate = typeof payload.image === "string" ? payload.image.trim() : "";

  const timestamp = coerceNumber(payload.timestamp);
  const silent = payload.silent === true;
  const requireInteraction = payload.requireInteraction === true;

  const data = parseCandidate(payload.data);

  const options: NotificationOptions & {
    body: string;
    tag: string;
    icon: string;
    badge: string;
    data: NotificationPayloadData;
  } = {
    body: bodyCandidate || DEFAULT_NOTIFICATION_BODY,
    icon: iconCandidate || DEFAULT_NOTIFICATION_ICON,
    badge: badgeCandidate || DEFAULT_NOTIFICATION_BADGE,
    tag: tagCandidate || DEFAULT_NOTIFICATION_TAG,
    data: {
      url: urlCandidate || DEFAULT_NOTIFICATION_URL,
      meta: Object.keys(data).length > 0 ? data : null,
      payload: parseCandidate(payload),
      sentAt: timestamp ?? null,
    },
    renotify: true,
    silent,
    requireInteraction,
  };

  if (timestamp) {
    options.timestamp = timestamp;
  }

  if (imageCandidate) {
    options.image = imageCandidate;
  }

  const actions = parseActions(payload.actions);
  if (actions) {
    options.actions = actions;
  }

  const vibrate = parseVibrate(payload.vibrate);
  if (vibrate) {
    options.vibrate = vibrate;
  }

  return {
    title: titleCandidate || DEFAULT_NOTIFICATION_TITLE,
    options,
  };
}
