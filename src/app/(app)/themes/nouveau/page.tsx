import type { Metadata } from "next";
import { createTopic } from "../actions";
import { TopicForm } from "../topic-form";

export const metadata: Metadata = { title: "Nouveau thème · Digest" };

export default function NewTopicPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Nouveau thème</h1>
      <TopicForm action={createTopic} submitLabel="Créer le thème" />
    </>
  );
}
