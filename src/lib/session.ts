import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

export async function getSession() {
  // headers() d'abord : rend la page dynamique avant tout accès à la base (build sans DATABASE_URL).
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  return session;
}
