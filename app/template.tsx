"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { finishNavigationTransition } from "@/src/components/layout/navigation-link";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useLayoutEffect(() => finishNavigationTransition(), [pathname]);
  return <div key={pathname} className="route-transition">{children}</div>;
}
