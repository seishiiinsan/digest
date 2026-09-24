import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Créer un compte · Digest" };

export default async function SignUpPage() {
  if (await getSession()) redirect("/tableau");
  return <SignUpForm />;
}
