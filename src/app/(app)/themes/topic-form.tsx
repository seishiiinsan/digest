"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ActionMessage, Field, Select, SubmitButton, TextArea } from "@/components/form";
import { idle, type ActionState } from "@/lib/action-state";

export interface TopicValues {
  title: string;
  description: string;
  keywords: string[];
  includeDomains: string[];
  excludeDomains: string[];
  detailLevel: string;
}

const empty: TopicValues = { title: "", description: "", keywords: [], includeDomains: [], excludeDomains: [], detailLevel: "standard" };

export function TopicForm({
  action,
  initial = empty,
  submitLabel,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  initial?: TopicValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, idle);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-7">
      <ActionMessage state={state} />
      <Field label="Titre" name="title" defaultValue={initial.title} maxLength={80} placeholder="Next.js et React" required />
      <TextArea
        label="Description"
        name="description"
        defaultValue={initial.description}
        placeholder="Nouveautés Next.js et React Server Components"
        hint="Ce que vous voulez suivre, en langage naturel : c'est la consigne donnée à Claude."
      />
      <Field
        label="Mots-clés (séparés par des virgules)"
        name="keywords"
        defaultValue={initial.keywords.join(", ")}
        placeholder="RSC, App Router, Turbopack"
      />
      <div className="grid gap-7 sm:grid-cols-2">
        <TextArea
          label="Sources à privilégier"
          name="includeDomains"
          defaultValue={initial.includeDomains.join("\n")}
          placeholder="nextjs.org"
          hint="Un domaine par ligne. Vide : partout."
        />
        <TextArea label="Sources à exclure" name="excludeDomains" defaultValue={initial.excludeDomains.join("\n")} hint="Un domaine par ligne." />
      </div>
      <div className="max-w-xs">
        <Select
          label="Niveau de détail"
          name="detailLevel"
          defaultValue={initial.detailLevel}
          options={[
            { value: "short", label: "Brèves (1-2 phrases)" },
            { value: "standard", label: "Articles (2-4 phrases)" },
            { value: "detailed", label: "Dossiers (4-6 phrases)" },
          ]}
        />
      </div>
      <div className="rule-hair flex items-center gap-5 pt-6">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        <Link href="/themes" className="link text-base">
          Annuler
        </Link>
      </div>
    </form>
  );
}
