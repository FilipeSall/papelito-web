import type {
  AdminMerchandise,
  AdminMerchandisePayload,
} from "@/lib/server/admin-merchandise";

export type MerchandiseDraft = {
  id?: number;
  name: string;
  imageAttachmentId?: number;
  imageUrl: string;
  weight: string;
  length: string;
  width: string;
  height: string;
};

export type MerchandiseNumericField = "weight" | "length" | "width" | "height";

/**
 * Limites idênticos aos do backend: a mesma regra vale para a página de Brindes,
 * para o editor de Kit e para o `PUT`, e só existe escrita aqui.
 */
export const MERCHANDISE_FIELD_RULES: Record<
  MerchandiseNumericField,
  { label: string; max: number; min: number; unit: string }
> = {
  weight: { label: "Peso", max: 30, min: 0.001, unit: "kg" },
  length: { label: "Comprimento", max: 100, min: 0.1, unit: "cm" },
  width: { label: "Largura", max: 100, min: 0.1, unit: "cm" },
  height: { label: "Altura", max: 100, min: 0.1, unit: "cm" },
};

export const MERCHANDISE_NAME_MAX_LENGTH = 160;

export function createMerchandiseDraft(): MerchandiseDraft {
  return {
    name: "",
    imageUrl: "",
    weight: "",
    length: "",
    width: "",
    height: "",
  };
}

export function createMerchandiseDraftFrom(
  merchandise: AdminMerchandise,
): MerchandiseDraft {
  return {
    id: merchandise.id,
    name: merchandise.name,
    imageAttachmentId: merchandise.imageAttachmentId,
    imageUrl: merchandise.imageUrl,
    weight: merchandise.weight,
    length: merchandise.length,
    width: merchandise.width,
    height: merchandise.height,
  };
}

export function parseMerchandiseNumber(value: string) {
  return Number.parseFloat(value.trim().replace(",", "."));
}

export function merchandiseNameError(name: string) {
  const trimmed = name.trim();

  if (trimmed === "") return "Informe o nome do brinde.";
  if (trimmed.length > MERCHANDISE_NAME_MAX_LENGTH) {
    return `Use no máximo ${MERCHANDISE_NAME_MAX_LENGTH} caracteres.`;
  }

  return "";
}

export function merchandiseFieldError(
  field: MerchandiseNumericField,
  value: string,
) {
  const rule = MERCHANDISE_FIELD_RULES[field];
  const parsed = parseMerchandiseNumber(value);

  if (value.trim() === "") return `Informe ${rule.label.toLowerCase()}.`;
  if (!Number.isFinite(parsed) || parsed < rule.min) {
    return `Mínimo: ${formatDecimal(rule.min)} ${rule.unit}.`;
  }
  if (parsed > rule.max) return `Máximo: ${formatDecimal(rule.max)} ${rule.unit}.`;

  return "";
}

export function merchandiseDraftErrors(draft: MerchandiseDraft) {
  const errors: Partial<Record<"name" | "image" | MerchandiseNumericField, string>> =
    {};
  const nameError = merchandiseNameError(draft.name);

  if (nameError) errors.name = nameError;
  if (!draft.imageAttachmentId) errors.image = "Envie uma imagem do brinde.";

  for (const field of Object.keys(
    MERCHANDISE_FIELD_RULES,
  ) as MerchandiseNumericField[]) {
    const fieldError = merchandiseFieldError(field, draft[field]);
    if (fieldError) errors[field] = fieldError;
  }

  return errors;
}

export function isMerchandiseDraftValid(draft: MerchandiseDraft) {
  return Object.keys(merchandiseDraftErrors(draft)).length === 0;
}

export function toMerchandisePayload(
  draft: MerchandiseDraft,
  options: { confirmImpact?: boolean } = {},
): AdminMerchandisePayload {
  return {
    name: draft.name.trim(),
    imageAttachmentId: draft.imageAttachmentId ?? 0,
    weight: draft.weight.trim().replace(",", "."),
    length: draft.length.trim().replace(",", "."),
    width: draft.width.trim().replace(",", "."),
    height: draft.height.trim().replace(",", "."),
    ...(options.confirmImpact ? { confirmImpact: true } : {}),
  };
}

/**
 * Mensagem única do resultado de um salvamento de brinde.
 *
 * Kit que quebrou e o backend não conseguiu despublicar não é sucesso: vai pelo
 * canal de erro, com nome, porque alguém precisa arrumar aquele Kit à mão.
 */
export function describeMerchandiseSettlement({
  failedKits,
  isNew,
  name,
  unpublishedKits,
}: {
  failedKits: Array<{ name: string }>;
  isNew: boolean;
  name: string;
  unpublishedKits: Array<{ name: string }>;
}): { message: string; tone: "error" | "success" } {
  if (failedKits.length > 0) {
    return {
      tone: "error",
      message: `"${name}" foi salvo, mas ${failedKits.length === 1 ? "um Kit continua publicado" : `${failedKits.length} Kits continuam publicados`} sem atender às regras de logística: ${listNames(failedKits)}. Despublique manualmente.`,
    };
  }

  if (unpublishedKits.length > 0) {
    return {
      tone: "success",
      message: `"${name}" foi salvo. ${unpublishedKits.length === 1 ? "Um Kit voltou" : `${unpublishedKits.length} Kits voltaram`} para rascunho: ${listNames(unpublishedKits)}.`,
    };
  }

  return {
    tone: "success",
    message: isNew
      ? `"${name}" foi criado no catálogo de brindes.`
      : `"${name}" foi atualizado em todos os Kits que o usam.`,
  };
}

function listNames(kits: Array<{ name: string }>) {
  return kits.map((kit) => kit.name).join(", ");
}

export function formatMerchandiseWeight(weight: string) {
  const parsed = parseMerchandiseNumber(weight);

  return Number.isFinite(parsed) ? `${formatDecimal(parsed)} kg` : "—";
}

export function formatMerchandiseDimensions(
  merchandise: Pick<AdminMerchandise, "length" | "width" | "height">,
) {
  const parts = [merchandise.length, merchandise.width, merchandise.height].map(
    (value) => {
      const parsed = parseMerchandiseNumber(value);
      return Number.isFinite(parsed) ? formatDecimal(parsed) : "—";
    },
  );

  return `${parts.join(" × ")} cm`;
}

function formatDecimal(value: number) {
  return String(value).replace(".", ",");
}
