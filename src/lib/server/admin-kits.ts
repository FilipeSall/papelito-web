import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

export type AdminKitItem = {
  productId: number;
  name: string;
  sku: string;
  imageUrl: string;
  quantity: number;
  currentPriceCents: number;
};

export type AdminKitMerchandise = {
  id?: number;
  name: string;
  imageAttachmentId?: number;
  imageUrl?: string;
  quantity: number;
  weight: string;
  length: string;
  width: string;
  height: string;
};

export type AdminKit = {
  id: number;
  productId: number;
  name: string;
  slug: string;
  status: "draft" | "publish";
  price: string;
  salePrice: string;
  imageUrl: string;
  imageSource: "fallback" | "kit" | "premium" | "custom";
  shortDescription: string;
  description: string;
  packageDimensions: {
    length: string;
    width: string;
    height: string;
  } | null;
  items: AdminKitItem[];
  merchandise: AdminKitMerchandise[];
  referencePriceCents: number;
};

export type AdminKitPayload = {
  name: string;
  slug?: string;
  status: "draft" | "publish";
  price: string;
  salePrice?: string;
  imageSource: AdminKit["imageSource"];
  imageAttachmentId?: number;
  shortDescription: string;
  description: string;
  packageDimensions: {
    length: string;
    width: string;
    height: string;
  };
  items: Array<Pick<AdminKitItem, "productId" | "quantity">>;
  merchandise: AdminKitMerchandise[];
};

export type AdminKitDeletion = {
  deleted: true;
  kitId: number;
  productId: number;
  partial: boolean;
  mediaCleanup: {
    deletedIds: number[];
    preservedIds: number[];
    failedIds: number[];
  };
};

type RawSnapshot = { items?: AdminKit[] };

export class AdminKitRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function getAdminKitsSnapshot(
  accessToken: string | undefined,
): Promise<AdminKit[]> {
  if (!accessToken) return [];
  const result = await wpRest<RawSnapshot>("/papelito/v1/admin/kits", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 60,
    tags: ["admin-kits"],
  });
  return result.ok && Array.isArray(result.data.items) ? result.data.items : [];
}

export async function saveAdminKit(
  accessToken: string,
  payload: AdminKitPayload,
  kitId?: number,
): Promise<AdminKit> {
  const result = await wpRest<AdminKit>(
    `/papelito/v1/admin/kits${kitId ? `/${kitId}` : ""}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      json: payload,
      method: kitId ? "PUT" : "POST",
    },
  );
  if (!result.ok)
    throw new AdminKitRequestError(result.error.message, result.status);
  return result.data;
}

export async function deleteAdminKit(
  accessToken: string,
  kitId: number,
): Promise<AdminKitDeletion> {
  const result = await wpRest<AdminKitDeletion>(
    `/papelito/v1/admin/kits/${kitId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      method: "DELETE",
    },
  );
  if (!result.ok)
    throw new AdminKitRequestError(result.error.message, result.status);
  return result.data;
}
