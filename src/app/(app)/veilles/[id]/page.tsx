import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Message } from "@/components/form";
import { ItemCard } from "@/components/item-card";
import { formatDateTime, formatLongDate, formatTime, formatUsd } from "@/lib/format";
import { requireUserData } from "@/lib/session";

export const metadata: Metadata = { title: "Édition · Digest" };

export default async function DigestPage({ params }: PageProps<"/veilles/[id]">) {
  const { id } = await params;
  const { data } = await requireUserData();
  const [digest, profile] = await Promise.all([data.digest(id), data.profile()]);
  if (!digest) notFound();

  const [lead, ...rest] = digest.items;

  return (
    <>
      <header className="flex flex-col gap-4 text-center">
        <Link href="/veilles" className="kicker link self-center">
          ← Toutes les éditions
        </Link>
        <p className="kicker text-accent">Édition de {formatTime(digest.createdAt, profile.timezone)}</p>
        <h1 className="text-4xl font-semibold leading-none tracking-tight first-letter:uppercase sm:text-6xl">
          {formatLongDate(digest.createdAt, profile.timezone)}
        </h1>
        <p className="kicker border-y border-ink py-2">
          {digest.items.length} info(s) · coût {formatUsd(digest.run.costUsd)}
          {digest.deliveredAt && ` · envoyée le ${formatDateTime(digest.deliveredAt, profile.timezone)}`}
        </p>
      </header>

      {digest.run.error && <Message tone="error">{digest.run.error}</Message>}
      {digest.deliveryError && !digest.deliveredAt && <Message tone="error">Envoi au webhook : {digest.deliveryError}</Message>}

      {digest.items.length === 0 ? (
        <p className="text-center font-display text-2xl italic text-ink-2">Rien de nouveau sur vos rubriques pour cette période.</p>
      ) : (
        <div className="flex flex-col">
          <ItemCard item={lead} timeZone={profile.timezone} open lead />
          {rest.map((item) => (
            <ItemCard key={item.id} item={item} timeZone={profile.timezone} open />
          ))}
        </div>
      )}
    </>
  );
}
