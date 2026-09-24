"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Connexion</h1>
      {passwordReset && !error && <Message tone="success">Mot de passe modifié. Vous pouvez vous connecter.</Message>}
      {error && <Message tone="error">{error}</Message>}
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Mot de passe" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton pending={pending}>Se connecter</SubmitButton>
      <div className="flex justify-between text-sm text-zinc-500">
        <Link href="/mot-de-passe-oublie" className="underline underline-offset-4">
          Mot de passe oublié
        </Link>
        <Link href="/inscription" className="underline underline-offset-4">
          Créer un compte
        </Link>
      </div>
    </form>
  );
}
