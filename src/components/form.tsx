import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input
        className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
        {...input}
      />
    </label>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {pending ? "Un instant…" : children}
    </button>
  );
}

export function Message({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const colors =
    tone === "error"
      ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${colors}`}>
      {children}
    </p>
  );
}
