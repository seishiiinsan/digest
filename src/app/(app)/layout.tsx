import { Nav } from "@/components/nav";
import { isAdmin } from "@/lib/instance";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireSession();
  return (
    <>
      <Nav email={user.email} admin={isAdmin(user.email)} />
      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">{children}</main>
      {/* AGPL : le code source doit rester accessible aux utilisateurs du service. */}
      <footer className="mx-auto max-w-3xl px-6 pb-10 text-xs text-zinc-500">
        Digest est un logiciel libre sous licence AGPL-3.0 ·{" "}
        <a href="https://github.com/seishiiinsan/digest" className="underline underline-offset-4">
          code source
        </a>
      </footer>
    </>
  );
}
