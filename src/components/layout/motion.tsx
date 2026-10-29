"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function MotionEnhancements() {
  const pathname = usePathname();
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const selector =
      "main .section, main .feature-card, main .community-banner";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !preference.matches) {
            entry.target.classList.add("section-enter");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -24px 0px" },
    );
    const observe = () => {
      observer.disconnect();
      if (preference.matches) return;
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        if (element.classList.contains("section-enter")) return;
        // Sibling cards arrive in sequence; content stays visible before observation.
        if (element.matches(".feature-card")) {
          const siblings = Array.from(element.parentElement?.children ?? []);
          element.style.setProperty(
            "--reveal-delay",
            `${Math.min(siblings.indexOf(element), 3) * 65}ms`,
          );
        }
        observer.observe(element);
      });
    };
    observe();
    preference.addEventListener("change", observe);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", observe);
    };
  }, [pathname]);
  return null;
}
