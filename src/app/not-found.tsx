import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <Link href="/" className="wordmark text-4xl">
        Digest
      </Link>
      <div className="rule-double" />
      <p className="kicker text-accent">Erratum · page 404</p>
      <h1 className="text-5xl font-semibold leading-none tracking-tight">Cette page n&apos;a jamais été imprimée.</h1>
      <p className="text-lg text-ink-2">Le lien est peut-être erroné, ou l&apos;article a été retiré de l&apos;édition.</p>
      <Link href="/" className="btn self-start">
        Retour à la une
      </Link>
    </main>
  );
}
