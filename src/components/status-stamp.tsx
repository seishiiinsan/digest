import { RUN_STATUS_LABEL } from "@/lib/format";

const COLOR = { queued: "text-ink-3", running: "text-ink", succeeded: "text-ok", failed: "text-accent" } as const;

export function StatusStamp({ status }: { status: keyof typeof RUN_STATUS_LABEL }) {
  return <span className={`stamp ${COLOR[status]} ${status === "failed" ? "-rotate-2" : ""}`}>{RUN_STATUS_LABEL[status]}</span>;
}
