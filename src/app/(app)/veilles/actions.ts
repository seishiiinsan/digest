"use server";

import { revalidatePath } from "next/cache";
import { requireUserData } from "@/lib/session";

export async function toggleStar(itemId: string, starred: boolean) {
  const { data } = await requireUserData();
  await data.setStarred(itemId, starred);
  revalidatePath("/veilles", "layout");
}

export async function rate(itemId: string, feedback: "useful" | "not_useful" | null) {
  const { data } = await requireUserData();
  await data.setFeedback(itemId, feedback);
  revalidatePath("/veilles", "layout");
}
