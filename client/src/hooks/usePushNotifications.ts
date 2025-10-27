import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  base64UrlToUint8Array,
  serializePushSubscription,
  type NormalizedPushSubscription,
} from "@/lib/pwa/pushSubscription";
import {
  evaluatePushSupport,
  type PushSupportDetails,
  type PushUnsupportedReason,
} from "@/lib/pwa/pushSupport";

export type PushNotificationErrorCode =
  | "missing-config"
  | "unsupported"
  | "permission-denied"
  | "permission-dismissed"
  | "subscription-failed"
  | "unsubscription-failed"
  | "service-worker-unavailable"
  | "serialization-failed"
  | "invalid-public-key";

export type PushNotificationError = Error & { code: PushNotificationErrorCode };

export type PushStatus =
  | "loading"
  | "enabled"
  | "disabled"
  | "denied"
  | "unsupported"
  | "missing-config";

export interface UsePushNotificationsResult {
  status: PushStatus;
  isSupported: boolean;
  supportReason?: PushUnsupportedReason;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isBusy: boolean;
  publicKey?: string;
  subscribe: () => Promise<NormalizedPushSubscription | null>;
  unsubscribe: () => Promise<void>;
  refresh: () => Promise<void>;
  error: PushNotificationError | null;
}

function createPushError(code: PushNotificationErrorCode, message?: string): PushNotificationError {
  const error = new Error(message ?? code) as PushNotificationError;
  error.code = code;
  return error;
}

