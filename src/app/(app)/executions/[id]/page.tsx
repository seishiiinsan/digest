import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusStamp } from "@/components/status-stamp";
import { formatDateTime, formatTokens, formatUsd } from "@/lib/format";
import { modelPricing } from "@/lib/models";
import { requireUserData } from "@/lib/session";
import { RunProgressView } from "./run-progress";

export const metadata: Metadata = { title: "Impression · Digest" };

export default async function RunPage({ params }: PageProps<"/executions/[id]">) {
  const { id } = await params;
  const { data } = await requireUserData();
  const [run, profile] = await Promise.all([data.run(id), data.profile()]);
  if (!run) notFound();

  return (
    <>
      <header className="flex flex-col gap-3">
        <Link href="/executions" className="kicker link self-start">
          ← La rotative
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Impression du {formatDateTime(run.createdAt, profile.timezone)}</h1>
          <StatusStamp status={run.status} />
        </div>
        <p className="kicker">
          {run.trigger === "manual" ? "À la demande" : "Planifiée"}
          {run.model && ` · ${modelPricing(run.model).label}`}
        </p>
      </header>
      <RunProgressView
        runId={run.id}
        initial={{ status: run.status, topicsDone: run.topicsDone, topicsTotal: run.topicsTotal, error: run.error, digestId: run.digest?.id ?? null }}
      />
      <dl className="grid grid-cols-2 border-y-2 border-ink sm:grid-cols-4" data-testid="run-usage">
        <Stat label="Coût estimé" value={formatUsd(run.costUsd)} />
        <Stat label="Tokens lus" value={formatTokens(run.inputTokens + run.cacheReadTokens + run.cacheWriteTokens)} />
        <Stat label="Tokens écrits" value={formatTokens(run.outputTokens)} />
        <Stat label="Recherches web" value={String(run.searches)} />
      </dl>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-rule py-5 pr-4 [&:not(:first-child)]:sm:border-l [&:not(:first-child)]:sm:pl-5">
      <dt className="kicker">{label}</dt>
      <dd className="font-display text-3xl font-semibold tabular">{value}</dd>
    </div>
  );
}
