import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { requireUserData } from "@/lib/session";

export const metadata: Metadata = { title: "Veilles · Digest" };

export default async function DigestsPage() {
  const { data } = await requireUserData();
  const [digests, profile] = await Promise.all([data.digests(), data.profile()]);

  return (
    <>
      <h1 className="text-2xl font-semibold">Veilles</h1>
      {digests.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Aucune veille pour l&apos;instant. Lancez-en une depuis le{" "}
          <Link href="/tableau" className="underline underline-offset-4">
            tableau de bord
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {digests.map((digest) => (
            <li key={digest.id}>
              <Link href={`/veilles/${digest.id}`} className="underline underline-offset-4">
                Veille du {formatDateTime(digest.createdAt, profile.timezone)}
              </Link>{" "}
              <span className="text-sm text-zinc-500">· {digest._count.items} info(s)</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
