import type { CSSProperties } from "react";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "rounded-[var(--radius-md)] border-border bg-popover text-popover-foreground shadow-lg backdrop-blur-sm",
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
          cancelButton: "bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors",
          error: "border-destructive/20 bg-destructive/10 text-destructive",
          success: "border-primary/20 bg-primary/10 text-primary",
          warning: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
          info: "border-ring/20 bg-ring/10",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
