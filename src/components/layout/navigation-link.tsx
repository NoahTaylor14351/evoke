"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

export const HERO_REPLAY_EVENT = "evoke:replay-hero";
let exitAnimation: Animation | undefined;
let navigationSequence = 0;
export function finishNavigationTransition() {
  exitAnimation?.cancel();
  exitAnimation = undefined;
}

export function NavigationLink({
  onClick,
  ...props
}: ComponentProps<typeof Link>) {
  const router = useRouter();
  return (
    <Link
      {...props}
      onClick={async (event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target === "_blank"
        )
          return;

        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const destination = new URL(event.currentTarget.href);
        if (destination.origin !== location.origin) return;
        if (destination.pathname === location.pathname) {
          if (props.href === "/" && location.pathname === "/") {
            event.preventDefault();
            window.dispatchEvent(new Event(HERO_REPLAY_EVENT));
            window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
          }
          return;
        }
        if (reduced) return;
        const content = document.querySelector<HTMLElement>(".route-transition");
        if (!content) return;
        event.preventDefault();
        const sequence = ++navigationSequence;
        finishNavigationTransition();
        const animation = content.animate(
          [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-8px)" }],
          { duration: 150, easing: "ease-in", fill: "forwards" },
        );
        exitAnimation = animation;
        try { await animation.finished; } catch {}
        if (sequence !== navigationSequence) return;
        const href = destination.pathname + destination.search + destination.hash;
        if (props.replace) router.replace(href, { scroll: props.scroll });
        else router.push(href, { scroll: props.scroll });
        // Restore the current page if a navigation fails to commit.
        setTimeout(() => {
          if (exitAnimation === animation) finishNavigationTransition();
        }, 1500);
      }}
    />
  );
}
