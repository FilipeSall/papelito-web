import type {
  AdminKit,
  AdminKitMerchandise,
  AdminKitPayload,
} from "@/lib/server/admin-kits";

import type { DraftMerchandise, KitDraft } from "./kits-manager-types";

export type KitDimensionField = "length" | "width" | "height";

export const KIT_PACKAGE_DIMENSION_RULES: Record<
  KitDimensionField,
  { label: string; min: number; max: number }
> = {
  length: { label: "comprimento", min: 11, max: 100 },
  width: { label: "largura", min: 6, max: 100 },
  height: { label: "altura", min: 0.4, max: 100 },
};

export function createKitDraft(): KitDraft {
  return {
    name: "",
    status: "draft",
    price: "",
    salePrice: "",
    imageSource: "custom",
    imageUrl: "",
    items: [],
    merchandise: [],
    shortDescription: "",
    description: "",
    packageDimensions: { length: "", width: "", height: "" },
    invalidDimensionFields: [],
  };
}

export function createDraftMerchandise(
  merchandise?: Omit<AdminKitMerchandise, "id">,
): DraftMerchandise {
  return {
    name: "",
    quantity: 1,
    weight: "",
    length: "",
    width: "",
    height: "",
    ...merchandise,
    clientId: crypto.randomUUID(),
  };
}

export function createKitDraftFrom(
  kit: AdminKit,
  options: { highlightMissingDimensions?: boolean } = {},
): KitDraft {
  const packageDimensions = {
    length: String(kit.packageDimensions?.length ?? ""),
    width: String(kit.packageDimensions?.width ?? ""),
    height: String(kit.packageDimensions?.height ?? ""),
  };

  return {
    id: kit.id,
    name: kit.name,
    slug: kit.slug,
    status: kit.status,
    price: kit.price,
    salePrice: kit.salePrice,
    imageSource: kit.imageSource,
    imageUrl: kit.imageUrl,
    items: kit.items.map(({ productId, quantity }) => ({
      productId,
      quantity,
    })),
    merchandise: kit.merchandise.map(createDraftMerchandise),
    shortDescription: kit.shortDescription,
    description: kit.description,
    packageDimensions,
    invalidDimensionFields: options.highlightMissingDimensions
      ? missingKitDimensionFields(packageDimensions)
      : [],
  };
}

export function missingKitDimensionFields(
  dimensions: KitDraft["packageDimensions"],
) {
  return (["length", "width", "height"] as const).filter(
    (field) =>
      dimensions[field].trim() === "" ||
      Number.parseFloat(dimensions[field].replace(",", ".")) <= 0,
  );
}

export function kitDimensionRange(field: KitDimensionField) {
  const rule = KIT_PACKAGE_DIMENSION_RULES[field];
  return `${formatCentimeters(rule.min)} a ${formatCentimeters(rule.max)} cm`;
}

export function kitDimensionError(field: KitDimensionField, value: string) {
  const normalizedValue = value.trim().replace(",", ".");
  const rule = KIT_PACKAGE_DIMENSION_RULES[field];
  if (normalizedValue === "") {
    return `Informe o ${rule.label}.`;
  }

  const numericValue = Number.parseFloat(normalizedValue);
  if (!Number.isFinite(numericValue) || numericValue < rule.min) {
    return `Mínimo: ${formatCentimeters(rule.min)} cm.`;
  }
  if (numericValue > rule.max) {
    return `Máximo: ${formatCentimeters(rule.max)} cm.`;
  }

  return "";
}

export function invalidKitDimensionFields(
  dimensions: KitDraft["packageDimensions"],
) {
  return (["length", "width", "height"] as const).filter(
    (field) => kitDimensionError(field, dimensions[field]) !== "",
  );
}

function formatCentimeters(value: number) {
  return value.toString().replace(".", ",");
}

export function kitDraftAttachmentIds(draft: KitDraft) {
  return [
    draft.imageAttachmentId,
    ...draft.merchandise.map((item) => item.imageAttachmentId),
  ].filter(
    (id): id is number =>
      typeof id === "number" && Number.isInteger(id) && id > 0,
  );
}

export function toKitPayload(draft: KitDraft): AdminKitPayload {
  return {
    name: draft.name,
    slug: draft.slug,
    status: draft.status,
    price: draft.price,
    salePrice: draft.salePrice,
    imageSource: draft.imageSource,
    imageAttachmentId: draft.imageAttachmentId,
    shortDescription: draft.shortDescription,
    description: draft.description,
    packageDimensions: draft.packageDimensions,
    items: draft.items,
    merchandise: draft.merchandise.map(
      ({ clientId: _clientId, ...item }) => item,
    ),
  };
}

export function parseKitMoney(value: string) {
  const number = Number.parseFloat(value.replace(",", "."));

  return Number.isFinite(number) ? number : 0;
}
