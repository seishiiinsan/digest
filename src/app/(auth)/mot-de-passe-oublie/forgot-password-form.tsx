"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, Message, SubmitButton } from "@/components/form";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(undefined);
    const { error } = await authClient.requestPasswordReset({
      email: String(form.get("email")),
      redirectTo: "/reinitialiser",
    });
    setPending(false);
    if (error) return setError(authErrorMessage(error));
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Mot de passe oublié</h1>
      {sent ? (
        // Même réponse que l'adresse existe ou non.
        <Message tone="success">Si un compte existe pour cette adresse, un lien valable 30 minutes vient d&apos;être envoyé.</Message>
      ) : (
        <>
          {error && <Message tone="error">{error}</Message>}
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <SubmitButton pending={pending}>Envoyer le lien</SubmitButton>
        </>
      )}
      <Link href="/connexion" className="text-sm text-zinc-500 underline underline-offset-4">
        Retour à la connexion
      </Link>
    </form>
  );
}
