import Link from "next/link";

const links = [
  { href: "/tableau", label: "Tableau" },
  { href: "/themes", label: "Thèmes" },
  { href: "/reglages", label: "Réglages" },
];

export function Nav({ email }: { email: string }) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 text-sm">
        <Link href="/tableau" className="font-mono text-zinc-500">
          digest
        </Link>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:underline">
            {link.label}
          </Link>
        ))}
        <span className="ml-auto text-zinc-500">{email}</span>
      </nav>
    </header>
  );
}
