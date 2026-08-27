"use client";

import { useMemo, useRef, useState } from "react";

import { useTemporaryAdminMedia } from "@/hooks/use-temporary-admin-media";
import { uploadDirectFile } from "@/lib/client/direct-upload";
import type { AdminFlashSaleCandidate } from "@/lib/server/admin-flash-sale";
import type { AdminKit, AdminKitMerchandise } from "@/lib/server/admin-kits";

import {
  createDraftMerchandise,
  createKitDraft,
  createKitDraftFrom,
  kitDraftAttachmentIds,
  parseKitMoney,
} from "./kits-manager-draft";
import { saveKitDraft } from "./kits-manager-service";
import type { KitDraft, UploadTarget } from "./kits-manager-types";

type KitsManagerControllerArgs = Readonly<{
  initialKits: AdminKit[];
  initialProducts: AdminFlashSaleCandidate[];
}>;

export function useKitsManager({
  initialKits,
  initialProducts,
}: KitsManagerControllerArgs) {
  const [kits, setKits] = useState(initialKits);
  const [draft, setDraft] = useState<KitDraft | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");
  const [uploadingTargets, setUploadingTargets] = useState<UploadTarget[]>([]);
  const editorSession = useRef(0);
  const temporaryMedia = useTemporaryAdminMedia();

  const selectedProductIds = useMemo(
    () => new Set(draft?.items.map((item) => item.productId) ?? []),
    [draft],
  );
  const filteredProducts = useMemo(
    () => filterProducts(initialProducts, search),
    [initialProducts, search],
  );
  const referenceCents = useMemo(
    () => calculateReferenceCents(draft, initialProducts),
    [draft, initialProducts],
  );

  function patchDraft(patch: Partial<KitDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function openCreate() {
    openDraft(createKitDraft());
  }

  function openEdit(kit: AdminKit) {
    openDraft(createKitDraftFrom(kit));
  }

  function openDraft(nextDraft: KitDraft) {
    editorSession.current += 1;
    setError("");
    setUploadNotice("");
    setDraft(nextDraft);
  }

  function closeDraft() {
    if (saving) return;
    editorSession.current += 1;
    setDraft(null);
    setUploadNotice("");
    temporaryMedia.discardAllExcept().catch(() => undefined);
  }

  function addProduct(product: AdminFlashSaleCandidate) {
    if (!draft || selectedProductIds.has(product.id)) return;
    patchDraft({
      items: [...draft.items, { productId: product.id, quantity: 1 }],
    });
  }

  function removeProduct(productId: number) {
    if (!draft) return;
    patchDraft({
      items: draft.items.filter((item) => item.productId !== productId),
    });
  }

  function setProductQuantity(productId: number, quantity: number) {
    if (!draft) return;
    patchDraft({
      items: draft.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item,
      ),
    });
  }

  function addMerchandise() {
    if (!draft) return;
    patchDraft({
      merchandise: [...draft.merchandise, createDraftMerchandise()],
    });
  }

  function removeMerchandise(clientId: string) {
    if (!draft) return;
    patchDraft({
      merchandise: draft.merchandise.filter(
        (item) => item.clientId !== clientId,
      ),
    });
  }

  function patchMerchandise(
    clientId: string,
    patch: Partial<AdminKitMerchandise>,
  ) {
    setDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        merchandise: current.merchandise.map((item) =>
          item.clientId === clientId ? { ...item, ...patch } : item,
        ),
      };
    });
  }

  async function uploadImage(file: File, target: UploadTarget) {
    const session = editorSession.current;
    setError("");
    setUploadNotice("");
    setUploadingTargets((current) => [...current, target]);

    try {
      const media = await uploadKitMedia(file);
      if (session !== editorSession.current) {
        await temporaryMedia.discard([media.id]).catch(() => undefined);
        return;
      }

      temporaryMedia.track(media.id);
      const previousId = previousAttachmentId(draft, target);
      updateDraftImage(target, media);
      if (previousId && temporaryMedia.isTracked(previousId)) {
        temporaryMedia.discard([previousId]).catch(() => undefined);
      }
      setUploadNotice(
        target === "kit"
          ? "Imagem do Kit enviada."
          : "Imagem do brinde enviada.",
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível enviar a imagem.",
      );
    } finally {
      setUploadingTargets((current) =>
        current.filter((currentTarget) => currentTarget !== target),
      );
    }
  }

  function updateDraftImage(
    target: UploadTarget,
    media: { id: number; src: string },
  ) {
    setDraft((current) => {
      if (!current) return current;
      if (target === "kit") {
        return {
          ...current,
          imageSource: "custom",
          imageAttachmentId: media.id,
          imageUrl: media.src,
        };
      }

      const clientId = target.slice("merchandise:".length);
      return {
        ...current,
        merchandise: current.merchandise.map((item) => {
          if (item.clientId !== clientId) return item;
          return { ...item, imageAttachmentId: media.id, imageUrl: media.src };
        }),
      };
    });
  }

  async function save() {
    if (!draft) return;
    if (isImageMissing(draft)) {
      setError("Envie uma imagem do Kit antes de salvar.");
      return;
    }

    setSaving(true);
    temporaryMedia.beginSave();
    setError("");
    try {
      const kit = await saveKitDraft(draft);
      setKits((current) => replaceOrPrependKit(current, kit, draft.id));
      temporaryMedia
        .discardAllExcept(kitDraftAttachmentIds(draft))
        .catch(() => undefined);
      editorSession.current += 1;
      setDraft(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Falha de rede ao salvar o Kit. Tente novamente.",
      );
    } finally {
      setSaving(false);
      temporaryMedia.endSave();
    }
  }

  return {
    addMerchandise,
    addProduct,
    closeDraft,
    draft,
    error,
    filteredProducts,
    kits,
    openCreate,
    openEdit,
    patchDraft,
    patchMerchandise,
    referenceCents,
    removeMerchandise,
    removeProduct,
    saving,
    search,
    selectedProductIds,
    setProductQuantity,
    setSearch,
    save,
    uploadingTargets,
    uploadImage,
    uploadNotice,
  };
}

