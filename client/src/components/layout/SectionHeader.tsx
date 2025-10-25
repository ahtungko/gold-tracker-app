import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Alignment = "start" | "center" | "between";

interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  align?: Alignment;
  as?: ElementType;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  actionsClassName?: string;
}

const alignmentClasses: Record<Alignment, string> = {
  start: "sm:flex-row sm:items-start sm:gap-6",
  center: "sm:flex-row sm:items-center sm:justify-center sm:gap-6 text-center",
  between: "sm:flex-row sm:items-end sm:justify-between sm:gap-6",
};

export function SectionHeader({
  title,
  description,
  actions,
  align = "between",
  as,
  className,
  titleClassName,
  descriptionClassName,
  actionsClassName,
}: SectionHeaderProps) {
  const Heading = (as || "h1") as ElementType;
  const baseAlignment = alignmentClasses[align];
  const isCentered = align === "center";

  return (
    <div className={cn("flex flex-col gap-4", baseAlignment, className)}>
      <div className={cn("space-y-2", isCentered ? "text-center" : "text-left")}> 
        <Heading
          className={cn(
            "text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
            titleClassName,
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p
            className={cn(
              "text-base text-muted-foreground sm:text-lg",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            isCentered ? "justify-center" : "justify-end",
            actionsClassName,
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
