import type { AdminKit, AdminKitPayload } from "@/lib/server/admin-kits";

/**
 * O rascunho carrega apenas a referência do brinde e a quantidade daquele
 * vínculo. Os atributos físicos vivem no catálogo e são lidos de lá.
 */
export type KitDraft = AdminKitPayload & {
  id?: number;
  imageUrl: string;
  invalidDimensionFields: Array<"length" | "width" | "height">;
};

export type KitStatus = AdminKit["status"];
