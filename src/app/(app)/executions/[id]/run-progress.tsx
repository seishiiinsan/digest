"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Message } from "@/components/form";
import { getRunProgress, type RunProgress } from "../actions";

// Suit l'impression rubrique par rubrique, puis rafraîchit la page à la fin.
export function RunProgressView({ runId, initial }: { runId: string; initial: RunProgress }) {
  const router = useRouter();
  const [progress, setProgress] = useState(initial);
  const finished = progress.status === "succeeded" || progress.status === "failed";

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(async () => {
      const next = await getRunProgress(runId);
      if (!next) return;
      setProgress(next);
      if (next.status === "succeeded" || next.status === "failed") router.refresh();
    }, 2000);
    return () => clearInterval(timer);
  }, [finished, runId, router]);

  if (progress.status === "failed") return <Message tone="error">{progress.error ?? "L'impression a échoué."}</Message>;
  if (progress.status === "succeeded") {
    return (
      <div className="flex flex-col gap-4">
        <Message tone="success">Édition imprimée.</Message>
        {progress.error && <Message tone="error">{progress.error}</Message>}
        {progress.digestId && (
          <Link href={`/veilles/${progress.digestId}`} className="btn self-start">
            Lire l&apos;édition
          </Link>
        )}
      </div>
    );
  }

  const total = Math.max(progress.topicsTotal, 1);
  return (
    <div className="flex flex-col gap-4" role="status" data-testid="run-progress">
      <p className="font-display text-2xl italic">
        {progress.status === "queued"
          ? (progress.error ?? "En attente de la rotative…")
          : `Rubrique ${Math.min(progress.topicsDone + 1, progress.topicsTotal)} sur ${progress.topicsTotal} : recherche, vérification, rédaction…`}
      </p>
      {/* Une case par rubrique, qui s'encre une fois imprimée. */}
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-3 flex-1 border-2 border-ink ${
              i < progress.topicsDone ? "bg-ink" : i === progress.topicsDone && progress.status === "running" ? "animate-pulse bg-accent" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}
