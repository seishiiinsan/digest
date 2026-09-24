import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Message } from "@/components/form";
import { ItemCard } from "@/components/item-card";
import { formatDateTime, formatUsd } from "@/lib/format";
import { requireUserData } from "@/lib/session";

export const metadata: Metadata = { title: "Veille · Digest" };

export default async function DigestPage({ params }: PageProps<"/veilles/[id]">) {
  const { id } = await params;
  const { data } = await requireUserData();
  const [digest, profile] = await Promise.all([data.digest(id), data.profile()]);
  if (!digest) notFound();

  return (
    <>
      <header className="flex flex-col gap-1">
        <Link href="/veilles" className="text-sm text-zinc-500 underline underline-offset-4">
          Toutes les veilles
        </Link>
        <h1 className="text-2xl font-semibold">Veille du {formatDateTime(digest.createdAt, profile.timezone)}</h1>
        <p className="text-sm text-zinc-500">
          {digest.items.length} info(s) · coût {formatUsd(digest.run.costUsd)}
          {digest.deliveredAt && ` · envoyée le ${formatDateTime(digest.deliveredAt, profile.timezone)}`}
        </p>
      </header>
      {digest.run.error && <Message tone="error">{digest.run.error}</Message>}
      {digest.deliveryError && !digest.deliveredAt && <Message tone="error">Envoi au webhook : {digest.deliveryError}</Message>}
      {digest.items.length === 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Rien de nouveau sur vos thèmes pour cette période.</p>
      )}
      <div className="flex flex-col gap-3">
        {digest.items.map((item) => (
          <ItemCard key={item.id} item={item} timeZone={profile.timezone} open />
        ))}
      </div>
    </>
  );
}
