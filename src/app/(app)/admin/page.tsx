import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { formatDateTime, formatUsd } from "@/lib/format";
import { isAdmin, signupEnabled } from "@/lib/instance";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Digest" };

// Vue d'instance, réservée aux emails listés dans ADMIN_EMAILS. N'affiche aucun secret.
export default async function AdminPage() {
  const { user } = await requireSession();
  if (!isAdmin(user.email)) notFound();

  const prisma = getPrisma();
  const [users, costs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        apiKey: { select: { model: true } },
        _count: { select: { topics: { where: { active: true } }, digests: true } },
      },
    }),
    prisma.run.groupBy({ by: ["userId"], _sum: { costUsd: true } }),
  ]);
  const costByUser = new Map(costs.map((row) => [row.userId, row._sum.costUsd ?? 0]));

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Instance</h1>
        <p className="text-sm text-zinc-500">
          {users.length} compte(s) · inscriptions {signupEnabled() ? "ouvertes" : "fermées"} (SIGNUP_ENABLED)
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" data-testid="admin-users">
          <thead className="text-zinc-500">
            <tr>
              <th className="py-2 pr-4 font-normal">Compte</th>
              <th className="py-2 pr-4 font-normal">Créé le</th>
              <th className="py-2 pr-4 font-normal">Clé</th>
              <th className="py-2 pr-4 font-normal">Thèmes</th>
              <th className="py-2 pr-4 font-normal">Veilles</th>
              <th className="py-2 text-right font-normal">Coût total</th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => (
              <tr key={account.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-2 pr-4">
                  {account.email}
                  {!account.emailVerified && <span className="text-zinc-500"> · non vérifié</span>}
                </td>
                <td className="py-2 pr-4">{formatDateTime(account.createdAt, "Europe/Paris")}</td>
                <td className="py-2 pr-4">{account.apiKey?.model ?? "—"}</td>
                <td className="py-2 pr-4">{account._count.topics}</td>
                <td className="py-2 pr-4">{account._count.digests}</td>
                <td className="py-2 text-right">{formatUsd(costByUser.get(account.id) ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
