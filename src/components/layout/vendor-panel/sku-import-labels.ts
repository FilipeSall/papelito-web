import type {
  SkuImportResultStatus,
  SkuImportStatus,
} from "@/features/vendor-sku-import/types/vendor-sku-import";

const TONE_SUCCESS = "border-[#14532d] bg-[#eef6f0] text-[#14532d]";
const TONE_REVIEW = "border-[#1a1a1a] bg-brand-yellow/60 text-[#1a1a1a]";
const TONE_DANGER = "border-[#c0392b] bg-[#f7e6e2] text-[#7a3428]";
const TONE_NEUTRAL = "border-[#a8a29e] bg-[#eeece5] text-[#57534e]";
const TONE_DONE = "border-[#4a5565]/50 bg-white text-[#4a5565]";

/** Rótulo curto de cada status da prévia, como aparece no selo da linha. */
export const SKU_IMPORT_STATUS_LABELS: Record<SkuImportStatus, string> = {
  exact: "Exato",
  synonym: "Sinônimo",
  review: "Revisar",
  not_found: "Não encontrado",
  conflict: "Conflito",
  invalid: "Inválido",
  duplicate: "Repetida",
  up_to_date: "Já atualizado",
};

/** Tom do selo por status da prévia: verde só para associação segura. */
export const SKU_IMPORT_STATUS_TONES: Record<SkuImportStatus, string> = {
  exact: TONE_SUCCESS,
  synonym: TONE_SUCCESS,
  review: TONE_REVIEW,
  not_found: TONE_NEUTRAL,
  conflict: TONE_DANGER,
  invalid: TONE_DANGER,
  duplicate: TONE_NEUTRAL,
  up_to_date: TONE_DONE,
};

/** Rótulo de cada status do resultado gravado. */
export const SKU_IMPORT_RESULT_LABELS: Record<SkuImportResultStatus, string> = {
  applied: "Atualizado",
  up_to_date: "Sem mudança",
  stale: "Alterado antes",
  rejected: "Recusado",
  conflict: "Conflito",
  duplicate: "Repetida",
};

/** Tom do selo por status do resultado. */
export const SKU_IMPORT_RESULT_TONES: Record<SkuImportResultStatus, string> = {
  applied: TONE_SUCCESS,
  up_to_date: TONE_DONE,
  stale: TONE_DANGER,
  rejected: TONE_DANGER,
  conflict: TONE_DANGER,
  duplicate: TONE_NEUTRAL,
};
