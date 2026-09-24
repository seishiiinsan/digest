import { getPrisma } from "@/lib/db";

// Insère une veille directement en base pour tester la lecture sans appeler Claude.
export async function seedDigest(email: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const topic = await prisma.topic.create({
    data: { userId: user.id, title: "Front-end", keywords: [], includeDomains: [], excludeDomains: [] },
  });
  const run = await prisma.run.create({ data: { userId: user.id, status: "succeeded", model: "claude-sonnet-5", costUsd: 0.12 } });
  await prisma.digest.create({
    data: {
      runId: run.id,
      userId: user.id,
      language: "fr",
      items: {
        create: [
          {
            topicId: topic.id,
            title: "React 20 sort en version stable",
            category: "release",
            summary: "React 20 stabilise le compilateur et les actions serveur.",
            whyItMatters: "Les projets Next.js en profitent directement.",
            relevance: 5,
            urlHash: `react-${run.id}`,
            sources: { create: [{ url: "https://react.dev/blog/react-20", title: "React 20", domain: "react.dev", citedText: "React 20 is now stable" }] },
          },
          {
            topicId: topic.id,
            title: "Nouvelle propriété CSS anchor-positioning",
            category: "article",
            summary: "Le positionnement par ancre arrive dans tous les navigateurs.",
            whyItMatters: "Moins de JavaScript pour les infobulles.",
            relevance: 3,
            urlHash: `css-${run.id}`,
            sources: { create: [{ url: "https://web.dev/anchor", title: "Anchor positioning", domain: "web.dev" }] },
          },
        ],
      },
    },
  });
}
