import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", labelKey: "languageEnglishShort", ariaKey: "languageEnglish" },
  { code: "zh", labelKey: "languageChineseShort", ariaKey: "languageChinese" },
] as const;

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const activeLanguage = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];

  const handleLanguageChange = (languageCode: string) => {
    if (languageCode === activeLanguage) {
      return;
    }

    void i18n.changeLanguage(languageCode);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-2 py-1 shadow-sm",
        className,
      )}
      role="group"
      aria-label={t("language")}
    >
      <span className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
        {t("language")}
      </span>
      {LANGUAGES.map((language) => {
        const isActive = activeLanguage === language.code;

        return (
          <Button
            key={language.code}
            type="button"
            variant="ghost"
            size="sm"
            data-lang={language.code}
            aria-pressed={isActive}
            aria-label={t("languageSwitchAria", {
              language: t(language.ariaKey),
            })}
            onClick={() => handleLanguageChange(language.code)}
            className={cn(
              "h-9 rounded-full px-4 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            {t(language.labelKey)}
          </Button>
        );
      })}
    </div>
  );
}
