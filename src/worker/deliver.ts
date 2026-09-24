import type { JobWithMetadata } from "pg-boss";
import type { PrismaClient } from "@/generated/prisma/client";
import { decrypt } from "@/lib/crypto";
import { DeliveryError, payloadsFor, sendWebhook, type DigestMessage } from "@/lib/delivery";
import { CATEGORY_LABEL, formatDateTime } from "@/lib/format";
import type { DeliverJob } from "@/lib/jobs";

export interface DeliverDeps {
  prisma: PrismaClient;
  fetchImpl?: typeof fetch;
  appUrl?: string;
}

// Envoie une veille au webhook Discord ou Slack du compte. Un échec n'affecte pas la veille elle-même.
export async function handleDeliver(
  { prisma, fetchImpl = fetch, appUrl = process.env.APP_URL ?? "http://localhost:3000" }: DeliverDeps,
  job: JobWithMetadata<DeliverJob>,
) {
  const digest = await prisma.digest.findUnique({
    where: { id: job.data.digestId },
    include: {
      user: { select: { timezone: true, delivery: true } },
      items: {
        orderBy: [{ relevance: "desc" }, { createdAt: "asc" }],
        include: { topic: { select: { title: true } }, sources: { take: 1 } },
      },
    },
  });
  const delivery = digest?.user.delivery;
  if (!digest || digest.deliveredAt || !delivery?.active) return;

  const message: DigestMessage = {
    heading: `Veille du ${formatDateTime(digest.createdAt, digest.user.timezone)}`,
    digestUrl: `${appUrl.replace(/\/$/, "")}/veilles/${digest.id}`,
    items: digest.items
      .filter((item) => item.sources.length > 0)
      .map((item) => ({
        title: item.title,
        summary: item.summary,
        category: CATEGORY_LABEL[item.category],
        topic: item.topic?.title ?? null,
        url: item.sources[0].url,
        domain: item.sources[0].domain,
      })),
  };

  try {
    const url = decrypt({ ciphertext: delivery.urlCiphertext, iv: delivery.urlIv, authTag: delivery.urlAuthTag });
    await sendWebhook(url, delivery.kind, payloadsFor(delivery.kind, message), fetchImpl);
    await prisma.digest.update({ where: { id: digest.id }, data: { deliveredAt: new Date(), deliveryError: null } });
    console.log(`[worker] veille ${digest.id} envoyée sur ${delivery.kind}`);
  } catch (error) {
    const failure = error instanceof DeliveryError ? error : new DeliveryError("Envoi du webhook impossible.", true);
    const final = !failure.retryable || job.retryCount >= job.retryLimit;
    await prisma.digest.update({ where: { id: digest.id }, data: { deliveryError: failure.message } });
    console.error(`[worker] envoi de la veille ${digest.id} en échec : ${failure.message}`);
    if (!final) throw failure;
  }
}
