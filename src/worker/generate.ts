import Anthropic from "@anthropic-ai/sdk";
import type { JobWithMetadata } from "pg-boss";
import type { PrismaClient } from "@/generated/prisma/client";
import type { GenerateJob } from "@/lib/jobs";
import { PipelineError, TopicRefusedError, toPipelineError } from "@/pipeline/errors";
import { markRunFailed, runDigest, type PipelineDeps } from "@/pipeline/run";

// Handler pg-boss : une erreur réessayable relance le job (deux reprises max), les autres échouent tout de suite.
export async function handleGenerate(deps: PipelineDeps & { prisma: PrismaClient }, job: JobWithMetadata<GenerateJob>) {
  const { runId } = job.data;
  try {
    await runDigest(deps, runId);
    console.log(`[worker] veille ${runId} générée`);
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
