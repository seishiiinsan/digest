import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/form";
import { requireUserData } from "@/lib/session";
import { ApiKeyForm, DeliveryForm, PreferencesForm, ScheduleForm } from "./forms";

export const metadata: Metadata = { title: "Réglages · Digest" };

export default async function SettingsPage() {
  const { data } = await requireUserData();
  const [profile, apiKey, schedule, delivery] = await Promise.all([
    data.profile(),
    data.apiKey(),
    data.schedule(),
    data.delivery(),
  ]);
  const timeZones = Intl.supportedValuesOf("timeZone");

  return (
    <>
      <PageHeader kicker="Réglages" title="La mécanique du journal.">
        Votre clé, votre langue, votre heure de parution et l&apos;envoi vers Discord ou Slack.
      </PageHeader>
      <Section
        number="I."
        title="Clé API Anthropic"
        description="Chaque édition est facturée sur votre compte Anthropic. La clé est testée, chiffrée, puis n'est plus jamais affichée."
      >
        <ApiKeyForm current={apiKey ? { last4: apiKey.last4, model: apiKey.model } : null} />
      </Section>
      <Section number="II." title="Langue et fuseau" description="Langue de rédaction des éditions et fuseau utilisé pour le planning.">
        <PreferencesForm locale={profile.locale} timezone={profile.timezone} timeZones={timeZones} />
      </Section>
      <Section number="III." title="Parution" description="Quand imprimer votre édition.">
        <ScheduleForm
          current={schedule && { frequency: schedule.frequency, weekday: schedule.weekday, hour: schedule.hour, paused: schedule.paused }}
          nextRun={schedule?.nextRunAt && !schedule.paused ? formatDate(schedule.nextRunAt, profile.timezone) : null}
        />
      </Section>
      <Section number="IV." title="Diffusion" description="Facultatif : recevez aussi chaque édition dans un salon Discord ou Slack.">
        <DeliveryForm current={delivery} />
      </Section>
    </>
  );
}

function formatDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone }).format(date);
}
