"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthHeading } from "@/components/auth-heading";
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
        <p className="kicker text-accent">Bulletin reçu</p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight">Vérifiez votre boîte mail</h1>
        <p className="text-lg text-ink-2">
          Un lien de confirmation a été envoyé à <strong className="text-ink">{sentTo}</strong>. Il active votre abonnement et vous
          connecte.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <AuthHeading kicker="Bulletin d'abonnement" title="Votre journal, vos rubriques." />
      <p className="-mt-2 text-base text-ink-2">Gratuit : chaque compte paie ses propres appels Claude avec sa clé Anthropic.</p>
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
      <p className="text-base text-ink-2">
        Déjà abonné ?{" "}
        <Link href="/connexion" className="link">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
