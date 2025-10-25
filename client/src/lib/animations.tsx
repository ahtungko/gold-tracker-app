/**
 * Animation Utilities with Framer Motion
 *
 * Provides reusable animation primitives and hooks that respect prefers-reduced-motion.
 * All animations are designed to be performant and accessible.
 */

import { motion, type MotionProps, type Variants } from "framer-motion";
import { type ComponentProps, useEffect, useState } from "react";
import { duration, easing } from "./design-tokens";

/**
 * Hook to detect if the user prefers reduced motion.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Animation variants for common patterns.
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const cardRevealVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: duration.slow / 1000,
      ease: easing.easeOut as any,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    transition: {
      duration: duration.fast / 1000,
      ease: easing.easeIn as any,
    },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal / 1000,
      ease: easing.easeOut as any,
    },
  },
};

/**
 * Page transition variants.
 */
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal / 1000,
      ease: easing.easeOut as any,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration.fast / 1000,
      ease: easing.easeIn as any,
    },
  },
};

interface AnimatedProps
  extends Omit<ComponentProps<typeof motion.div>, "variants"> {
  variant?: "fade" | "slideUp" | "slideDown" | "scale" | "cardReveal";
  delay?: number;
  disableAnimation?: boolean;
}

const variantMap: Record<NonNullable<AnimatedProps["variant"]>, Variants> = {
  fade: fadeVariants,
  slideUp: slideUpVariants,
  slideDown: slideDownVariants,
  scale: scaleVariants,
  cardReveal: cardRevealVariants,
};

/**
 * Generic animated wrapper that respects reduced motion preferences.
 */
export function Animated({
  variant = "fade",
  delay = 0,
  disableAnimation = false,
  children,
  ...props
}: AnimatedProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = !prefersReducedMotion && !disableAnimation;

  if (!shouldAnimate) {
    return <div {...props}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variantMap[variant]}
      transition={{
        delay,
        duration: duration.normal / 1000,
        ease: easing.easeOut as any,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Card with reveal animation.
 */
export function AnimatedCard({
  delay = 0,
  disableAnimation = false,
  children,
  ...props
}: AnimatedProps) {
  return (
    <Animated
      variant="cardReveal"
      delay={delay}
      disableAnimation={disableAnimation}
      {...props}
    >
      {children}
    </Animated>
  );
}

/**
 * Stagger container for animating lists.
 */
export function StaggerContainer({
  disableAnimation = false,
  children,
  ...props
}: Omit<AnimatedProps, "variant">) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = !prefersReducedMotion && !disableAnimation;

  if (!shouldAnimate) {
    return <div {...props}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainerVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Item in a stagger container.
 */
export function StaggerItem({
  disableAnimation = false,
  children,
  ...props
}: Omit<AnimatedProps, "variant">) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = !prefersReducedMotion && !disableAnimation;

  if (!shouldAnimate) {
    return <div {...props}>{children}</div>;
  }

  return (
    <motion.div variants={staggerItemVariants} {...props}>
      {children}
    </motion.div>
  );
}

/**
 * Page transition wrapper.
 */
export function PageTransition({
  children,
  ...props
}: Omit<ComponentProps<typeof motion.div>, "variants">) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div {...props}>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Interactive hover/press scale animation.
 */
export const interactiveScale: MotionProps = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: {
    duration: duration.fast / 1000,
    ease: easing.easeOut as any,
  },
};

/**
 * Subtle hover lift animation.
 */
export const hoverLift: MotionProps = {
  whileHover: { y: -2 },
  transition: {
    duration: duration.fast / 1000,
    ease: easing.easeOut as any,
  },
};
