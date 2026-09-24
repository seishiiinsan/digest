import Link from "next/link";

// Pages d'accès : un bulletin découpé dans le journal.
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-6 px-5 py-12">
      <div className="flex items-end justify-between gap-4">
        <Link href="/" className="wordmark text-5xl" aria-label="Digest, retour à la une">
          Digest
        </Link>
        <span className="kicker pb-1">Le quotidien de votre veille</span>
      </div>
      <div className="relative border-2 border-dashed border-ink p-6 sm:p-9">
        <span aria-hidden className="absolute -top-3 left-6 bg-paper px-1.5 font-mono text-lg leading-none text-ink-2">
          ✂
        </span>
        {children}
      </div>
      <p className="kicker text-center">Logiciel libre · vos données restent chiffrées et effaçables à tout moment</p>
    </main>
  );
}
