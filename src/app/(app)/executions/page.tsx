import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/form";
import { StatusStamp } from "@/components/status-stamp";
import { formatDateTime, formatUsd } from "@/lib/format";
import { requireUserData } from "@/lib/session";

export const metadata: Metadata = { title: "Rotative · Digest" };

export default async function RunsPage() {
  const { data } = await requireUserData();
  const [runs, profile] = await Promise.all([data.runs(), data.profile()]);
  const total = runs.reduce((sum, run) => sum + Number(run.costUsd), 0);

  return (
    <>
      <PageHeader kicker="La rotative" title="Le registre des impressions.">
        Chaque génération, planifiée ou à la demande, avec son statut, ses erreurs et son coût réel.
      </PageHeader>
      {runs.length === 0 ? (
        <p className="font-display text-2xl italic text-ink-2">La rotative n&apos;a encore rien imprimé.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left">
            <thead>
              <tr className="kicker border-y-2 border-ink">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Statut</th>
                <th className="py-2 pr-4 font-medium">Origine</th>
                <th className="py-2 pr-4 font-medium">Rubriques</th>
                <th className="py-2 text-right font-medium">Coût</th>
              </tr>
            </thead>
            <tbody className="text-base">
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-rule">
                  <td className="py-3 pr-4">
                    <Link href={`/executions/${run.id}`} className="link">
                      {formatDateTime(run.createdAt, profile.timezone)}
                    </Link>
                  </td>
                  <td className="py-3 pr-4" title={run.error ?? undefined}>
                    <StatusStamp status={run.status} />
                  </td>
                  <td className="py-3 pr-4 text-ink-2">{run.trigger === "manual" ? "À la demande" : "Planifiée"}</td>
                  <td className="py-3 pr-4 font-mono text-sm tabular">
                    {run.topicsDone}/{run.topicsTotal}
                  </td>
                  <td className="py-3 text-right font-mono text-sm tabular">{formatUsd(run.costUsd)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="kicker">
                <td colSpan={4} className="pt-3">
                  Total des {runs.length} dernières impressions
                </td>
                <td className="pt-3 text-right tabular">{formatUsd(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  );
}
