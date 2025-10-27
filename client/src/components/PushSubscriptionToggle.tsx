import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  PushNotificationError,
  PushNotificationErrorCode,
  PushStatus,
} from "@/hooks/usePushNotifications";
import { base64UrlToUint8Array, serializePushSubscription } from "@/lib/pwa/pushSubscription";
import {
  evaluatePushSupport,
  type PushSupportDetails,
  type PushUnsupportedReason,
} from "@/lib/pwa/pushSupport";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface PushSubscriptionToggleProps {
  className?: string;
}

const SERVICE_WORKER_READY_TIMEOUT_MS = 2500;

const unsupportedReasonKey: Record<PushUnsupportedReason, string> = {
  "no-notification-api": "push.unsupportedReason.noNotification",
  "no-service-worker": "push.unsupportedReason.noServiceWorker",
  "no-push-manager": "push.unsupportedReason.noPushManager",
  "not-standalone": "push.unsupportedReason.notStandalone",
};

function mapPermissionState(state: PermissionState | NotificationPermission): NotificationPermission {
  if (state === "prompt") {
    return "default";
  }

  return state as NotificationPermission;
}

function createPushError(code: PushNotificationErrorCode, message?: string): PushNotificationError {
  const error = new Error(message ?? code) as PushNotificationError;
  error.code = code;
  return error;
}

function mapErrorCodeToStatus(code: PushNotificationErrorCode): PushStatus | null {
  switch (code) {
    case "permission-denied":
    case "permission-dismissed":
      return "denied";
    case "missing-config":
    case "invalid-public-key":
      return "missing-config";
    case "unsupported":
    case "service-worker-unavailable":
      return "unsupported";
    default:
      return null;
  }
}

function showErrorToast(code: PushNotificationErrorCode, message: string) {
  switch (code) {
    case "permission-denied":
    case "permission-dismissed":
      toast.warning(message);
      break;
    case "unsupported":
      toast.info(message);
      break;
    default:
      toast.error(message);
      break;
  }
}

async function getServiceWorkerRegistrationWithTimeout(
  timeoutMs = SERVICE_WORKER_READY_TIMEOUT_MS,
): Promise<ServiceWorkerRegistration> {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) {
    throw createPushError("service-worker-unavailable", "Service worker API is unavailable");
  }

  let timeoutId: number | undefined;

  const timeoutPromise = new Promise<undefined>((resolve) => {
    timeoutId = window.setTimeout(() => resolve(undefined), timeoutMs);
  });

  let registration: ServiceWorkerRegistration | undefined;
  try {
    registration = await Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
  } catch {
    registration = undefined;
  } finally {
    if (typeof timeoutId === "number") {
      window.clearTimeout(timeoutId);
    }
  }

  if (registration) {
    return registration;
  }

  try {
    const fallback = await navigator.serviceWorker.getRegistration();
    if (fallback) {
      return fallback;
    }
  } catch (error) {
    console.error("[Push] Failed to obtain service worker registration", error);
  }

  throw createPushError("service-worker-unavailable", "No service worker registration available");
}

function resolveErrorMessageKey(
  error: PushNotificationError,
  supportReason?: PushUnsupportedReason,
): string {
  switch (error.code) {
    case "permission-denied":
    case "permission-dismissed":
      return "push.toast.permissionDenied";
    case "missing-config":
    case "invalid-public-key":
      return "push.unsupportedReason.missingConfig";
    case "unsupported":
      if (supportReason) {
        return unsupportedReasonKey[supportReason];
      }
      return "push.unsupported";
    default:
      return "push.toast.error";
  }
}

function resolveTooltipKey(status: PushStatus, supportReason?: PushUnsupportedReason): string {
  switch (status) {
    case "enabled":
      return "push.tooltip.enabled";
    case "disabled":
      return "push.tooltip.disabled";
    case "loading":
      return "push.loading";
    case "denied":
      return "push.unsupportedReason.permissionDenied";
    case "missing-config":
      return "push.unsupportedReason.missingConfig";
    case "unsupported":
      if (supportReason) {
        return unsupportedReasonKey[supportReason];
      }
      return "push.unsupported";
    default:
      return "push.unsupported";
  }
}

