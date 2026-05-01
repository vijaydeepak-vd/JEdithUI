import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  /** Trigger once and stay visible (default: true) */
  once?: boolean;
  /** IntersectionObserver threshold 0–1 (default: 0.15) */
  threshold?: number;
  /** Root margin (default: "0px 0px -60px 0px") */
  rootMargin?: string;
}

/**
 * Lightweight Intersection Observer hook for scroll-triggered animations.
 * Returns a ref to attach to the element and a boolean `isInView`.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): [React.RefObject<T | null>, boolean] {
  const { once = true, threshold = 0.15, rootMargin = "0px 0px -60px 0px" } = options;
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return [ref, isInView];
}
