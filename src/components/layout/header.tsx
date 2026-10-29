"use client";
import { NavigationLink as Link } from "./navigation-link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { socials, trackerUrl } from "@/src/config/socials";
import { CartLink } from "@/src/components/cart/CartLink";
const links = [
  ["/", "Home"],
  [trackerUrl, "Roster"],
  ["/shop", "Shop"],
  ["/about", "About"],
];
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (e.key === "Tab") {
        const nodes = menu.current?.querySelectorAll<HTMLAnchorElement>("a");
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          toggle.current?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          toggle.current?.focus();
        } else if (e.shiftKey && document.activeElement === toggle.current) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="Evoke home">
        <img src="/assets/evoke/logo.png" alt="" width="42" height="27" />
        <span>Evoke</span>
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            target={href === trackerUrl ? "_blank" : undefined}
            rel={href === trackerUrl ? "noopener noreferrer" : undefined}
            aria-current={
              path === href || (href !== "/" && path.startsWith(href))
                ? "page"
                : undefined
            }
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <CartLink />
        <a
          href={socials.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="button header-discord"
        >
          Discord
          <ArrowUpRight size={15} />
        </a>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div ref={menu} id="mobile-menu" className="mobile-menu">
          <nav aria-label="Mobile navigation">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                target={href === trackerUrl ? "_blank" : undefined}
                rel={href === trackerUrl ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                aria-current={path === href ? "page" : undefined}
              >
                {label}
                <ArrowUpRight size={20} />
              </Link>
            ))}
            <a href={socials.discord} target="_blank" rel="noopener noreferrer">
              Join Discord
              <ArrowUpRight size={20} />
            </a>
          </nav>
          <span className="eyebrow">EVOKE ESPORTS · EST 2026</span>
        </div>
      )}
    </header>
  );
}
