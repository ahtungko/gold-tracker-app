/**
 * Design Tokens
 *
 * Centralized design system tokens for consistent styling across the application.
 * These tokens ensure visual coherence and maintainability.
 */

/**
 * Spacing scale aligned with Tailwind's spacing system.
 */
export const spacing = {
  none: "0",
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
} as const;

/**
 * Border radius scale aligned with CSS variables.
 */
export const radius = {
  sm: "rounded-[var(--radius-sm)]",
  md: "rounded-[var(--radius-md)]",
  lg: "rounded-[var(--radius-lg)]",
  xl: "rounded-[var(--radius-xl)]",
  full: "rounded-full",
} as const;

/**
 * Icon sizes for consistent scaling.
 */
export const iconSize = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-8",
} as const;

/**
 * Animation durations in milliseconds.
 */
export const duration = {
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

/**
 * Animation easing functions.
 */
export const easing = {
  default: [0.4, 0.0, 0.2, 1],
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0.0, 1, 1],
  easeOut: [0.0, 0.0, 0.2, 1],
  easeInOut: [0.4, 0.0, 0.2, 1],
  spring: { type: "spring", stiffness: 300, damping: 30 },
  gentle: { type: "spring", stiffness: 120, damping: 20 },
} as const;

/**
 * Focus ring styles for accessibility.
 */
export const focusRing = {
  base: "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  error:
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  full:
    "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
} as const;

/**
 * Shadow scale aligned with Tailwind.
 */
export const shadow = {
  xs: "shadow-xs",
  sm: "shadow-sm",
  md: "shadow",
  lg: "shadow-lg",
  xl: "shadow-xl",
} as const;

/**
 * Transition classes for common transitions.
 */
export const transition = {
  default: "transition-all duration-200 ease-out",
  colors: "transition-colors duration-200 ease-out",
  opacity: "transition-opacity duration-200 ease-out",
  transform: "transition-transform duration-200 ease-out",
  shadow: "transition-shadow duration-200 ease-out",
} as const;

/**
 * Z-index scale for consistent layering.
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
} as const;
