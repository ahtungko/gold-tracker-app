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
        withBottomGutter ? "pb-28 md:pb-16" : "pb-8 md:pb-12",
        className,
      )}
    >
      {children}
    </div>
  );
}
