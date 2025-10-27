import { useCallback, useEffect, useMemo, useRef } from "react";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  usePushNotifications,
  type PushNotificationError,
  type PushStatus,
} from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";
import type { PushUnsupportedReason } from "@/lib/pwa/pushSupport";

interface PushSubscriptionToggleProps {
  className?: string;
}

const unsupportedReasonKey: Record<PushUnsupportedReason, string> = {
  "no-notification-api": "push.unsupportedReason.noNotification",
  "no-service-worker": "push.unsupportedReason.noServiceWorker",
  "no-push-manager": "push.unsupportedReason.noPushManager",
  "not-standalone": "push.unsupportedReason.notStandalone",
};

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

function resolveTooltipKey(
  status: PushStatus,
  supportReason?: PushUnsupportedReason,
): string {
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
  const {
    status,
    supportReason,
    isBusy,
    subscribe,
    unsubscribe,
    error,
  } = usePushNotifications();

  const statusToastRef = useRef<string | null>(null);
  const lastErrorCodeRef = useRef<string | null>(null);

  const isEnabled = status === "enabled";
  const isLoading = status === "loading" || isBusy;
  const isActionable = status === "enabled" || status === "disabled";
  const isInteractive = isActionable && !isBusy;

  const label = isEnabled ? t("push.disableLabel") : t("push.enableLabel");
  const tooltipKey = resolveTooltipKey(status, supportReason);

  useEffect(() => {
    if (status === "missing-config" && statusToastRef.current !== status) {
      toast.error(t("push.unsupportedReason.missingConfig"));
      statusToastRef.current = status;
      return;
    }

    if (status === "unsupported" && statusToastRef.current !== status) {
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

    if (status !== statusToastRef.current) {
      statusToastRef.current = null;
    }
  }, [status, supportReason, t]);

  useEffect(() => {
    if (!error) {
      lastErrorCodeRef.current = null;
      return;
    }

    if (error.code === lastErrorCodeRef.current) {
      return;
    }

    if (
      (error.code === "missing-config" && status === "missing-config") ||
      (error.code === "permission-denied" && status === "denied") ||
      (error.code === "unsupported" && status === "unsupported")
    ) {
      lastErrorCodeRef.current = error.code;
      return;
    }

    const key = resolveErrorMessageKey(error, supportReason);
    toast.error(t(key));
    lastErrorCodeRef.current = error.code;
  }, [error, status, supportReason, t]);

  const handleToggle = useCallback(async () => {
    if (!isActionable || isLoading) {
      return;
    }

    try {
      if (isEnabled) {
        await unsubscribe();
        toast.success(t("push.toast.disabled"));
      } else {
        await subscribe();
        toast.success(t("push.toast.enabled"));
      }
      lastErrorCodeRef.current = null;
    } catch (err) {
      const pushError = err as PushNotificationError | undefined;
      if (pushError?.code) {
        const key = resolveErrorMessageKey(pushError, supportReason);
        toast.error(t(key));
        lastErrorCodeRef.current = pushError.code;
      } else {
        toast.error(t("push.toast.error"));
        lastErrorCodeRef.current = "subscription-failed";
      }
    }
  }, [isActionable, isEnabled, isLoading, subscribe, supportReason, t, unsubscribe]);

  const Icon = useMemo(() => {
    if (isLoading) {
      return Loader2;
    }

    return isEnabled ? BellRing : BellOff;
  }, [isEnabled, isLoading]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={isEnabled ? "default" : "outline"}
          size="sm"
          onClick={handleToggle}
          aria-pressed={isEnabled}
          aria-label={label}
          disabled={!isInteractive}
          className={cn(
            "h-9 rounded-full px-3",
            isEnabled
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              : "border-border/70 bg-card/70 hover:bg-accent/60 hover:text-foreground",
            isLoading && "pointer-events-none opacity-70",
            className,
          )}
        >
          <Icon className={cn("size-4", isLoading && "animate-spin")} />
          <span className="sr-only">{label}</span>
          <span className="hidden sm:inline sm:ml-1.5">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{t(tooltipKey)}</TooltipContent>
    </Tooltip>
  );
}
