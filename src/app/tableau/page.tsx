import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { AccountActions } from "./account-actions";

export const metadata: Metadata = { title: "Tableau de bord · Digest" };

export default async function DashboardPage() {
  const { user } = await requireSession();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-sm text-zinc-500">digest</p>
        <h1 className="text-2xl font-semibold">Bonjour</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connecté en tant que <strong data-testid="user-email">{user.email}</strong>. La configuration de vos thèmes
          arrive bientôt.
        </p>
      </header>
      <AccountActions />
    </main>
  );
}
