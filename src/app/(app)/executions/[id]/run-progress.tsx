"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Message } from "@/components/form";
import { getRunProgress, type RunProgress } from "../actions";

// Suit la génération thème par thème, puis rafraîchit la page à la fin.
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

  if (progress.status === "failed") return <Message tone="error">{progress.error ?? "La génération a échoué."}</Message>;
  if (progress.status === "succeeded") {
    return (
      <div className="flex flex-col gap-3">
        <Message tone="success">Veille générée.</Message>
        {progress.error && <Message tone="error">{progress.error}</Message>}
        {progress.digestId && (
          <Link href={`/veilles/${progress.digestId}`} className="text-sm underline underline-offset-4">
            Lire la veille
          </Link>
        )}
      </div>
    );
  }

  const percent = progress.topicsTotal ? Math.round((progress.topicsDone / progress.topicsTotal) * 100) : 0;
  return (
    <div className="flex flex-col gap-2" role="status" data-testid="run-progress">
      <p className="text-sm">
        {progress.status === "queued"
          ? progress.error ?? "En attente du worker…"
          : `Thème ${Math.min(progress.topicsDone + 1, progress.topicsTotal)} sur ${progress.topicsTotal} : recherche et synthèse…`}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full bg-zinc-900 transition-all dark:bg-zinc-100" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
