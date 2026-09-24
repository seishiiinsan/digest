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
        <h1 className="text-2xl font-semibold">Inscriptions fermées</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Cette instance n&apos;accepte pas de nouveaux comptes. Digest est open source : vous pouvez héberger la vôtre.
        </p>
      </section>
    );
  }
  return <SignUpForm />;
}
