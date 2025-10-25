import { Link, useLocation } from "wouter";
import { LayoutGroup, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { navItems } from "@/config/navigation";
import { usePrefersReducedMotion } from "@/lib/animations";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--z-fixed)] border-t border-border/70 bg-card/95 pb-[calc(env(safe-area-inset-bottom,0px))] backdrop-blur supports-[backdrop-filter]:backdrop-blur print:hidden shadow-[0_-8px_20px_-12px_rgba(15,23,42,0.35)]"
      aria-label={t("primaryNavigation")}
    >
      <LayoutGroup id="bottom-navigation">
        <ul className="mx-auto flex h-16 max-w-lg flex-1 items-stretch gap-1 px-2 py-2" role="list">
          {navItems.map((item) => {
            const isActive = location === item.path;

            return (
              <li key={item.path} className="flex flex-1">
                <Link
                  href={item.path}
                  className={cn(
                    "relative flex flex-1 items-stretch",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <motion.div
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                    transition={prefersReducedMotion ? undefined : { duration: 0.12 }}
                    className={cn(
                      "relative flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-2 text-xs font-medium",
                      "transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {isActive ? (
                      prefersReducedMotion ? (
                        <span className="absolute inset-x-1.5 inset-y-1 -z-10 rounded-2xl bg-primary/12" />
                      ) : (
                        <motion.span
                          layoutId="bottom-navigation-active"
                          className="absolute inset-x-1.5 inset-y-1 -z-10 rounded-2xl bg-primary/12"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )
                    ) : null}

                    <item.icon
                      className={cn("h-5 w-5", isActive && "drop-shadow-sm")}
                      strokeWidth={isActive ? 2.4 : 2}
                      aria-hidden="true"
                    />

                    <span
                      className={cn(
                        "text-[11px] leading-none",
                        isActive && "font-semibold",
                      )}
                    >
                      {t(item.labelKey)}
                    </span>
                  </motion.div>
                </Link>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
    </nav>
  );
}