export function PushSubscriptionToggle({ className }: PushSubscriptionToggleProps) {
  const { t } = useTranslation();

  const statusToastRef = useRef<string | null>(null);
  const lastErrorCodeRef = useRef<string | null>(null);
  const lastEndpointRef = useRef<string | null>(null);

  const fallbackPublicKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "").trim();

  const {
    data: serverPublicKeyData,
    refetch: refetchPublicKey,
    isFetching: isPublicKeyFetching,
  } = trpc.notifications.getPublicKey.useQuery(undefined, {
    staleTime: Infinity,
    retry: false,
    enabled: false,
  });

  const subscribeMutation = trpc.notifications.subscribe.useMutation();
  const unsubscribeMutation = trpc.notifications.unsubscribe.useMutation();

  const [support, setSupport] = useState<PushSupportDetails | null>(() =>
    typeof window !== "undefined" ? evaluatePushSupport() : null,
  );
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification === "undefined") {
      return "default";
    }

    return Notification.permission;
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [publicKey, setPublicKey] = useState<string>(() => {
    const initial = (serverPublicKeyData?.publicKey ?? fallbackPublicKey).trim();
    return initial;
  });
  const [hasAttemptedPublicKey, setHasAttemptedPublicKey] = useState(() => Boolean(publicKey));

  const publicKeyRef = useRef(publicKey);
  useEffect(() => {
    publicKeyRef.current = publicKey;
  }, [publicKey]);

  useEffect(() => {
    const next = (serverPublicKeyData?.publicKey ?? "").trim();
    if (!next || next === publicKeyRef.current) {
      return;
    }

    publicKeyRef.current = next;
    setPublicKey(next);
    setHasAttemptedPublicKey(true);
  }, [serverPublicKeyData]);

  useEffect(() => {
    setSupport(evaluatePushSupport());
  }, []);

  useEffect(() => {
    if (typeof Notification === "undefined" || typeof navigator === "undefined") {
      return;
    }

    setPermission(Notification.permission);

    if (typeof navigator.permissions === "undefined") {
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
        // Some browsers may not support querying notification permissions; ignore.
      });

    return () => {
      cancelled = true;
      if (permissionStatus && changeHandler) {
        permissionStatus.removeEventListener("change", changeHandler);
      }
    };
  }, []);

  useEffect(() => {
    if (!support?.supported || typeof navigator === "undefined" || !navigator.serviceWorker) {
      setIsSubscribed(false);
      lastEndpointRef.current = null;
      return;
    }

    let cancelled = false;

    const refreshSubscription = async () => {
      try {
        const registration = await getServiceWorkerRegistrationWithTimeout();
        if (cancelled) {
          return;
        }

        const subscription = await registration.pushManager.getSubscription();
        if (cancelled) {
          return;
        }

        const normalized = serializePushSubscription(subscription);
        setIsSubscribed(Boolean(normalized));
        lastEndpointRef.current = normalized?.endpoint ?? null;
      } catch (error) {
        console.error("[Push] Failed to inspect existing subscription", error);
        if (!cancelled) {
          setIsSubscribed(false);
          lastEndpointRef.current = null;
        }
      }
    };

    void refreshSubscription();

    return () => {
      cancelled = true;
    };
  }, [support?.supported]);

  const ensurePublicKey = useCallback(async () => {
    const cached = (publicKeyRef.current ?? "").trim();
    if (cached) {
      return cached;
    }

    setHasAttemptedPublicKey(true);

    const result = await refetchPublicKey();
    const next = (result.data?.publicKey ?? "").trim();

    if (next) {
      publicKeyRef.current = next;
      setPublicKey(next);
      return next;
    }

    const fallback = fallbackPublicKey.trim();
    if (fallback) {
      publicKeyRef.current = fallback;
      setPublicKey(fallback);
      return fallback;
    }

    const refetchError = result.error;
    if (refetchError instanceof Error) {
      throw createPushError("missing-config", refetchError.message);
    }

    throw createPushError("missing-config");
  }, [fallbackPublicKey, refetchPublicKey]);

  const supportReason = support?.reason;
  const isConfigMissing = hasAttemptedPublicKey && publicKey.trim().length === 0;

  const status: PushStatus = useMemo(() => {
    if (isConfigMissing) {
      return "missing-config";
    }

    if (support && !support.supported) {
      return "unsupported";
    }

    if (permission === "denied") {
      return "denied";
    }

    return isSubscribed ? "enabled" : "disabled";
  }, [isConfigMissing, permission, support, isSubscribed]);

  const tooltipKey = resolveTooltipKey(status, supportReason);

  const isActionable = status === "enabled" || status === "disabled";
  const isBusy =
    isProcessing ||
    isPublicKeyFetching ||
    subscribeMutation.isPending ||
    unsubscribeMutation.isPending;
  const isInteractive = isActionable && !isBusy;

  const label = isSubscribed ? t("push.disableLabel") : t("push.enableLabel");

  const Icon = useMemo(() => {
    if (isBusy) {
      return Loader2;
    }

    return isSubscribed ? BellRing : BellOff;
  }, [isBusy, isSubscribed]);

  const handleSubscribe = useCallback(async () => {
    if (isBusy) {
      return;
    }

    if (support && !support.supported) {
      const key = supportReason ? unsupportedReasonKey[supportReason] : "push.unsupported";
      const message = t(key);
      toast.info(message);
      statusToastRef.current = "unsupported";
      lastErrorCodeRef.current = "unsupported";
      return;
    }

    if (permission === "denied") {
      const message = t("push.toast.permissionDenied");
      toast.warning(message);
      statusToastRef.current = "denied";
      lastErrorCodeRef.current = "permission-denied";
      return;
    }

    setIsProcessing(true);
    lastErrorCodeRef.current = null;

    try {
      if (typeof Notification === "undefined") {
        throw createPushError("unsupported");
      }

      let currentPermission = Notification.permission;
      setPermission(currentPermission);

      if (currentPermission === "denied") {
        throw createPushError("permission-denied");
      }

      if (currentPermission === "default") {
        currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);

        if (currentPermission === "denied") {
          throw createPushError("permission-denied");
        }

        if (currentPermission !== "granted") {
          throw createPushError("permission-dismissed");
        }
      }

      const vapidKey = await ensurePublicKey();
      if (!vapidKey) {
        throw createPushError("missing-config");
      }

      const registration = await getServiceWorkerRegistrationWithTimeout();
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const applicationServerKey = base64UrlToUint8Array(vapidKey);

        if (!applicationServerKey.length) {
          throw createPushError("invalid-public-key");
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      const normalized = serializePushSubscription(subscription);

      if (!normalized) {
        throw createPushError("serialization-failed");
      }

      try {
        await subscribeMutation.mutateAsync({
          subscription: normalized,
          metadata: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
          },
        });
      } catch (mutationError) {
        const message = mutationError instanceof Error ? mutationError.message : undefined;
        throw createPushError("subscription-failed", message);
      }

      setIsSubscribed(true);
      lastEndpointRef.current = normalized.endpoint;
      lastErrorCodeRef.current = null;
      statusToastRef.current = null;
      toast.success(t("push.toast.enabled"));
    } catch (err) {
      const pushError = err as PushNotificationError | undefined;
      if (pushError?.code) {
        const messageKey = resolveErrorMessageKey(pushError, supportReason);
        const translated = t(messageKey);
        showErrorToast(pushError.code, translated);
        lastErrorCodeRef.current = pushError.code;
        const derivedStatus = mapErrorCodeToStatus(pushError.code);
        if (derivedStatus) {
          statusToastRef.current = derivedStatus;
        }
      } else {
        if (lastErrorCodeRef.current !== "subscription-failed") {
          toast.error(t("push.toast.error"));
          lastErrorCodeRef.current = "subscription-failed";
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    ensurePublicKey,
    isBusy,
    permission,
    subscribeMutation,
    support,
    supportReason,
    t,
  ]);

  const handleUnsubscribe = useCallback(async () => {
    if (isBusy || !isSubscribed) {
      return;
    }

    if (support && !support.supported) {
      const key = supportReason ? unsupportedReasonKey[supportReason] : "push.unsupported";
      const message = t(key);
      toast.info(message);
      statusToastRef.current = "unsupported";
      lastErrorCodeRef.current = "unsupported";
      return;
    }

    setIsProcessing(true);
    lastErrorCodeRef.current = null;

    try {
      const registration = await getServiceWorkerRegistrationWithTimeout();
      const existing = await registration.pushManager.getSubscription();
      const endpoint = existing?.endpoint ?? lastEndpointRef.current ?? undefined;

      if (existing) {
        await existing.unsubscribe();
      }

      if (endpoint) {
        try {
          await unsubscribeMutation.mutateAsync({ endpoint });
        } catch (mutationError) {
          const message = mutationError instanceof Error ? mutationError.message : undefined;
          throw createPushError("unsubscription-failed", message);
        }
      }

      setIsSubscribed(false);
      lastEndpointRef.current = null;
      lastErrorCodeRef.current = null;
      statusToastRef.current = null;
      toast.success(t("push.toast.disabled"));
    } catch (err) {
      const pushError = err as PushNotificationError | undefined;
      if (pushError?.code) {
        const messageKey = resolveErrorMessageKey(pushError, supportReason);
        const translated = t(messageKey);
        showErrorToast(pushError.code, translated);
        lastErrorCodeRef.current = pushError.code;
        const derivedStatus = mapErrorCodeToStatus(pushError.code);
        if (derivedStatus) {
          statusToastRef.current = derivedStatus;
        }
      } else {
        if (lastErrorCodeRef.current !== "unsubscription-failed") {
          toast.error(t("push.toast.error"));
          lastErrorCodeRef.current = "unsubscription-failed";
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    isBusy,
    isSubscribed,
    support,
    supportReason,
    t,
    unsubscribeMutation,
  ]);

  const handleToggle = useCallback(async () => {
    if (!isActionable || isBusy) {
      return;
    }

    if (isSubscribed) {
      await handleUnsubscribe();
    } else {
      await handleSubscribe();
    }
  }, [handleSubscribe, handleUnsubscribe, isActionable, isBusy, isSubscribed]);

  useEffect(() => {
    if (status === "missing-config" && statusToastRef.current !== status && hasAttemptedPublicKey) {
      toast.error(t("push.unsupportedReason.missingConfig"));
      statusToastRef.current = status;
      return;
    }

    if (status === "unsupported" && statusToastRef.current !== status && support) {
      const key = supportReason ? unsupportedReasonKey[supportReason] : "push.unsupported";
      toast.info(t(key));
      statusToastRef.current = status;
      return;
    }

    if (status === "denied" && statusToastRef.current !== status) {
      toast.warning(t("push.toast.permissionDenied"));
      statusToastRef.current = status;
      return;
    }

    if (statusToastRef.current && statusToastRef.current !== status) {
      statusToastRef.current = null;
    }
  }, [hasAttemptedPublicKey, status, support, supportReason, t]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={isSubscribed ? "default" : "outline"}
          size="sm"
          onClick={() => {
            void handleToggle();
          }}
          aria-pressed={isSubscribed}
          aria-label={label}
          disabled={!isInteractive}
          className={cn(
            "h-9 rounded-full px-3",
            isSubscribed
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              : "border-border/70 bg-card/70 hover:bg-accent/60 hover:text-foreground",
            isBusy && "pointer-events-none opacity-70",
            className,
          )}
        >
          <Icon className={cn("size-4", isBusy && "animate-spin")} />
          <span className="sr-only">{label}</span>
          <span className="hidden sm:inline sm:ml-1.5">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{t(tooltipKey)}</TooltipContent>
    </Tooltip>
  );
}
