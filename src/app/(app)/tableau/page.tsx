import type { Metadata } from "next";
import Link from "next/link";
import { GenerateButton } from "@/components/generate-button";
import { formatDateTime } from "@/lib/format";
import { requireUserData } from "@/lib/session";
import { AccountActions } from "./account-actions";

export const metadata: Metadata = { title: "Tableau de bord · Digest" };

export default async function DashboardPage() {
  const { session, data } = await requireUserData();
  const [apiKey, topics, schedule, delivery, activeRun, profile] = await Promise.all([
    data.apiKey(),
    data.topics(),
    data.schedule(),
    data.delivery(),
    data.activeRun(),
    data.profile(),
  ]);

  const steps = [
    { label: "Adresse email vérifiée", done: session.user.emailVerified, href: null },
    { label: "Clé API Anthropic testée", done: !!apiKey, href: "/reglages" },
    { label: "Au moins un thème actif", done: topics.some((t) => t.active), href: "/themes" },
    { label: "Planning choisi", done: !!schedule, href: "/reglages" },
    { label: "Webhook Discord ou Slack (optionnel)", done: !!delivery, href: "/reglages" },
  ];

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Bonjour</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connecté en tant que <strong data-testid="user-email">{session.user.email}</strong>.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Configuration</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-2">
              <span aria-hidden className={step.done ? "text-emerald-600" : "text-zinc-400"}>
                {step.done ? "✓" : "○"}
              </span>
              {step.href && !step.done ? (
                <Link href={step.href} className="underline underline-offset-4">
                  {step.label}
                </Link>
              ) : (
                <span>{step.label}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Veille</h2>
        {schedule?.nextRunAt && !schedule.paused && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400" data-testid="next-run">
            Prochaine veille planifiée : {formatDateTime(schedule.nextRunAt, profile.timezone)}
            {delivery?.active && ` · envoyée aussi sur ${delivery.kind === "discord" ? "Discord" : "Slack"}`}
          </p>
        )}
        {activeRun ? (
          <Link href={`/executions/${activeRun.id}`} className="text-sm underline underline-offset-4">
            Une veille est en cours de génération : suivre la progression
          </Link>
        ) : (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Inutile d&apos;attendre le planning : lancez une veille maintenant sur vos thèmes actifs.
            </p>
            <GenerateButton />
          </>
        )}
      </section>

      <AccountActions />
    </>
  );
}
