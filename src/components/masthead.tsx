"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/tableau", label: "Rédaction" },
  { href: "/veilles", label: "Éditions" },
  { href: "/themes", label: "Rubriques" },
  { href: "/executions", label: "Rotative" },
  { href: "/reglages", label: "Réglages" },
];

// Manchette des pages connectées : dateline, titre du journal, rubriques.
export function Masthead({ email, dateline, admin = false }: { email: string; dateline: string; admin?: boolean }) {
  const pathname = usePathname();
  const links = admin ? [...sections, { href: "/admin", label: "Admin" }] : sections;

  return (
    <header className="mx-auto w-full max-w-5xl px-5 pt-5 sm:px-8">
      <div className="kicker flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-rule pb-2">
        <span>{dateline}</span>
        <span className="normal-case tracking-normal">{email}</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 py-4">
        <Link href="/tableau" className="wordmark text-5xl sm:text-6xl" aria-label="Digest, rédaction">
          Digest
        </Link>
        <nav aria-label="Rubriques" className="-mb-1 flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`font-mono text-[0.78rem] font-medium uppercase tracking-[0.12em] transition-colors hover:text-accent ${
                  active ? "text-accent underline decoration-2 underline-offset-[6px]" : "text-ink-2"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="rule-double" />
    </header>
  );
}
