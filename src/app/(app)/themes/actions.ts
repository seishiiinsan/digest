"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fail, type ActionState } from "@/lib/action-state";
import { requireUserData } from "@/lib/session";
import { TOPIC_TEMPLATES } from "@/lib/topic-templates";
import { topicFromForm } from "@/lib/topic-input";

const MAX_TOPICS = 20;

function refresh() {
  revalidatePath("/themes");
  revalidatePath("/tableau");
}

export async function createTopic(_: ActionState, form: FormData): Promise<ActionState> {
  const { data } = await requireUserData();
  const parsed = topicFromForm(form);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  if ((await data.topics()).length >= MAX_TOPICS) return fail(`${MAX_TOPICS} thèmes maximum.`);
  await data.createTopic(parsed.data);
  refresh();
  redirect("/themes");
}

export async function updateTopic(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { data } = await requireUserData();
  const parsed = topicFromForm(form);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { count } = await data.updateTopic(id, parsed.data);
  if (!count) return fail("Thème introuvable.");
  refresh();
  redirect("/themes");
}

export async function setTopicActive(id: string, active: boolean) {
  const { data } = await requireUserData();
  await data.setTopicActive(id, active);
  refresh();
}

export async function deleteTopic(id: string) {
  const { data } = await requireUserData();
  await data.deleteTopic(id);
  refresh();
}

export async function createFromTemplate(slug: string) {
  const { data } = await requireUserData();
  const template = TOPIC_TEMPLATES.find((t) => t.slug === slug);
  if (!template) return;
  if ((await data.topics()).length >= MAX_TOPICS) return;
  const { title, description, keywords, includeDomains } = template;
  await data.createTopic({ title, description, keywords, includeDomains, excludeDomains: [], detailLevel: "standard" });
  refresh();
}
