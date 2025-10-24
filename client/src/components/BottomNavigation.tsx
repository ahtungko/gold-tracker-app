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
    <nav className="fixed inset-x-0 bottom-0 bg-card border-t border-border shadow-lg md:hidden z-50">
      <div className="flex justify-around h-14 items-center max-w-lg mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm font-medium transition-colors",
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
