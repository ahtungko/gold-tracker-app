import { Link, useLocation } from "wouter";
import { Home as HomeIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

export function BottomNavigation() {
  const [location] = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: "/", icon: HomeIcon, label: t('prices') },
    { path: "/tracker", icon: TrendingUp, label: t('tracker') },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border shadow-lg md:hidden pb-[calc(env(safe-area-inset-bottom,0px))]"
      aria-label={t('primaryNavigation')}
    >
      <div className="max-w-lg mx-auto flex items-stretch gap-2 px-4 h-14">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            aria-current={location === item.path ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              location === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
