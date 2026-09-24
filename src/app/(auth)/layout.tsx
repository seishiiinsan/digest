import Link from "next/link";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-16">
      <Link href="/" className="font-mono text-sm text-zinc-500">
        digest
      </Link>
      {children}
    </main>
  );
}
