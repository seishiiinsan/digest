import Link from "next/link";

// Pied de page : l'ours du journal. Lien vers le code source exigé par l'AGPL.
export function Colophon({ wide = false }: { wide?: boolean }) {
  return (
    <footer className={`mx-auto w-full px-5 pb-10 sm:px-8 ${wide ? "max-w-6xl" : "max-w-5xl"}`}>
      <div className="rule-double mb-4" />
      <div className="kicker flex flex-wrap justify-between gap-x-6 gap-y-2">
        <span>Digest · rédigé par Claude, relu par vos sources</span>
        <span>
          Logiciel libre AGPL-3.0 ·{" "}
          <Link href="https://github.com/seishiiinsan/digest" className="link">
            code source
          </Link>
        </span>
      </div>
    </footer>
  );
}
