import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Section } from "@/components/form";
import { GenerateButton } from "@/components/generate-button";
import { formatLongDate, formatTime } from "@/lib/format";
import { requireUserData } from "@/lib/session";
import { AccountActions } from "./account-actions";

export const metadata: Metadata = { title: "Rédaction · Digest" };

export default async function DashboardPage() {
  const { session, data } = await requireUserData();
  const [apiKey, topics, schedule, delivery, activeRun, profile, digests] = await Promise.all([
    data.apiKey(),
    data.topics(),
    data.schedule(),
    data.delivery(),
    data.activeRun(),
    data.profile(),
    data.digests(1),
  ]);
  const activeTopics = topics.filter((t) => t.active).length;

  const steps = [
    { label: "Adresse email vérifiée", done: session.user.emailVerified, href: null },
    { label: "Clé API Anthropic testée", done: !!apiKey, href: "/reglages" },
    { label: "Au moins une rubrique active", done: activeTopics > 0, href: "/themes" },
    { label: "Heure de parution choisie", done: !!schedule, href: "/reglages" },
    { label: "Envoi Discord ou Slack (facultatif)", done: !!delivery, href: "/reglages" },
  ];
  const ready = steps.slice(0, 3).every((s) => s.done);
  const lastDigest = digests[0];

  return (
    <>
      <PageHeader kicker="La rédaction" title="Bonjour, voici votre salle de rédaction.">
        Connecté en tant que <strong data-testid="user-email">{session.user.email}</strong>. Préparez vos rubriques, puis lancez
        l&apos;impression.
      </PageHeader>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section className="flex flex-col gap-5 border-2 border-ink p-6 sm:p-8">
          <p className="kicker text-accent">Prochaine édition</p>
          {schedule?.nextRunAt && !schedule.paused ? (
            <p className="font-display text-3xl font-semibold leading-tight sm:text-4xl" data-testid="next-run">
              {formatLongDate(schedule.nextRunAt, profile.timezone)}, {formatTime(schedule.nextRunAt, profile.timezone)}
              {delivery?.active && (
                <span className="mt-2 block font-serif text-lg font-normal text-ink-2">
                  Envoyée aussi sur {delivery.kind === "discord" ? "Discord" : "Slack"}.
                </span>
              )}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="font-display text-3xl font-semibold leading-tight">
                {schedule?.paused ? "Parution en pause." : "Aucune heure de parution."}
              </p>
              <Link href="/reglages" className="link self-start text-lg">
                Régler le planning
              </Link>
            </div>
          )}
          <div className="rule-hair pt-5">
            {activeRun ? (
              <Link href={`/executions/${activeRun.id}`} className="link text-lg">
                Une édition est sous presse : suivre l&apos;impression
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-base text-ink-2">
                  Inutile d&apos;attendre : imprimez une édition maintenant, sur vos {activeTopics || "…"} rubrique(s) active(s).
                </p>
                <GenerateButton />
              </div>
            )}
          </div>
          {lastDigest && (
            <p className="kicker">
              Dernière édition :{" "}
              <Link href={`/veilles/${lastDigest.id}`} className="link normal-case tracking-normal">
                {formatLongDate(lastDigest.createdAt, profile.timezone)} · {lastDigest._count.items} info(s)
              </Link>
            </p>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <p className="kicker">{ready ? "Prêt pour l'impression" : "Avant l'impression"}</p>
          <ol className="flex flex-col">
            {steps.map((step, index) => (
              <li key={step.label} className="rule-hair flex items-baseline gap-3 py-3 first:border-t-0">
                <span className="font-display text-xl italic text-ink-3 tabular">{index + 1}.</span>
                <span className={`flex-1 text-lg ${step.done ? "text-ink-3 line-through decoration-accent decoration-2" : ""}`}>
                  {step.href && !step.done ? (
                    <Link href={step.href} className="link">
                      {step.label}
                    </Link>
                  ) : (
                    step.label
                  )}
                </span>
                <span aria-hidden className={step.done ? "font-mono text-ok" : "font-mono text-ink-3"}>
                  {step.done ? "✓" : "—"}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <Section number="§" title="Votre compte" description="Sessions ouvertes et suppression définitive de vos données.">
        <AccountActions />
      </Section>
    </>
  );
}
