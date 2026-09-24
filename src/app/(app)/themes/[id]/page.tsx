import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/form";
import { requireUserData } from "@/lib/session";
import { updateTopic } from "../actions";
import { TopicForm } from "../topic-form";

export const metadata: Metadata = { title: "Modifier la rubrique · Digest" };

export default async function EditTopicPage({ params }: PageProps<"/themes/[id]">) {
  const { id } = await params;
  const { data } = await requireUserData();
  const topic = await data.topic(id);
  if (!topic) notFound();

  return (
    <>
      <PageHeader kicker="Modifier la rubrique" title={topic.title} />
      <TopicForm action={updateTopic.bind(null, topic.id)} initial={topic} submitLabel="Enregistrer" />
    </>
  );
}
