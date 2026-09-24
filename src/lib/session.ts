import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { userData } from "@/lib/user-data";

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

export async function requireUserData() {
  const session = await requireSession();
  return { session, data: userData(getPrisma(), session.user.id) };
}