async function uploadKitMedia(file: File) {
  const payload = await uploadDirectFile<{
    media?: { id: number; src: string };
  }>("media", file);
  if (!payload.media) throw new Error("Não foi possível enviar a imagem.");

  return payload.media;
}

function filterProducts(products: AdminFlashSaleCandidate[], search: string) {
  const normalizedSearch = search.toLowerCase();
  return products.filter((product) =>
    `${product.name} ${product.sku}`.toLowerCase().includes(normalizedSearch),
  );
}

function calculateReferenceCents(
  draft: KitDraft | null,
  products: AdminFlashSaleCandidate[],
) {
  if (!draft) return 0;
  const productsById = new Map(
    products.map((product) => [product.id, product]),
  );
  return draft.items.reduce(
    (total, item) =>
      total +
      Math.round(
        parseKitMoney(productsById.get(item.productId)?.price ?? "0") * 100,
      ) *
        item.quantity,
    0,
  );
}

function isImageMissing(draft: KitDraft) {
  return (
    !draft.id && (!draft.imageAttachmentId || draft.imageSource !== "custom")
  );
}

function previousAttachmentId(draft: KitDraft | null, target: UploadTarget) {
  if (!draft) return undefined;
  if (target === "kit") return draft.imageAttachmentId;
  const clientId = target.slice("merchandise:".length);

  return draft.merchandise.find((item) => item.clientId === clientId)
    ?.imageAttachmentId;
}

function replaceOrPrependKit(
  kits: AdminKit[],
  kit: AdminKit,
  existingKitId: number | undefined,
) {
  return existingKitId
    ? kits.map((current) => (current.id === kit.id ? kit : current))
    : [kit, ...kits];
}
