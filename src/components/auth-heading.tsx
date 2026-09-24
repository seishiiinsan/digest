export function AuthHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="kicker text-accent">{kicker}</p>
      <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
    </div>
  );
}
