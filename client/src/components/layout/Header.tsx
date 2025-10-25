import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/navigation";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
];

export function Header() {
  const [location] = useLocation();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  const currentLanguage =
    LANGUAGES.find((language) => language.code === i18n.language) ??
    LANGUAGES[0];

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] w-full border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 rounded-full px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl ring-1 ring-border/70 shadow-sm">
            <img
              src={APP_LOGO}
              alt={APP_TITLE}
              className="h-full w-full object-cover"
            />
          </span>
          <span className="text-base font-semibold tracking-tight md:text-lg">
            {APP_TITLE}
          </span>
        </Link>

        <nav
          className="hidden md:flex items-center gap-1 rounded-full border border-border/70 bg-card/70 px-1 py-1 shadow-sm"
          aria-label={t("primaryNavigation")}
        >
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative flex items-center gap-2">
                  <span
                    className={cn(
                      "absolute inset-0 -z-10 rounded-full opacity-0",
                      isActive && "bg-primary/10 opacity-100",
                    )}
                  />
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 rounded-full border border-transparent text-muted-foreground hover:border-border/80 hover:text-foreground"
              >
                <Languages className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {currentLanguage.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {LANGUAGES.map((language) => {
                const isActive = i18n.language === language.code;
                return (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={cn(
                      "flex items-center justify-between gap-2",
                      isActive && "bg-accent/60 text-foreground",
                    )}
                  >
                    <span>{language.label}</span>
                    {isActive ? (
                      <span className="text-xs font-medium text-primary">
                        {t("language")}
                      </span>
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="hidden rounded-full border-border/80 bg-background/80 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-primary md:inline-flex"
            onClick={handleLogin}
          >
            {t("signIn")}
          </Button>
        </div>
      </div>
    </header>
  );
}
