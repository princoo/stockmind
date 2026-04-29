"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type PublicShellProps = Readonly<{
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}>;

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function PublicShell({ children, user }: PublicShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="group inline-flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0058be] text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,88,190,0.25)] transition-transform group-hover:-translate-y-0.5">
              SM
            </span>
            <span className="text-lg font-semibold tracking-tight text-zinc-900">
              stockmind
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-2xl border border-white/60 bg-white/75 p-1 shadow-sm md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {user ? (
              <Link
                href="/dashboard"
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                  pathname.startsWith("/dashboard")
                    ? "bg-blue-50 text-blue-700"
                    : "text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900"
                }`}
              >
                Dashboard
              </Link>
            ) : null}
          </nav>

          {user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/90 px-2 py-1.5 text-left transition-all hover:bg-white"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0058be] text-xs font-semibold uppercase text-white">
                  {user.name.slice(0, 2)}
                </span>
                <span className="hidden text-xs font-medium text-zinc-700 sm:block">
                  {user.name}
                </span>
              </button>
              {menuOpen ? (
                <div
                  className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_18px_35px_rgba(15,23,42,0.14)]"
                  role="menu"
                >
                <p className="text-sm font-semibold text-zinc-900">{user.name}</p>
                <p className="mt-0.5 text-xs text-zinc-600">{user.email}</p>
                <p className="mt-2 inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  Role: {user.role}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/dashboard"
                    className="ui-btn-secondary px-3 py-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <form action="/api/auth/signout" method="post">
                    <button type="submit" className="ui-btn-primary px-3 py-2">
                      Logout
                    </button>
                  </form>
                </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Link href="/login" className="ui-btn-primary px-3 py-2">
              Login
            </Link>
          )}
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t border-white/70 bg-white/60">
        <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-8 text-sm text-zinc-600 sm:px-6 lg:grid-cols-2 lg:px-8">
          <p>stockmind - modern inventory management for growing teams.</p>
          <p className="lg:text-right">
            © {new Date().getFullYear()} stockmind. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
