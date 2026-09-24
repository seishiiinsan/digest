"use client";

import { useActionState, useState } from "react";
import { ActionMessage, Field, Select, SubmitButton } from "@/components/form";
import { idle } from "@/lib/action-state";
import { LANGUAGES } from "@/lib/languages";
import { DEFAULT_MODEL, MODELS } from "@/lib/models";
import { deleteApiKey, deleteDelivery, saveApiKey, saveDelivery, savePreferences, saveSchedule, testDelivery } from "./actions";

const secondary = "self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700";
const modelOptions = MODELS.map((m) => ({ value: m.id, label: `${m.label} · ${m.input} $ / ${m.output} $ par M tokens · ${m.hint}` }));
const weekdayOptions = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map((label, value) => ({
  value: String(value),
  label,
}));
const hourOptions = Array.from({ length: 24 }, (_, hour) => ({ value: String(hour), label: `${String(hour).padStart(2, "0")}:00` }));

export function ApiKeyForm({ current }: { current: { last4: string; model: string } | null }) {
  const [state, action, pending] = useActionState(saveApiKey, idle);
  const [deleteState, deleteAction, deleting] = useActionState(deleteApiKey, idle);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <ActionMessage state={state} />
        {current && (
          <p className="text-sm" data-testid="api-key-status">
            Clé enregistrée : <span className="font-mono">sk-ant-…{current.last4}</span>
          </p>
        )}
        <Field
          label={current ? "Remplacer la clé (laisser vide pour garder l'actuelle)" : "Clé API"}
          name="apiKey"
          type="password"
          autoComplete="off"
          placeholder="sk-ant-…"
          required={!current}
        />
        <Select label="Modèle" name="model" defaultValue={current?.model ?? DEFAULT_MODEL} options={modelOptions} />
        <SubmitButton pending={pending}>{current ? "Enregistrer" : "Tester et enregistrer"}</SubmitButton>
      </form>
      {current && (
        <form action={deleteAction} className="flex flex-col gap-2">
          <ActionMessage state={deleteState} />
          <button type="submit" className={secondary} disabled={deleting}>
            Supprimer la clé
          </button>
        </form>
      )}
    </div>
  );
}

export function PreferencesForm({ locale, timezone, timeZones }: { locale: string; timezone: string; timeZones: string[] }) {
  const [state, action, pending] = useActionState(savePreferences, idle);
  return (
    <form action={action} className="flex flex-col gap-4">
      <ActionMessage state={state} />
      <Select label="Langue des veilles" name="locale" defaultValue={locale} options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))} />
      <Select label="Fuseau horaire" name="timezone" defaultValue={timezone} options={timeZones.map((tz) => ({ value: tz, label: tz }))} />
      <SubmitButton pending={pending}>Enregistrer</SubmitButton>
    </form>
  );
}

interface ScheduleValues {
  frequency: "daily" | "weekly";
  weekday: number | null;
  hour: number;
  paused: boolean;
}

export function ScheduleForm({ current, nextRun }: { current: ScheduleValues | null; nextRun: string | null }) {
  const [state, action, pending] = useActionState(saveSchedule, idle);
  const [frequency, setFrequency] = useState(current?.frequency ?? "daily");

  return (
    <form action={action} className="flex flex-col gap-4">
      <ActionMessage state={state} />
      {nextRun && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400" data-testid="next-run">
          Prochaine veille : {nextRun}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Fréquence"
          name="frequency"
          value={frequency}
          onChange={(event) => setFrequency(event.target.value as ScheduleValues["frequency"])}
          options={[
            { value: "daily", label: "Quotidienne" },
            { value: "weekly", label: "Hebdomadaire" },
          ]}
        />
        {frequency === "weekly" && (
          <Select label="Jour" name="weekday" defaultValue={String(current?.weekday ?? 1)} options={weekdayOptions} />
        )}
        <Select label="Heure" name="hour" defaultValue={String(current?.hour ?? 8)} options={hourOptions} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="paused" defaultChecked={current?.paused ?? false} />
        Mettre en pause
      </label>
      <SubmitButton pending={pending}>Enregistrer</SubmitButton>
    </form>
  );
}

export function DeliveryForm({ current }: { current: { kind: string; hint: string } | null }) {
  const [state, action, pending] = useActionState(saveDelivery, idle);
  const [deleteState, deleteAction, deleting] = useActionState(deleteDelivery, idle);
  const [testState, testAction, testing] = useActionState(testDelivery, idle);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <ActionMessage state={state} />
        {current && (
          <p className="text-sm" data-testid="webhook-status">
            {current.kind === "discord" ? "Discord" : "Slack"} : <span className="font-mono">{current.hint}</span>
          </p>
        )}
        <Field
          label={current ? "Remplacer l'URL du webhook" : "URL du webhook"}
          name="webhookUrl"
          type="url"
          autoComplete="off"
          placeholder="https://discord.com/api/webhooks/…"
          required
        />
        <SubmitButton pending={pending}>Enregistrer le webhook</SubmitButton>
      </form>
      {current && (
        <div className="flex flex-col gap-2">
          <ActionMessage state={testState} />
          <ActionMessage state={deleteState} />
          <div className="flex flex-wrap gap-2">
            <form action={testAction}>
              <button type="submit" className={secondary} disabled={testing}>
                {testing ? "Envoi…" : "Envoyer un message de test"}
              </button>
            </form>
            <form action={deleteAction}>
              <button type="submit" className={secondary} disabled={deleting}>
                Supprimer le webhook
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
