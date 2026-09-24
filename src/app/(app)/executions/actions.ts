"use server";

import { redirect } from "next/navigation";
import { fail, type ActionState } from "@/lib/action-state";
import { getPrisma } from "@/lib/db";
import { getSenderBoss } from "@/lib/jobs";
import { startRun } from "@/lib/runs";
import { requireSession, requireUserData } from "@/lib/session";

export async function generateNow(): Promise<ActionState> {
  const { user } = await requireSession();
  const result = await startRun(getPrisma(), await getSenderBoss(), user.id, "manual");
  if (!result.ok) return fail(result.message);
  redirect(`/executions/${result.runId}`);
}

export interface RunProgress {
  status: "queued" | "running" | "succeeded" | "failed";
  topicsDone: number;
  topicsTotal: number;
  error: string | null;
  digestId: string | null;
}

export async function getRunProgress(id: string): Promise<RunProgress | null> {
  const { data } = await requireUserData();
  const run = await data.run(id);
  if (!run) return null;
  return { status: run.status, topicsDone: run.topicsDone, topicsTotal: run.topicsTotal, error: run.error, digestId: run.digest?.id ?? null };
}
