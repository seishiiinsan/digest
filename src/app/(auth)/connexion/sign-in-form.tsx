"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthHeading } from "@/components/auth-heading";
import { Field, Message, SubmitButton } from "@/components/form";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export function SignInForm({ passwordReset }: { passwordReset: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(undefined);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      callbackURL: "/tableau",
    });
    if (error) {
      setPending(false);
      return setError(authErrorMessage(error));
    }
    router.replace("/tableau");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <AuthHeading kicker="Accès abonné" title="Votre édition vous attend." />
      {passwordReset && !error && <Message tone="success">Mot de passe modifié. Vous pouvez vous connecter.</Message>}
      {error && <Message tone="error">{error}</Message>}
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Mot de passe" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton pending={pending}>Se connecter</SubmitButton>
      <div className="flex flex-wrap justify-between gap-3 text-base text-ink-2">
        <Link href="/mot-de-passe-oublie" className="link">
          Mot de passe oublié
        </Link>
        <Link href="/inscription" className="link">
          Créer un compte
        </Link>
      </div>
    </form>
  );
}