function isClient(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function mapPermissionState(state: PermissionState | NotificationPermission): NotificationPermission {
  if (state === "prompt") {
    return "default";
  }

  return state as NotificationPermission;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [{ supported, reason }, setSupport] = useState<PushSupportDetails>({
    supported: false,
  });
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (!isClient() || typeof Notification === "undefined") {
      return "default";
    }

    return Notification.permission;
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [lastError, setLastError] = useState<PushNotificationError | null>(null);
  const subscriptionRef = useRef<NormalizedPushSubscription | null>(null);
  const lastEndpointRef = useRef<string | null>(null);

  const {
    data: publicKeyResponse,
    isLoading: isPublicKeyLoading,
    error: publicKeyError,
  } = trpc.notifications.getPublicKey.useQuery(undefined, {
    staleTime: Infinity,
    retry: false,
  });

  const subscribeMutation = trpc.notifications.subscribe.useMutation();
  const unsubscribeMutation = trpc.notifications.unsubscribe.useMutation();

  const fallbackPublicKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "").trim();
  const serverPublicKey = (publicKeyResponse?.publicKey ?? "").trim();
  const publicKey = serverPublicKey || fallbackPublicKey;
  const hasPublicKey = publicKey.length > 0;

  useEffect(() => {
    if (!isClient()) {
      return;
    }

    setSupport(evaluatePushSupport());
  }, []);

  useEffect(() => {
    if (!isClient() || typeof navigator.permissions === "undefined") {
      return;
    }

    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;
    let changeHandler: (() => void) | null = null;

    const updateState = (state: PermissionState) => {
      if (!cancelled) {
        setPermission(mapPermissionState(state));
      }
    };

    (navigator.permissions as Permissions)
      .query({ name: "notifications" as PermissionName })
      .then((status) => {
        if (cancelled) {
          return;
        }

        permissionStatus = status;
        updateState(status.state);
        changeHandler = () => updateState(status.state);
        status.addEventListener("change", changeHandler);
      })
      .catch(() => {
        // Browser might not support querying notification permissions; ignore.
      });

    return () => {
      cancelled = true;
      if (permissionStatus && changeHandler) {
        permissionStatus.removeEventListener("change", changeHandler);
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!isClient()) {
      return;
    }

    if (!supported || !hasPublicKey) {
      setIsInitializing(false);
      return;
    }

    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }

    setIsInitializing(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const normalized = serializePushSubscription(existing);

      if (normalized) {
        subscriptionRef.current = normalized;
        setIsSubscribed(true);

        if (lastEndpointRef.current !== normalized.endpoint) {
          await subscribeMutation.mutateAsync({
            subscription: normalized,
            metadata: {
              userAgent: navigator.userAgent,
              language: navigator.language,
              platform: navigator.platform,
            },
          });
          lastEndpointRef.current = normalized.endpoint;
        }
      } else {
        subscriptionRef.current = null;
        lastEndpointRef.current = null;
        setIsSubscribed(false);
      }
    } catch (error) {
      const pushError =
        error && typeof (error as PushNotificationError).code === "string"
          ? (error as PushNotificationError)
          : createPushError("service-worker-unavailable", "Unable to access service worker");
      if (!pushError.code) {
        pushError.code = "service-worker-unavailable";
      }
      setLastError(pushError);
    } finally {
      setIsInitializing(false);
    }
  }, [supported, hasPublicKey, subscribeMutation]);

  useEffect(() => {
    if (!isClient()) {
      return;
    }

    if (isPublicKeyLoading) {
      return;
    }

    if (!hasPublicKey && publicKeyError) {
      setLastError(createPushError("missing-config"));
      setIsInitializing(false);
      return;
    }

    void refresh();
  }, [hasPublicKey, isPublicKeyLoading, publicKeyError, refresh]);

  const subscribe = useCallback(async () => {
    if (!isClient()) {
      throw createPushError("unsupported", "Push notifications are only available in the browser");
    }

    if (!supported) {
      throw createPushError("unsupported");
    }

    if (!hasPublicKey) {
      throw createPushError("missing-config");
    }

    setIsBusy(true);
    setLastError(null);

    try {
      if (typeof Notification === "undefined") {
        throw createPushError("unsupported");
      }

      let currentPermission = Notification.permission;

      if (currentPermission === "denied") {
        setPermission("denied");
        throw createPushError("permission-denied");
      }

      if (currentPermission === "default") {
        currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);

        if (currentPermission !== "granted") {
          throw createPushError(
            currentPermission === "denied" ? "permission-denied" : "permission-dismissed",
          );
        }
      }

      const registration = await navigator.serviceWorker.ready;
      let existing = await registration.pushManager.getSubscription();

      if (!existing) {
        const applicationServerKey = base64UrlToUint8Array(publicKey);

        if (!applicationServerKey.length) {
          throw createPushError("invalid-public-key");
        }

        existing = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      const normalized = serializePushSubscription(existing);

      if (!normalized) {
        throw createPushError("serialization-failed");
      }

      await subscribeMutation.mutateAsync({
        subscription: normalized,
        metadata: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
        },
      });

      subscriptionRef.current = normalized;
      lastEndpointRef.current = normalized.endpoint;
      setIsSubscribed(true);
      return normalized;
    } catch (error) {
      const pushError =
        error && typeof (error as PushNotificationError).code === "string"
          ? (error as PushNotificationError)
          : createPushError("subscription-failed");
      if (!pushError.code) {
        pushError.code = "subscription-failed";
      }
      setLastError(pushError);
      throw pushError;
    } finally {
      setIsBusy(false);
    }
  }, [supported, hasPublicKey, publicKey, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    if (!isClient()) {
      throw createPushError("unsupported", "Push notifications are only available in the browser");
    }

    if (!supported) {
      return;
    }

    setIsBusy(true);
    setLastError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const endpoint = existing?.endpoint ?? lastEndpointRef.current;

      if (existing) {
        await existing.unsubscribe();
      }

      if (endpoint) {
        await unsubscribeMutation.mutateAsync({ endpoint });
      }

      subscriptionRef.current = null;
      lastEndpointRef.current = null;
      setIsSubscribed(false);
    } catch (error) {
      const pushError =
        error && typeof (error as PushNotificationError).code === "string"
          ? (error as PushNotificationError)
          : createPushError("unsubscription-failed");
      if (!pushError.code) {
        pushError.code = "unsubscription-failed";
      }
      setLastError(pushError);
      throw pushError;
    } finally {
      setIsBusy(false);
    }
  }, [supported, unsubscribeMutation]);

  const status: PushStatus = useMemo(() => {
    if (isPublicKeyLoading || isInitializing) {
      return "loading";
    }

    if (!hasPublicKey) {
      return "missing-config";
    }

    if (!supported) {
      return "unsupported";
    }

    if (permission === "denied") {
      return "denied";
    }

    return isSubscribed ? "enabled" : "disabled";
  }, [
    hasPublicKey,
    isInitializing,
    isPublicKeyLoading,
    isSubscribed,
    permission,
    supported,
  ]);

  return {
    status,
    isSupported: supported,
    supportReason: reason,
    permission,
    isSubscribed,
    isBusy,
    publicKey: hasPublicKey ? publicKey : undefined,
    subscribe,
    unsubscribe,
    refresh,
    error: lastError,
  };
}
