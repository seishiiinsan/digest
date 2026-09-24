import { Nav } from "@/components/nav";
import { isAdmin } from "@/lib/instance";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireSession();
  return (
    <>
      <Nav email={user.email} admin={isAdmin(user.email)} />
      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">{children}</main>
    </>
  );
}
