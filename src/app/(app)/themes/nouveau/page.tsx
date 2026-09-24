import type { Metadata } from "next";
import { PageHeader } from "@/components/form";
import { createTopic } from "../actions";
import { TopicForm } from "../topic-form";

export const metadata: Metadata = { title: "Nouvelle rubrique · Digest" };

export default function NewTopicPage() {
  return (
    <>
      <PageHeader kicker="Nouvelle rubrique" title="Qu'est-ce qu'on suit ?">
        Décrivez le sujet comme à un journaliste : Claude s&apos;en sert pour chercher, trier et résumer.
      </PageHeader>
      <TopicForm action={createTopic} submitLabel="Créer la rubrique" />
    </>
  );
}
