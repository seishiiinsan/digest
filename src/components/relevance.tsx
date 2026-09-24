// Pertinence 1 à 5, en pavés d'imprimerie.
export function Relevance({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`Pertinence ${value} sur 5`} title={`Pertinence ${value}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-2 w-2 ${i < value ? "bg-accent" : "border border-ink-3"}`} />
      ))}
    </span>
  );
}
