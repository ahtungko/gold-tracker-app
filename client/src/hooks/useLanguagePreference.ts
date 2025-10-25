import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const SUPPORTED_LANGUAGES = ["en", "zh"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = "i18nextLng";

const isSupportedLanguage = (value: string): value is SupportedLanguage => {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
};

const toSupportedLanguage = (value?: string | null): SupportedLanguage | null => {
  if (!value) {
    return null;
  }

  const base = value.split("-")[0];

  return isSupportedLanguage(base) ? base : null;
};

const persistLanguage = (language: SupportedLanguage) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};

export function useLanguagePreference() {
  const { i18n } = useTranslation();
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>(() => {
    return toSupportedLanguage(i18n.resolvedLanguage ?? i18n.language) ?? "en";
  });

  const changeLanguage = useCallback(
    async (languageCode: SupportedLanguage) => {
      if (languageCode === activeLanguage) {
        return;
      }

      setActiveLanguage(languageCode);
      persistLanguage(languageCode);
      await i18n.changeLanguage(languageCode);
    },
    [activeLanguage, i18n],
  );

  useEffect(() => {
    const handleLanguageChanged = (language: string) => {
      const normalized = toSupportedLanguage(language);

      if (!normalized) {
        return;
      }

      setActiveLanguage(normalized);
      persistLanguage(normalized);
    };

    i18n.on("languageChanged", handleLanguageChanged);

    if (typeof window !== "undefined") {
      const storedLanguage = toSupportedLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));

      if (storedLanguage && storedLanguage !== activeLanguage) {
        void changeLanguage(storedLanguage);
      } else if (!storedLanguage) {
        persistLanguage(activeLanguage);
      }
    }

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [activeLanguage, changeLanguage, i18n]);

  return {
    activeLanguage,
    changeLanguage,
  } as const;
}
