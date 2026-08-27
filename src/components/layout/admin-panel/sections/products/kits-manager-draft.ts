import type {
  AdminKit,
  AdminKitMerchandise,
  AdminKitPayload,
} from "@/lib/server/admin-kits";

import type { DraftMerchandise, KitDraft } from "./kits-manager-types";

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

export function createKitDraftFrom(kit: AdminKit): KitDraft {
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
    packageDimensions: kit.packageDimensions ?? {
      length: "",
      width: "",
      height: "",
    },
  };
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
