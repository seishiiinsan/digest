"use client";

import { useActionState } from "react";
import { generateNow } from "@/app/(app)/executions/actions";
import { ActionMessage, SubmitButton } from "@/components/form";
import { idle } from "@/lib/action-state";

export function GenerateButton() {
  const [state, action, pending] = useActionState(generateNow, idle);
  return (
    <form action={action} className="flex flex-col gap-3">
      <ActionMessage state={state} />
      <div>
        <SubmitButton pending={pending} className="px-6 py-3.5 text-[0.85rem]">
          Générer maintenant
        </SubmitButton>
      </div>
    </form>
  );
}
