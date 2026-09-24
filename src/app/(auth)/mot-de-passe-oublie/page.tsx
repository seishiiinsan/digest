import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié · Digest" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
