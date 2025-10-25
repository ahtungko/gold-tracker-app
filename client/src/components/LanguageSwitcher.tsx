import { Button } from "@/components/ui/button";
import { useLanguagePreference, type SupportedLanguage } from "@/hooks/useLanguagePreference";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const LANGUAGE_OPTIONS: Array<{
  code: SupportedLanguage;
  displayLabel: string;
  nameKey: string;
}> = [
  { code: "en", displayLabel: "EN", nameKey: "languageEnglishName" },
  { code: "zh", displayLabel: "中文", nameKey: "languageChineseName" },
];

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const { activeLanguage, changeLanguage } = useLanguagePreference();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/95 p-1 shadow-lg backdrop-blur-sm",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/60 focus-within:ring-offset-2 focus-within:ring-offset-background",
        className,
      )}
      role="group"
      aria-label={t("language")}
    >
      {LANGUAGE_OPTIONS.map((option) => {
        const isActive = activeLanguage === option.code;
        const languageName = t(option.nameKey);
        const ariaLabel = isActive
          ? t("languageCurrent", { language: languageName })
          : t("languageSwitchTo", { language: languageName });

        return (
          <Button
            key={option.code}
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={isActive}
            aria-label={ariaLabel}
            onClick={() => {
              void changeLanguage(option.code);
            }}
            className={cn(
              "h-9 min-w-[3.25rem] rounded-full px-3 text-xs font-semibold uppercase",
              option.code === "en" ? "tracking-[0.28em]" : "tracking-normal",
              "transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <span aria-hidden="true">{option.displayLabel}</span>
          </Button>
        );
      })}
    </div>
  );
}
