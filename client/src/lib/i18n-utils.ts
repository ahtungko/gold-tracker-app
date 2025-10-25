import i18n from "@/i18n";

export function getResolvedLocale(language?: string): string {
  const raw = (language || i18n.resolvedLanguage || i18n.language || "en").toLowerCase();

  if (raw.startsWith("zh")) {
    return "zh-CN";
  }

  if (raw.startsWith("en")) {
    return "en-US";
  }

  return language || i18n.resolvedLanguage || i18n.language || "en";
}

function toDate(value: Date | number | string): Date | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  if (typeof value === "string" && value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  return null;
}

export function formatDate(
  value: Date | number | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(value);

  if (!date) {
    return "—";
  }

  const formatter = new Intl.DateTimeFormat(
    getResolvedLocale(),
    options ?? {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  );

  return formatter.format(date);
}

export function formatTime(
  value: Date | number | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(value);

  if (!date) {
    return "—";
  }

  const formatter = new Intl.DateTimeFormat(
    getResolvedLocale(),
    options ?? {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );

  return formatter.format(date);
}
