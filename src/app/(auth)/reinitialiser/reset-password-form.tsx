"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthHeading } from "@/components/auth-heading";
import { Field, Message, SubmitButton } from "@/components/form";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password"));
    if (newPassword !== form.get("confirm")) return setError("Les deux mots de passe ne correspondent pas.");

    setPending(true);
    setError(undefined);
    const { error } = await authClient.resetPassword({ newPassword, token });
    if (error) {
      setPending(false);
      return setError(authErrorMessage(error));
    }
    router.replace("/connexion?reinitialise=1");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <AuthHeading kicker="Nouveau mot de passe" title="Choisissez-en un solide." />
      {error && <Message tone="error">{error}</Message>}
      <Field
        label={`Nouveau mot de passe (${MIN_PASSWORD_LENGTH} caractères minimum)`}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <Field label="Confirmation" name="confirm" type="password" autoComplete="new-password" required />
      <div>
        <SubmitButton pending={pending}>Enregistrer</SubmitButton>
      </div>
    </form>
  );
}
