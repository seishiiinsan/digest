import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserData } from "@/lib/session";
import { updateTopic } from "../actions";
import { TopicForm } from "../topic-form";

export const metadata: Metadata = { title: "Modifier le thème · Digest" };

export default async function EditTopicPage({ params }: PageProps<"/themes/[id]">) {
  const { id } = await params;
  const { data } = await requireUserData();
  const topic = await data.topic(id);
  if (!topic) notFound();

  return (
    <>
      <h1 className="text-2xl font-semibold">Modifier le thème</h1>
      <TopicForm action={updateTopic.bind(null, topic.id)} initial={topic} submitLabel="Enregistrer" />
    </>
  );
}
