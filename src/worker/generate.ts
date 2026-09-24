import Anthropic from "@anthropic-ai/sdk";
import type { JobWithMetadata, PgBoss } from "pg-boss";
import type { PrismaClient } from "@/generated/prisma/client";
import { DELIVER_QUEUE, type DeliverJob, type GenerateJob } from "@/lib/jobs";
import { PipelineError, TopicRefusedError, toPipelineError } from "@/pipeline/errors";
import { markRunFailed, runDigest, type PipelineDeps } from "@/pipeline/run";

// Handler pg-boss : une erreur réessayable relance le job (deux reprises max), les autres échouent tout de suite.
export async function handleGenerate(
  deps: PipelineDeps & { prisma: PrismaClient; boss?: Pick<PgBoss, "send"> },
  job: JobWithMetadata<GenerateJob>,
) {
  const { runId } = job.data;
  try {
    await runDigest(deps, runId);
    console.log(`[worker] veille ${runId} générée`);
    await enqueueDelivery(deps.prisma, deps.boss, runId);
  } catch (error) {
    const failure = toPipelineError(error);
    const final = !failure.retryable || job.retryCount >= job.retryLimit;
    console.error(`[worker] veille ${runId} en échec${final ? "" : ", nouvelle tentative"} : ${failure.message}`);
    // Trace complète seulement pour une erreur inattendue (les erreurs de l'API ont déjà un message clair).
    if (!(error instanceof PipelineError || error instanceof Anthropic.APIError || error instanceof TopicRefusedError)) console.error(error);
    await markRunFailed(deps.prisma, runId, failure.message, final);
    if (!final) throw failure;
  }
}

// Livraison au webhook, dans sa propre file : un échec d'envoi ne relance pas la génération.
async function enqueueDelivery(prisma: PrismaClient, boss: Pick<PgBoss, "send"> | undefined, runId: string) {
  if (!boss) return;
  const digest = await prisma.digest.findUnique({
    where: { runId },
    select: { id: true, user: { select: { delivery: { select: { active: true } } } } },
  });
  if (!digest?.user.delivery?.active) return;
  await boss.send(DELIVER_QUEUE, { digestId: digest.id } satisfies DeliverJob, { singletonKey: digest.id });
}
