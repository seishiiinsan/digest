// Re-chiffre les clés API et webhooks avec une nouvelle clé maître.
// Usage : OLD_ENCRYPTION_KEY=<ancienne> ENCRYPTION_KEY=<nouvelle> pnpm rotate-key
// Puis redémarrer web et worker avec la nouvelle ENCRYPTION_KEY.
import { decrypt, encrypt, parseMasterKey } from "@/lib/crypto";
import { getPrisma } from "@/lib/db";

const oldKey = parseMasterKey(process.env.OLD_ENCRYPTION_KEY);
const newKey = parseMasterKey(process.env.ENCRYPTION_KEY);
const prisma = getPrisma();

await prisma.$transaction(async (tx) => {
  const apiKeys = await tx.apiKey.findMany();
  for (const row of apiKeys) {
    await tx.apiKey.update({ where: { id: row.id }, data: encrypt(decrypt(row, oldKey), newKey) });
  }

  const deliveries = await tx.delivery.findMany();
  for (const row of deliveries) {
    const url = decrypt({ ciphertext: row.urlCiphertext, iv: row.urlIv, authTag: row.urlAuthTag }, oldKey);
    const encrypted = encrypt(url, newKey);
    await tx.delivery.update({
      where: { id: row.id },
      data: { urlCiphertext: encrypted.ciphertext, urlIv: encrypted.iv, urlAuthTag: encrypted.authTag },
    });
  }

  console.log(`${apiKeys.length} clé(s) API et ${deliveries.length} webhook(s) re-chiffrés.`);
});
await prisma.$disconnect();
