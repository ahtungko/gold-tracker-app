import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted/50 dark:bg-muted/30 animate-pulse rounded-[var(--radius-md)]", className)}
      {...props}
    />
  );
}

export { Skeleton };
