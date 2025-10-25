import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ENABLE_AUTH } from "@/config/features";
import { navItems } from "@/config/navigation";
import { APP_TITLE, getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { LogIn, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
];

export function AppActionsMenu() {
  const { t, i18n } = useTranslation();
  const [location, setLocation] = useLocation();

  const currentLanguage =
    LANGUAGES.find((language) => language.code === i18n.language) ??
    LANGUAGES[0];

  const handleNavigate = (path: string) => {
    if (location !== path) {
      setLocation(path);
    }
  };

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-full border-border/70 bg-card/80 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-border hover:text-foreground focus-visible:border-border focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t("openAppMenu")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {APP_TITLE}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("primaryNavigation")}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {navItems.map((item) => (
            <DropdownMenuItem
              key={item.path}
              onSelect={() => handleNavigate(item.path)}
              className={cn("gap-3", location === item.path && "text-primary font-semibold")}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              <span>{t(item.labelKey)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("language")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={currentLanguage.code}
          onValueChange={handleLanguageChange}
        >
          {LANGUAGES.map((language) => (
            <DropdownMenuRadioItem key={language.code} value={language.code}>
              {language.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {ENABLE_AUTH && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogin} className="gap-3">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>{t("signIn")}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
