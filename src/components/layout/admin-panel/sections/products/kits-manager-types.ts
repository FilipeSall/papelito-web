import type {
  AdminKit,
  AdminKitMerchandise,
  AdminKitPayload,
} from "@/lib/server/admin-kits";

export type DraftMerchandise = AdminKitMerchandise & { clientId: string };

export type KitDraft = Omit<AdminKitPayload, "merchandise"> & {
  id?: number;
  imageUrl: string;
  merchandise: DraftMerchandise[];
};

export type UploadTarget = "kit" | `merchandise:${string}`;
export type KitStatus = AdminKit["status"];
