"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Message, SubmitButton } from "@/components/form";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

const secondary = "rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700";

export function AccountActions() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function signOut(everywhere: boolean) {
    setPending(true);
    if (everywhere) await authClient.revokeSessions();
    await authClient.signOut();
    router.replace("/connexion");
    router.refresh();
  }

  async function deleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!confirm("Supprimer définitivement votre compte et toutes vos données ?")) return;
    setPending(true);
    setError(undefined);
    const { error } = await authClient.deleteUser({ password: String(form.get("password")) });
    if (error) {
      setPending(false);
      return setError(authErrorMessage(error));
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Sessions</h2>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={secondary} disabled={pending} onClick={() => signOut(false)}>
            Se déconnecter
          </button>
          <button type="button" className={secondary} disabled={pending} onClick={() => signOut(true)}>
            Déconnecter tous les appareils
          </button>
        </div>
      </section>

      <form onSubmit={deleteAccount} className="flex flex-col gap-3 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="font-medium">Supprimer le compte</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Supprime votre compte, votre clé API, vos thèmes et toutes vos veilles. Irréversible.
        </p>
        {error && <Message tone="error">{error}</Message>}
        <Field label="Mot de passe" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton pending={pending}>Supprimer mon compte</SubmitButton>
      </form>
    </>
  );
}
