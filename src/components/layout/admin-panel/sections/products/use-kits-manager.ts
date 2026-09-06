"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useTemporaryAdminMedia } from "@/hooks/use-temporary-admin-media";
import { uploadDirectFile } from "@/lib/client/direct-upload";
import type { AdminFlashSaleCandidate } from "@/lib/server/admin-flash-sale";
import type { AdminKit } from "@/lib/server/admin-kits";
import type { AdminMerchandise } from "@/lib/server/admin-merchandise";

import {
  createKitDraft,
  createKitDraftFrom,
  invalidKitDimensionFields,
  kitDraftAttachmentIds,
  parseKitMoney,
} from "./kits-manager-draft";
import { deleteKitDraft, saveKitDraft } from "./kits-manager-service";
import type { KitDraft } from "./kits-manager-types";
import { describeMerchandiseSettlement } from "./merchandise/merchandise-draft";
import { useMerchandiseForm } from "./merchandise/use-merchandise-form";

type KitsManagerControllerArgs = Readonly<{
  initialFocusKitId?: number | null;
  initialIssue?: "shipping-dimensions" | null;
  initialKits: AdminKit[];
  initialMerchandise: AdminMerchandise[];
  initialProducts: AdminFlashSaleCandidate[];
}>;

export function useKitsManager({
  initialFocusKitId = null,
  initialIssue = null,
  initialKits,
  initialMerchandise,
  initialProducts,
}: KitsManagerControllerArgs) {
  const [kits, setKits] = useState(initialKits);
  const [draft, setDraft] = useState<KitDraft | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingKitId, setDeletingKitId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminKit | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editorNotice, setEditorNotice] = useState("");
  const [uploadingKitImage, setUploadingKitImage] = useState(false);
  const [merchandise, setMerchandise] = useState(initialMerchandise);
  const [merchandiseSearch, setMerchandiseSearch] = useState("");
  const editorSession = useRef(0);
  const temporaryMedia = useTemporaryAdminMedia();
  const handledInitialFocus = useRef(false);

  useEffect(() => {
    if (handledInitialFocus.current || !initialFocusKitId) return;

    const focusedKit = kits.find((kit) => kit.id === initialFocusKitId);
    if (!focusedKit) return;

    handledInitialFocus.current = true;
    openDraft(
      createKitDraftFrom(focusedKit, {
        highlightMissingDimensions: initialIssue === "shipping-dimensions",
      }),
    );
  }, [initialFocusKitId, initialIssue, kits]);

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
  const merchandiseById = useMemo(
    () => new Map(merchandise.map((item) => [item.id, item])),
    [merchandise],
  );
  const selectedMerchandiseIds = useMemo(
    () => new Set(draft?.merchandise.map((item) => item.merchandiseId) ?? []),
    [draft],
  );
  const filteredMerchandise = useMemo(
    () => filterMerchandise(merchandise, merchandiseSearch),
    [merchandise, merchandiseSearch],
  );

  /**
   * Um brinde criado daqui é salvo no catálogo antes do Kit e já entra vinculado.
   * Se o Kit for abandonado depois, o brinde continua existindo na aba Brindes —
   * é o preço de ele ser global, e o comportamento desejado.
   */
  const merchandiseForm = useMerchandiseForm({
    onSaved: ({ merchandise: saved, unpublishedKits, failedKits }, { isNew }) => {
      setMerchandise((current) => upsertMerchandise(current, saved, isNew));

      if (isNew) {
        setDraft((current) =>
          current &&
          !current.merchandise.some((item) => item.merchandiseId === saved.id)
            ? {
                ...current,
                merchandise: [
                  ...current.merchandise,
                  { merchandiseId: saved.id, quantity: 1 },
                ],
              }
            : current,
        );
      }

      const settlement = describeMerchandiseSettlement({
        failedKits,
        isNew,
        name: saved.name,
        unpublishedKits,
      });

      if (settlement.tone === "error") {
        setError(settlement.message);
        setEditorNotice("");
        return;
      }

      setEditorNotice(
        isNew && failedKits.length === 0 && unpublishedKits.length === 0
          ? `"${saved.name}" foi criado no catálogo de brindes e adicionado a este Kit.`
          : settlement.message,
      );
    },
  });

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
    setNotice("");
    setEditorNotice("");
    setMerchandiseSearch("");
    setDraft(nextDraft);
  }

  function closeDraft() {
    if (saving) return;
    editorSession.current += 1;
    // O formulário de brinde vive dentro deste dialog: deixá-lo aberto o traria
    // de volta, com rascunho velho, na próxima abertura do editor.
    merchandiseForm.close();
    setDraft(null);
    setEditorNotice("");
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

  function attachMerchandise(merchandiseId: number) {
    if (!draft || selectedMerchandiseIds.has(merchandiseId)) return;
    patchDraft({
      merchandise: [...draft.merchandise, { merchandiseId, quantity: 1 }],
    });
  }

  /**
   * Desfaz o vínculo com o Kit. O brinde continua no catálogo e nos outros Kits.
   */
  function detachMerchandise(merchandiseId: number) {
    if (!draft) return;
    patchDraft({
      merchandise: draft.merchandise.filter(
        (item) => item.merchandiseId !== merchandiseId,
      ),
    });
  }

  function setMerchandiseQuantity(merchandiseId: number, quantity: number) {
    setDraft((current) =>
      current
        ? {
            ...current,
            merchandise: current.merchandise.map((item) =>
              item.merchandiseId === merchandiseId
                ? { ...item, quantity: Math.max(1, quantity) }
                : item,
            ),
          }
        : current,
    );
  }

  function openMerchandiseEdit(merchandiseId: number) {
    const target = merchandiseById.get(merchandiseId);
    if (target) merchandiseForm.openEdit(target);
  }

  async function uploadImage(file: File) {
    const session = editorSession.current;
    setError("");
    setEditorNotice("");
    setUploadingKitImage(true);

    try {
      const media = await uploadKitMedia(file);
      if (session !== editorSession.current) {
        await temporaryMedia.discard([media.id]).catch(() => undefined);
        return;
      }

      temporaryMedia.track(media.id);
      const previousId = draft?.imageAttachmentId;
      setDraft((current) =>
        current
          ? {
              ...current,
              imageSource: "custom",
              imageAttachmentId: media.id,
              imageUrl: media.src,
            }
          : current,
      );
      if (previousId && temporaryMedia.isTracked(previousId)) {
        temporaryMedia.discard([previousId]).catch(() => undefined);
      }
      setEditorNotice("Imagem do Kit enviada.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível enviar a imagem.",
      );
    } finally {
      setUploadingKitImage(false);
    }
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
      setDraft((current) =>
        current
          ? {
              ...current,
              invalidDimensionFields: invalidKitDimensionFields(
                current.packageDimensions,
              ),
            }
          : current,
      );
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

  function requestDelete(kit: AdminKit) {
    setError("");
    setNotice("");
    setDeleteTarget(kit);
  }

  function cancelDelete() {
    if (deletingKitId) return;
    setDeleteTarget(null);
    setError("");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const kit = deleteTarget;
    setDeletingKitId(kit.id);
    setError("");
    try {
      const deletion = await deleteKitDraft(kit.id);
      setKits((current) =>
        current.filter((currentKit) => currentKit.id !== kit.id),
      );
      setDeleteTarget(null);
      setNotice(
        deletion.partial
          ? "Kit excluído. Algumas imagens não puderam ser removidas do storage."
          : "Kit excluído e imagens exclusivas removidas.",
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Não foi possível excluir o Kit.",
      );
    } finally {
      setDeletingKitId(null);
    }
  }

  return {
    addProduct,
    attachMerchandise,
    closeDraft,
    cancelDelete,
    confirmDelete,
    deleteTarget,
    detachMerchandise,
    draft,
    deletingKitId,
    editorNotice,
    error,
    filteredMerchandise,
    filteredProducts,
    kits,
    merchandiseById,
    merchandiseForm,
    merchandiseSearch,
    openCreate,
    openEdit,
    openMerchandiseEdit,
    notice,
    patchDraft,
    referenceCents,
    removeProduct,
    requestDelete,
    saving,
    search,
    selectedMerchandiseIds,
    selectedProductIds,
    setMerchandiseQuantity,
    setMerchandiseSearch,
    setProductQuantity,
    setSearch,
    save,
    uploadingKitImage,
    uploadImage,
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

function filterMerchandise(merchandise: AdminMerchandise[], search: string) {
  const term = search.trim().toLowerCase();

  return term === ""
    ? merchandise
    : merchandise.filter((item) => item.name.toLowerCase().includes(term));
}

function upsertMerchandise(
  current: AdminMerchandise[],
  saved: AdminMerchandise,
  isNew: boolean,
) {
  return isNew
    ? [...current, saved].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    : current.map((item) => (item.id === saved.id ? saved : item));
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
