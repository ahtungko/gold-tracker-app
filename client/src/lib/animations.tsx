/**
 * Animation Utilities
 *
 * Provides lightweight animation helpers that respect prefers-reduced-motion.
 * Animations rely on CSS transitions so they add no runtime dependencies.
 */

import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  useEffect,
  useState,
} from "react";

import { cn } from "./utils";

const REDUCE_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(REDUCE_MOTION_QUERY).matches;
}

/**
 * Hook to detect if the user prefers reduced motion.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    getPrefersReducedMotion,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(REDUCE_MOTION_QUERY);

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    handleChange();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

export type AnimationVariant = "fade" | "slideUp" | "slideDown" | "scale" | "cardReveal";

interface AnimatedProps extends ComponentPropsWithoutRef<"div"> {
  variant?: AnimationVariant;
  delay?: number;
  disableAnimation?: boolean;
}

type AnimatedCardProps = Omit<AnimatedProps, "variant">;

type MotionState = "idle" | "enter";

type CSSCustomProperties = CSSProperties & {
  "--motion-delay"?: string;
};

const variantClassMap: Record<AnimationVariant, string> = {
  fade: "motion-base motion-fade",
  slideUp: "motion-base motion-slide-up",
  slideDown: "motion-base motion-slide-down",
  scale: "motion-base motion-scale",
  cardReveal: "motion-base motion-card-reveal",
};

/**
 * Generic animated wrapper that respects reduced motion preferences.
 */
export function Animated({
  variant = "fade",
  delay = 0,
  disableAnimation = false,
  className,
  style,
  children,
  ...props
}: AnimatedProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isMounted, setIsMounted] = useState(false);
  const [motionState, setMotionState] = useState<MotionState>("enter");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const shouldAnimate = isMounted && !prefersReducedMotion && !disableAnimation;

  useEffect(() => {
    if (!shouldAnimate) {
      setMotionState("enter");
      return;
    }

    setMotionState("idle");

    const frame = requestAnimationFrame(() => {
      setMotionState("enter");
    });

    return () => cancelAnimationFrame(frame);
  }, [shouldAnimate, variant, delay]);

  const baseStyle = style as CSSCustomProperties | undefined;
  const finalStyle = shouldAnimate && delay > 0
    ? { ...(baseStyle ?? {}), "--motion-delay": `${delay}ms` }
    : baseStyle;

  return (
    <div
      data-motion={motionState}
      className={cn(shouldAnimate ? variantClassMap[variant] : undefined, className)}
      style={finalStyle}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Page transition wrapper.
 */
export function PageTransition({ variant = "slideUp", ...props }: AnimatedProps) {
  return <Animated variant={variant} {...props} />;
}

/**
 * Card with reveal animation.
 */
export function AnimatedCard(props: AnimatedCardProps) {
  return <Animated variant="cardReveal" {...props} />;
}
