"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionState } from "@/lib/action-state";
import { checkApiKey } from "@/lib/anthropic-key";
import { DeliveryError, payloadsFor, sendWebhook } from "@/lib/delivery";
import { isLanguage } from "@/lib/languages";
import { isModelId } from "@/lib/models";
import { isValidTimeZone } from "@/lib/schedule";
import { requireUserData } from "@/lib/session";
import { parseWebhookUrl } from "@/lib/webhook";

function done(message: string): ActionState {
  revalidatePath("/reglages");
  revalidatePath("/tableau");
  return ok(message);
}

export async function saveApiKey(_: ActionState, form: FormData): Promise<ActionState> {
  const { data } = await requireUserData();
  const apiKey = String(form.get("apiKey") ?? "").trim();
  const model = String(form.get("model") ?? "");
  if (!isModelId(model)) return fail("Modèle inconnu.");

  if (!apiKey) {
    // Pas de nouvelle clé : on change seulement le modèle de la clé existante.
    const { count } = await data.setModel(model);
    return count ? done("Modèle enregistré.") : fail("Collez votre clé API Anthropic.");
  }

  const check = await checkApiKey(apiKey, model);
  if (!check.ok) return fail(check.message);
  await data.saveApiKey(apiKey, model);
  return done("Clé vérifiée et enregistrée, chiffrée.");
}

export async function deleteApiKey(): Promise<ActionState> {
  const { data } = await requireUserData();
  await data.deleteApiKey();
  return done("Clé supprimée.");
}

export async function savePreferences(_: ActionState, form: FormData): Promise<ActionState> {
  const { data } = await requireUserData();
  const locale = String(form.get("locale") ?? "");
  const timezone = String(form.get("timezone") ?? "");
  if (!isLanguage(locale)) return fail("Langue inconnue.");
  if (!isValidTimeZone(timezone)) return fail("Fuseau horaire inconnu.");
  await data.updatePreferences({ locale, timezone });
  return done("Préférences enregistrées.");
}

const scheduleSchema = z
  .object({
    frequency: z.enum(["daily", "weekly"]),
    weekday: z.coerce.number().int().min(0).max(6),
    hour: z.coerce.number().int().min(0).max(23),
    paused: z.boolean(),
  })
  .transform((value) => ({ ...value, weekday: value.frequency === "weekly" ? value.weekday : null }));

export async function saveSchedule(_: ActionState, form: FormData): Promise<ActionState> {
  const { data } = await requireUserData();
  const parsed = scheduleSchema.safeParse({
    frequency: form.get("frequency"),
    weekday: form.get("weekday") ?? 1,
    hour: form.get("hour"),
    paused: form.get("paused") === "on",
  });
  if (!parsed.success) return fail("Planning invalide.");
  await data.saveSchedule(parsed.data);
  return done("Planning enregistré.");
}

function maskWebhook(url: string): string {
  const { hostname, pathname } = new URL(url);
  return `${hostname}${pathname.slice(0, pathname.lastIndexOf("/") + 1)}…${url.slice(-4)}`;
}

export async function saveDelivery(_: ActionState, form: FormData): Promise<ActionState> {
  const { data } = await requireUserData();
  const url = String(form.get("webhookUrl") ?? "").trim();
  const kind = parseWebhookUrl(url);
  if (!kind) return fail("URL non reconnue : collez un webhook Discord (discord.com/api/webhooks/…) ou Slack (hooks.slack.com/services/…).");
  await data.saveDelivery(url, kind, maskWebhook(url));
  return done(`Webhook ${kind === "discord" ? "Discord" : "Slack"} enregistré.`);
}

export async function deleteDelivery(): Promise<ActionState> {
  const { data } = await requireUserData();
  await data.deleteDelivery();
  return done("Webhook supprimé.");
}

export async function testDelivery(): Promise<ActionState> {
  const { data } = await requireUserData();
  const target = await data.deliveryTarget();
  if (!target) return fail("Aucun webhook enregistré.");
  const message = {
    heading: "Digest : message de test",
    digestUrl: process.env.APP_URL ?? "http://localhost:3000",
    items: [],
  };
  try {
    await sendWebhook(target.url, target.kind, payloadsFor(target.kind, message));
  } catch (error) {
    return fail(error instanceof DeliveryError ? error.message : "Envoi impossible.");
  }
  return ok("Message de test envoyé.");
}
