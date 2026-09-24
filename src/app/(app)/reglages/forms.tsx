"use client";

import { useActionState, useState } from "react";
import { ActionMessage, Checkbox, Field, Select, SubmitButton } from "@/components/form";
import { idle } from "@/lib/action-state";
import { LANGUAGES } from "@/lib/languages";
import { DEFAULT_MODEL, MODELS } from "@/lib/models";
import { deleteApiKey, deleteDelivery, saveApiKey, saveDelivery, savePreferences, saveSchedule, testDelivery } from "./actions";

const secondary = "btn btn-ghost btn-small";
const modelOptions = MODELS.map((m) => ({ value: m.id, label: `${m.label} · ${m.input} $ / ${m.output} $ par M tokens` }));
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
      <form action={action} className="flex flex-col gap-6">
        <ActionMessage state={state} />
        {current && (
          <p className="flex flex-wrap items-center gap-3 text-base" data-testid="api-key-status">
            <span className="stamp text-ok">Clé vérifiée</span>
            <span className="font-mono">sk-ant-…{current.last4}</span>
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
        <ul className="grid gap-2 text-sm text-ink-2 sm:grid-cols-3">
          {MODELS.map((m) => (
            <li key={m.id} className="border-l-2 border-rule pl-3">
              <span className="block font-medium text-ink">{m.label}</span>
              {m.hint}
            </li>
          ))}
        </ul>
        <div>
          <SubmitButton pending={pending}>{current ? "Enregistrer" : "Tester et enregistrer"}</SubmitButton>
        </div>
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
    <form action={action} className="flex flex-col gap-6">
      <ActionMessage state={state} />
      <Select label="Langue des éditions" name="locale" defaultValue={locale} options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))} />
      <Select label="Fuseau horaire" name="timezone" defaultValue={timezone} options={timeZones.map((tz) => ({ value: tz, label: tz }))} />
      <div>
        <SubmitButton pending={pending}>Enregistrer</SubmitButton>
      </div>
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
    <form action={action} className="flex flex-col gap-6">
      <ActionMessage state={state} />
      {nextRun && (
        <p className="border-l-4 border-accent pl-4 font-display text-xl italic" data-testid="next-run">
          Prochaine édition : {nextRun}
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-3">
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
      <Checkbox label="Mettre la parution en pause" name="paused" defaultChecked={current?.paused ?? false} />
      <div>
        <SubmitButton pending={pending}>Enregistrer</SubmitButton>
      </div>
    </form>
  );
}

export function DeliveryForm({ current }: { current: { kind: string; hint: string } | null }) {
  const [state, action, pending] = useActionState(saveDelivery, idle);
  const [deleteState, deleteAction, deleting] = useActionState(deleteDelivery, idle);
  const [testState, testAction, testing] = useActionState(testDelivery, idle);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-6">
        <ActionMessage state={state} />
        {current && (
          <p className="flex flex-wrap items-center gap-3 font-mono text-sm" data-testid="webhook-status">
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
        <div>
          <SubmitButton pending={pending}>Enregistrer le webhook</SubmitButton>
        </div>
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
