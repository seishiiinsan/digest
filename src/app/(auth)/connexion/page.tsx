import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Connexion · Digest" };

export default async function SignInPage({ searchParams }: PageProps<"/connexion">) {
  if (await getSession()) redirect("/tableau");
  const { reinitialise } = await searchParams;
  return <SignInForm passwordReset={reinitialise === "1"} />;
}
