-- AlterTable
ALTER TABLE "Digest" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryError" TEXT;


-- Recherche plein texte sur les infos (config « simple » : veilles multilingues).
-- La requête de recherche doit reprendre exactement cette expression pour utiliser l'index.
CREATE INDEX "Item_search_idx" ON "Item" USING GIN (to_tsvector('simple', "title" || ' ' || "summary" || ' ' || "whyItMatters"));
