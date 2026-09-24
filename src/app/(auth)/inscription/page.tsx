import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signupEnabled } from "@/lib/instance";
import { getSession } from "@/lib/session";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Créer un compte · Digest" };

export default async function SignUpPage() {
  if (await getSession()) redirect("/tableau");
  if (!signupEnabled()) {
    return (
      <section className="flex flex-col gap-4">
        <p className="kicker text-accent">Abonnements clos</p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight">Inscriptions fermées</h1>
        <p className="text-lg text-ink-2">
          Cette instance n&apos;accepte pas de nouveaux comptes. Digest est open source : vous pouvez héberger la vôtre.
        </p>
      </section>
    );
  }
  return <SignUpForm />;
}
