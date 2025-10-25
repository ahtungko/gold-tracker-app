import type { PropsWithChildren } from "react";
import { Header } from "./Header";
import { BottomNavigation } from "../BottomNavigation";
import { useIsMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";

export function AppShell({ children }: PropsWithChildren) {
  const isMobile = useIsMobile();

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className={cn("relative flex flex-1 flex-col", isMobile && "pb-24")}>{children}</main>
      {isMobile && <BottomNavigation />}
    </div>
  );
}
