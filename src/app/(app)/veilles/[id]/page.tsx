import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Message } from "@/components/form";
import { CATEGORY_LABEL, formatDateTime, formatUsd } from "@/lib/format";
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
        <h1 className="text-2xl font-semibold">Veille du {formatDateTime(digest.createdAt, profile.timezone)}</h1>
        <p className="text-sm text-zinc-500">
          {digest.items.length} info(s) · coût {formatUsd(digest.run.costUsd)}
        </p>
      </header>
      {digest.run.error && <Message tone="error">{digest.run.error}</Message>}
      {digest.items.length === 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Rien de nouveau sur vos thèmes pour cette période.</p>
      )}
      <ol className="flex flex-col gap-6">
        {digest.items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2" data-testid="digest-item">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {CATEGORY_LABEL[item.category]}
              {item.topic && ` · ${item.topic.title}`} · pertinence {item.relevance}/5
            </p>
            <h2 className="font-medium">{item.title}</h2>
            <p className="text-sm">{item.summary}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Pourquoi c&apos;est important : </span>
              {item.whyItMatters}
            </p>
            <ul className="flex flex-col gap-1 text-sm">
              {item.sources.map((source) => (
                <li key={source.id}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    {source.title}
                  </a>{" "}
                  <span className="text-zinc-500">
                    · {source.domain}
                    {source.publishedAt && ` · ${formatDateTime(source.publishedAt, profile.timezone)}`}
                  </span>
                  {source.citedText && (
                    <blockquote className="mt-1 border-l-2 border-zinc-300 pl-3 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                      {source.citedText}
                    </blockquote>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}
