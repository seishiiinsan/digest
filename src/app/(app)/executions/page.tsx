import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime, formatUsd, RUN_STATUS_LABEL } from "@/lib/format";
import { requireUserData } from "@/lib/session";

export const metadata: Metadata = { title: "Exécutions · Digest" };

export default async function RunsPage() {
  const { data } = await requireUserData();
  const [runs, profile] = await Promise.all([data.runs(), data.profile()]);

  return (
    <>
      <h1 className="text-2xl font-semibold">Exécutions</h1>
      {runs.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Aucune génération pour l&apos;instant.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="py-2 font-normal">Date</th>
              <th className="py-2 font-normal">Statut</th>
              <th className="py-2 font-normal">Thèmes</th>
              <th className="py-2 text-right font-normal">Coût</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-2">
                  <Link href={`/executions/${run.id}`} className="underline underline-offset-4">
                    {formatDateTime(run.createdAt, profile.timezone)}
                  </Link>
                </td>
                <td className="py-2" title={run.error ?? undefined}>
                  {RUN_STATUS_LABEL[run.status]}
                </td>
                <td className="py-2">
                  {run.topicsDone}/{run.topicsTotal}
                </td>
                <td className="py-2 text-right">{formatUsd(run.costUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
