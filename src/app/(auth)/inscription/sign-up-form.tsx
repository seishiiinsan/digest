"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, Message, SubmitButton } from "@/components/form";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

export function SignUpForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    if (password !== form.get("confirm")) return setError("Les deux mots de passe ne correspondent pas.");

    setPending(true);
    setError(undefined);
    const { error } = await authClient.signUp.email({ email, password, name: "", callbackURL: "/tableau" });
    setPending(false);
    if (error) return setError(authErrorMessage(error));
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Vérifiez votre boîte mail</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Un lien de confirmation a été envoyé à <strong>{sentTo}</strong>. Il active votre compte et vous connecte.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Créer un compte</h1>
      {error && <Message tone="error">{error}</Message>}
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label={`Mot de passe (${MIN_PASSWORD_LENGTH} caractères minimum)`}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <Field label="Confirmation" name="confirm" type="password" autoComplete="new-password" required />
      <SubmitButton pending={pending}>Créer mon compte</SubmitButton>
      <p className="text-sm text-zinc-500">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
