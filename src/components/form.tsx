import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

function Label({ children }: { children: ReactNode }) {
  return <span className="kicker text-ink-2">{children}</span>;
}

export function Field({ label, hint, ...input }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <Label>{label}</Label>
      <input className="field" {...input} />
      {hint && <span className="text-sm italic text-ink-3">{hint}</span>}
    </label>
  );
}

export function TextArea({ label, hint, ...input }: { label: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <textarea className="field-box" rows={3} {...input} />
      {hint && <span className="text-sm italic text-ink-3">{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  options,
  ...select
}: { label: string; options: readonly { value: string; label: string }[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1">
      <Label>{label}</Label>
      <select className="field" {...select}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Checkbox({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-base">
      <input type="checkbox" className="checkbox" {...input} />
      {label}
    </label>
  );
}

export function SubmitButton({ pending, children, className = "" }: { pending: boolean; children: ReactNode; className?: string }) {
  return (
    <button type="submit" disabled={pending} className={`btn ${className}`}>
      {pending ? "Un instant…" : children}
    </button>
  );
}

export function Message({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const error = tone === "error";
  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 border-l-4 bg-paper-2 px-4 py-3 ${error ? "border-accent" : "border-ok"}`}>
      <span aria-hidden className={`kicker ${error ? "text-accent" : "text-ok"}`}>
        {error ? "Erratum" : "Bon à tirer"}
      </span>
      <p role={error ? "alert" : "status"} className="text-base">
        {children}
      </p>
    </div>
  );
}

export function ActionMessage({ state }: { state: { status: string; message?: string } }) {
  if (state.status === "idle" || !state.message) return null;
  return <Message tone={state.status === "error" ? "error" : "success"}>{state.message}</Message>;
}

// Section de page à la manière d'une rubrique : numéro et titre en marge, contenu à droite.
export function Section({
  number,
  title,
  description,
  children,
}: {
  number?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rule-hair grid gap-6 pt-8 md:grid-cols-[14rem_1fr] md:gap-10">
      <div className="flex flex-col gap-2">
        {number && <span className="font-display text-3xl italic text-accent">{number}</span>}
        <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
        {description && <p className="text-base leading-snug text-ink-2">{description}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </section>
  );
}

// En-tête de page : surtitre en capitales, grand titre, chapeau.
export function PageHeader({ kicker, title, children }: { kicker: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3">
      <p className="kicker text-accent">{kicker}</p>
      <h1 className="text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl">{title}</h1>
      {children && <div className="max-w-2xl text-lg leading-snug text-ink-2">{children}</div>}
    </header>
  );
}
