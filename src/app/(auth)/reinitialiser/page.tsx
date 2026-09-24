import type { Metadata } from "next";
import Link from "next/link";
import { Message } from "@/components/form";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe · Digest" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reinitialiser">) {
  const { token, error } = await searchParams;

  if (typeof token !== "string" || error) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Lien expiré</h1>
        <Message tone="error">Ce lien est invalide ou a expiré. Faites une nouvelle demande.</Message>
        <Link href="/mot-de-passe-oublie" className="text-sm underline underline-offset-4">
          Recevoir un nouveau lien
        </Link>
      </section>
    );
  }

  return <ResetPasswordForm token={token} />;
}
