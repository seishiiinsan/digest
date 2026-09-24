import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDateTime, formatTokens, formatUsd, RUN_STATUS_LABEL } from "@/lib/format";
import { modelPricing } from "@/lib/models";
import { requireUserData } from "@/lib/session";
import { RunProgressView } from "./run-progress";

export const metadata: Metadata = { title: "Génération · Digest" };

export default async function RunPage({ params }: PageProps<"/executions/[id]">) {
  const { id } = await params;
  const { data } = await requireUserData();
  const [run, profile] = await Promise.all([data.run(id), data.profile()]);
  if (!run) notFound();

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Génération du {formatDateTime(run.createdAt, profile.timezone)}</h1>
        <p className="text-sm text-zinc-500">
          {RUN_STATUS_LABEL[run.status]} · {run.trigger === "manual" ? "à la demande" : "planifiée"}
          {run.model && ` · ${modelPricing(run.model).label}`}
        </p>
      </header>
      <RunProgressView
        runId={run.id}
        initial={{ status: run.status, topicsDone: run.topicsDone, topicsTotal: run.topicsTotal, error: run.error, digestId: run.digest?.id ?? null }}
      />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4" data-testid="run-usage">
        <Stat label="Coût estimé" value={formatUsd(run.costUsd)} />
        <Stat label="Tokens entrée" value={formatTokens(run.inputTokens + run.cacheReadTokens + run.cacheWriteTokens)} />
        <Stat label="Tokens sortie" value={formatTokens(run.outputTokens)} />
        <Stat label="Recherches web" value={String(run.searches)} />
      </dl>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
