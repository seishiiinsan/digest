import Anthropic from "@anthropic-ai/sdk";
import { describeKeyError } from "@/lib/anthropic-key";

// Erreur du pipeline avec un message lisible par l'utilisateur.
export class PipelineError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "PipelineError";
  }
}

export class TopicRefusedError extends Error {
  constructor(readonly topic: string) {
    super(`Claude a refusé de traiter le thème « ${topic} ».`);
    this.name = "TopicRefusedError";
  }
}

export function toPipelineError(error: unknown): PipelineError {
  if (error instanceof PipelineError) return error;
  if (error instanceof Anthropic.APIError || error instanceof Anthropic.APIConnectionError) {
    const retryable =
      error instanceof Anthropic.APIConnectionError ||
      error instanceof Anthropic.RateLimitError ||
      error instanceof Anthropic.InternalServerError ||
      (error.status !== undefined && error.status >= 500);
    return new PipelineError(describeKeyError(error), retryable);
  }
  return new PipelineError("Erreur interne pendant la génération.", true);
}
