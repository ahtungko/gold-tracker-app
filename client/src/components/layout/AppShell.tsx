import type { PropsWithChildren } from "react";
import { BottomNavigation } from "../BottomNavigation";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { cn } from "@/lib/utils";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <main
        className={cn(
          "relative flex flex-1 flex-col pb-[env(safe-area-inset-bottom,0px)] pt-[calc(env(safe-area-inset-top,0px))]",
        )}
      >
        {children}
      </main>
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[1215] flex justify-center px-4 print:hidden">
        <LanguageSwitcher className="pointer-events-auto" />
      </div>
      <BottomNavigation />
    </div>
  );
}
