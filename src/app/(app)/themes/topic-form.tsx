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
    <form action={formAction} className="flex flex-col gap-4">
      <ActionMessage state={state} />
      <Field label="Titre" name="title" defaultValue={initial.title} maxLength={80} required />
      <TextArea
        label="Description"
        name="description"
        defaultValue={initial.description}
        placeholder="Nouveautés Next.js et React Server Components"
        hint="Ce que vous voulez suivre, en langage naturel."
      />
      <Field label="Mots-clés (séparés par des virgules)" name="keywords" defaultValue={initial.keywords.join(", ")} />
      <TextArea
        label="Sources à privilégier"
        name="includeDomains"
        defaultValue={initial.includeDomains.join("\n")}
        placeholder="nextjs.org"
        hint="Un domaine par ligne. Laisser vide pour chercher partout."
      />
      <TextArea
        label="Sources à exclure"
        name="excludeDomains"
        defaultValue={initial.excludeDomains.join("\n")}
        hint="Un domaine par ligne."
      />
      <Select
        label="Niveau de détail"
        name="detailLevel"
        defaultValue={initial.detailLevel}
        options={[
          { value: "short", label: "Court" },
          { value: "standard", label: "Standard" },
          { value: "detailed", label: "Détaillé" },
        ]}
      />
      <div className="flex items-center gap-4">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        <Link href="/themes" className="text-sm text-zinc-500 underline underline-offset-4">
          Annuler
        </Link>
      </div>
    </form>
  );
}
