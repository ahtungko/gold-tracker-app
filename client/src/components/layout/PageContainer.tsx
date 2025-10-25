import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends PropsWithChildren {
  className?: string;
  withBottomGutter?: boolean;
}

export function PageContainer({
  children,
  className,
  withBottomGutter = true,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "container w-full max-w-6xl pt-8 md:pt-12",
        withBottomGutter
          ? "pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]"
          : "pb-[calc(3rem+env(safe-area-inset-bottom,0px))] md:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
