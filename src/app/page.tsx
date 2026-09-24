const features = [
  {
    title: "Vos thèmes",
    text: "Un framework, un langage, un concurrent : décrivez ce que vous suivez, avec vos mots-clés et vos sources.",
  },
  {
    title: "Chaque info sourcée",
    text: "Résumé, pourquoi c'est important, et les liens réels qui l'appuient. Rien d'inventé, rien en double.",
  },
  {
    title: "Votre clé, votre coût",
    text: "Chaque compte branche sa clé Anthropic, chiffrée au repos. Le coût de chaque veille est affiché.",
  },
];

const steps = ["Créez un compte", "Ajoutez votre clé Anthropic", "Choisissez vos thèmes", "Recevez votre veille"];

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-16 px-6 py-20">
      <header className="flex flex-col gap-6">
        <p className="font-mono text-sm text-zinc-500">digest · open source · auto-hébergeable</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Votre veille techno, résumée et sourcée chaque matin.
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Digest remplace les newsletters et flux RSS par une synthèse courte de vos sujets, rédigée par Claude
          dans votre langue, livrée dans l&apos;app, sur Discord ou sur Slack.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="font-medium">{feature.title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{feature.text}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Comment ça marche</h2>
        <ol className="grid gap-3 sm:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step} className="flex items-baseline gap-2 text-sm">
              <span className="font-mono text-zinc-400">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
        En construction.{" "}
        <a className="underline underline-offset-4" href="https://github.com/seishiiinsan/digest">
          Code source sur GitHub
        </a>
      </footer>
    </main>
  );
}
