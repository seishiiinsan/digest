import { z } from "zod";

export function parseList(value: string, max = 20): string[] {
  const items = value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set(items)].slice(0, max);
}

// « https://www.React.dev/blog » → « react.dev ». Renvoie null si ce n'est pas un nom de domaine.
export function normalizeDomain(value: string): string | null {
  const raw = value.trim().toLowerCase();
  if (!raw) return null;
  let host: string;
  try {
    host = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname;
  } catch {
    return null;
  }
  host = host.replace(/^www\./, "");
  return /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(host) ? host : null;
}

const domainList = z.string().transform((value, ctx) => {
  const domains: string[] = [];
  for (const item of parseList(value, 30)) {
    const domain = normalizeDomain(item);
    if (!domain) {
      ctx.addIssue({ code: "custom", message: `Domaine invalide : ${item}` });
      return z.NEVER;
    }
    domains.push(domain);
  }
  return [...new Set(domains)];
});

export const topicSchema = z.object({
  title: z.string().trim().min(1, "Donnez un titre au thème.").max(80, "Titre trop long (80 caractères max)."),
  description: z.string().trim().max(1000, "Description trop longue (1000 caractères max)."),
  keywords: z.string().transform((value) => parseList(value)),
  includeDomains: domainList,
  excludeDomains: domainList,
  detailLevel: z.enum(["short", "standard", "detailed"]),
});

export function topicFromForm(form: FormData) {
  return topicSchema.safeParse({
    title: form.get("title") ?? "",
    description: form.get("description") ?? "",
    keywords: form.get("keywords") ?? "",
    includeDomains: form.get("includeDomains") ?? "",
    excludeDomains: form.get("excludeDomains") ?? "",
    detailLevel: form.get("detailLevel") ?? "standard",
  });
}
