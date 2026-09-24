"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Message, SubmitButton } from "@/components/form";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

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
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => signOut(false)}>
          Se déconnecter
        </button>
        <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => signOut(true)}>
          Déconnecter tous les appareils
        </button>
      </div>

      <form onSubmit={deleteAccount} className="flex flex-col gap-4 border border-dashed border-ink-3 p-5">
        <p className="kicker text-accent">Supprimer le compte</p>
        <p className="text-base text-ink-2">Votre compte, votre clé API, vos rubriques et toutes vos éditions seront effacés. Irréversible.</p>
        {error && <Message tone="error">{error}</Message>}
        <div className="max-w-sm">
          <Field label="Mot de passe" name="password" type="password" autoComplete="current-password" required />
        </div>
        <div>
          <SubmitButton pending={pending} className="btn-ghost btn-danger">
            Supprimer mon compte
          </SubmitButton>
        </div>
      </form>
    </>
  );
}
