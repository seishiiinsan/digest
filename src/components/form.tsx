import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const control =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";

export function Field({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input className={control} {...input} />
    </label>
  );
}

export function TextArea({ label, hint, ...input }: { label: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <textarea className={control} rows={3} {...input} />
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  options,
  ...select
}: { label: string; options: readonly { value: string; label: string }[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <select className={`${control} bg-white dark:bg-zinc-950`} {...select}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ActionMessage({ state }: { state: { status: string; message?: string } }) {
  if (state.status === "idle" || !state.message) return null;
  return <Message tone={state.status === "error" ? "error" : "success"}>{state.message}</Message>;
}

export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-zinc-200 pt-8 first:border-0 first:pt-0 dark:border-zinc-800">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>}
      </div>
      {children}
    </section>
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
