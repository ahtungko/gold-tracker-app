import type { PropsWithChildren } from "react";
import { BottomNavigation } from "../BottomNavigation";
import { cn } from "@/lib/utils";
import { AppActionsMenu } from "./AppActionsMenu";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <div className="pointer-events-none fixed right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-[var(--z-fixed)] md:right-6">
        <div className="pointer-events-auto">
          <AppActionsMenu />
        </div>
      </div>
      <main
        className={cn(
          "relative flex flex-1 flex-col pb-[env(safe-area-inset-bottom,0px)] pt-[calc(env(safe-area-inset-top,0px))]",
        )}
      >
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
