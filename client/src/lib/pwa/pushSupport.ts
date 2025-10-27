export type PushUnsupportedReason =
  | "no-notification-api"
  | "no-service-worker"
  | "no-push-manager"
  | "not-standalone";

export interface PushSupportDetails {
  supported: boolean;
  reason?: PushUnsupportedReason;
}

export interface EvaluatePushSupportOptions {
  hasNotification?: boolean;
  hasServiceWorker?: boolean;
  hasPushManager?: boolean;
  userAgent?: string;
  standalone?: boolean;
  displayModeStandalone?: boolean;
}

export function isIosDevice(userAgent: string): boolean {
  const normalized = userAgent.toLowerCase();
  return (
    normalized.includes("iphone") ||
    normalized.includes("ipad") ||
    normalized.includes("ipod") ||
    (normalized.includes("macintosh") && normalized.includes("mobile"))
  );
}

function getNavigatorStandalone(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const candidate = (navigator as Navigator & { standalone?: boolean }).standalone;
  return typeof candidate === "boolean" ? candidate : false;
}

function getDisplayModeStandalone(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  try {
    return window.matchMedia("(display-mode: standalone)").matches;
  } catch {
    return false;
  }
}

export function evaluatePushSupport(options: EvaluatePushSupportOptions = {}): PushSupportDetails {
  const hasNotification =
    options.hasNotification ?? (typeof window !== "undefined" && "Notification" in window);

  if (!hasNotification) {
    return { supported: false, reason: "no-notification-api" };
  }

  const hasServiceWorker =
    options.hasServiceWorker ?? (typeof navigator !== "undefined" && "serviceWorker" in navigator);

  if (!hasServiceWorker) {
    return { supported: false, reason: "no-service-worker" };
  }

  const hasPushManager =
    options.hasPushManager ?? (typeof window !== "undefined" && "PushManager" in window);

  if (!hasPushManager) {
    return { supported: false, reason: "no-push-manager" };
  }

  const userAgent = options.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");

  if (userAgent && isIosDevice(userAgent)) {
    const standaloneExplicit = options.standalone;

    if (typeof standaloneExplicit === "boolean") {
      if (!standaloneExplicit) {
        return { supported: false, reason: "not-standalone" };
      }
    } else {
      const displayModeStandalone = options.displayModeStandalone ?? getDisplayModeStandalone();
      const navigatorStandalone = getNavigatorStandalone();

      if (!displayModeStandalone && !navigatorStandalone) {
        return { supported: false, reason: "not-standalone" };
      }
    }
  }

  return { supported: true };
}
