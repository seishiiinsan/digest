import { Colophon } from "@/components/colophon";
import { Masthead } from "@/components/masthead";
import { formatLongDate } from "@/lib/format";
import { isAdmin } from "@/lib/instance";
import { requireUserData } from "@/lib/session";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { session, data } = await requireUserData();
  const profile = await data.profile();
  const dateline = `Édition du ${formatLongDate(new Date(), profile.timezone)}`;

  return (
    <div className="flex min-h-dvh flex-col">
      <Masthead email={session.user.email} dateline={dateline} admin={isAdmin(session.user.email)} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-5 py-10 sm:px-8">{children}</main>
      <Colophon />
    </div>
  );
}
