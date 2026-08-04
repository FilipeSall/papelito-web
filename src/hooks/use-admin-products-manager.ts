"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ADMIN_PRODUCTS_API,
  PRODUCT_ERROR_MESSAGES,
  PRODUCT_NOTICES,
  PUBLISHED_PRODUCT_STATUS,
} from "@/constants/admin-products";
import {
  buildPayload,
  findPromotionTag,
  hasValidProductPrice,
  isPromotionActive,
  newProductDraft,
  productToDraft,
} from "@/components/layout/admin-panel/sections/products/helpers";
import type {
  AdminProduct,
  AdminProductsSnapshot,
  AdminProductTaxonomyTerm,
} from "@/lib/server/admin-products";
import type {
  DraftTermKey,
  ImageUploadTarget,
  ProductDraft,
  ProductFilters,
} from "@/types/admin-products-manager";
import { messageFromError } from "@/utils/error-message";
import { normalizeKey } from "@/utils/normalize-key";

const EMPTY_FILTERS: ProductFilters = {
  category: "",
  search: "",
  status: "",
};

function normalizeFilters(filters: ProductFilters): ProductFilters {
  return {
    category: filters.category.trim(),
    search: filters.search.trim(),
    status: filters.status.trim(),
  };
}

function mergeTags(
  currentTags: AdminProductTaxonomyTerm[],
  additionalTags: AdminProductTaxonomyTerm[],
) {
  const tagsById = new Map(currentTags.map((tag) => [tag.id, tag]));

  for (const tag of additionalTags) {
    tagsById.set(tag.id, tag);
  }

  return Array.from(tagsById.values()).sort((left, right) =>
    left.name.localeCompare(right.name, "pt-BR"),
  );
}

export function useAdminProductsManager(
  snapshot: AdminProductsSnapshot,
  options: {
    initialFocusProductId?: number | null;
    onUploadError?: (message: string) => void;
  } = {},
) {
  const initialFocusProductId = options.initialFocusProductId ?? null;
  const [products, setProducts] = useState(snapshot.products);
  const [categories, setCategories] = useState(snapshot.categories);
  const [tags, setTags] = useState(snapshot.tags);
  const [issues, setIssues] = useState(snapshot.issues);
  const [page, setPage] = useState(snapshot.currentPage);
  const [totalPages, setTotalPages] = useState(snapshot.totalPages);
  const [totalProducts, setTotalProducts] = useState(snapshot.totalProducts);
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [selectedProductId, setSelectedProductId] = useState<number | "new">(
    snapshot.products[0]?.id ?? "new",
  );
  const [draft, setDraft] = useState<ProductDraft>(
    snapshot.products[0] ? productToDraft(snapshot.products[0]) : newProductDraft(),
  );
  const draftRef = useRef(draft);
  const changedFieldsRef = useRef<Set<keyof ProductDraft>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [notice, setNotice] = useState("");
  const handledInitialFocusRef = useRef(false);
  const selectionRequestRef = useRef(0);

  const resetDraft = useCallback((nextDraft: ProductDraft) => {
    draftRef.current = nextDraft;
    changedFieldsRef.current = new Set();
    setDraft(nextDraft);
  }, []);

  function markChanged(...fields: (keyof ProductDraft)[]) {
    if (fields.length === 0) {
      return;
    }

    for (const field of fields) {
      changedFieldsRef.current.add(field);
    }
  }

  function updateDraftState(
    updater: (currentDraft: ProductDraft) => ProductDraft,
    changedFields: (keyof ProductDraft)[] = [],
  ) {
    const nextDraft = updater(draftRef.current);
    draftRef.current = nextDraft;
    markChanged(...changedFields);
    setDraft(nextDraft);
  }

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const catalogSummary = useMemo(() => {
    const published = products.filter(
      (product) => product.status === PUBLISHED_PRODUCT_STATUS,
    ).length;
    const drafts = products.filter((product) => product.status === "draft").length;
    const promotionTag = findPromotionTag(tags);
    const promotions = products.filter((product) =>
      isPromotionActive(product, promotionTag?.id),
    ).length;
    return { drafts, promotions, published };
  }, [products, tags]);

  const promotionTag = useMemo(() => findPromotionTag(tags), [tags]);
  const isPromotionEnabled =
    Boolean(draft.salePrice.trim()) ||
    Boolean(draft.dateOnSaleFrom || draft.dateOnSaleTo) ||
    Boolean(promotionTag && draft.tagIds.includes(String(promotionTag.id)));

  const openProduct = useCallback((product: AdminProduct) => {
    setSelectedProductId(product.id);
    setTags((currentTags) => mergeTags(currentTags, product.tags));
    const nextDraft = productToDraft(product);
    resetDraft(nextDraft);
    setNotice("");
    setIsEditorOpen(true);
  }, [resetDraft]);

  const selectProduct = useCallback(async (product: AdminProduct) => {
    if (product.type !== "variable") {
      openProduct(product);
      return;
    }

    const requestId = selectionRequestRef.current + 1;
    selectionRequestRef.current = requestId;
    setIsLoading(true);
    setNotice("");

    try {
      const response = await fetch(ADMIN_PRODUCTS_API.detail(product.id), {
        cache: "no-store",
      });
      const json = (await response.json().catch(() => null)) as
        | { message?: string; product?: AdminProduct }
        | null;

      if (!response.ok || !json?.product) {
        throw new Error(json?.message ?? PRODUCT_ERROR_MESSAGES.load);
      }

      if (selectionRequestRef.current !== requestId) {
        return;
      }

      const detailedProduct = json.product;
      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.id === detailedProduct.id ? detailedProduct : currentProduct,
        ),
      );
      openProduct(detailedProduct);
    } catch (error) {
      if (selectionRequestRef.current === requestId) {
        setNotice(messageFromError(error, "Não foi possível carregar os preços do produto."));
      }
    } finally {
      if (selectionRequestRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [openProduct]);

  function startNewProduct() {
    setSelectedProductId("new");
    const nextDraft = newProductDraft();
    resetDraft(nextDraft);
    setNotice("");
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
  }

  useEffect(() => {
    if (handledInitialFocusRef.current || !initialFocusProductId) {
      return;
    }

    handledInitialFocusRef.current = true;
    const existingProduct = products.find((product) => product.id === initialFocusProductId);

    if (existingProduct) {
      void selectProduct(existingProduct);
      return;
    }

    let cancelled = false;
    const focusedProductId = initialFocusProductId;

    async function loadFocusedProduct() {
      setIsLoading(true);
      setNotice("");

      try {
        const response = await fetch(ADMIN_PRODUCTS_API.detail(focusedProductId), {
          cache: "no-store",
        });
        const json = (await response.json().catch(() => null)) as
          | { message?: string; product?: AdminProduct }
          | null;

        if (!response.ok || !json?.product) {
          throw new Error(json?.message ?? PRODUCT_ERROR_MESSAGES.load);
        }

        const focusedProduct = json.product;

        if (cancelled) {
          return;
        }

        setProducts((currentProducts) => {
          if (currentProducts.some((product) => product.id === focusedProduct.id)) {
            return currentProducts;
          }

          return [focusedProduct, ...currentProducts];
        });
        setTags((currentTags) => mergeTags(currentTags, focusedProduct.tags));
        setSelectedProductId(focusedProduct.id);
        const nextDraft = productToDraft(focusedProduct);
        resetDraft(nextDraft);
        setIsEditorOpen(true);
      } catch (error) {
        if (!cancelled) {
          setNotice(messageFromError(error, "Não foi possível abrir o produto da notificação."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFocusedProduct();

    return () => {
      cancelled = true;
    };
  }, [initialFocusProductId, products, selectProduct]);

  async function loadProducts(nextPage = 1, sourceFilters = appliedFilters) {
    setIsLoading(true);
    setNotice("");

    try {
      const normalizedFilters = normalizeFilters(sourceFilters);
      const params = new URLSearchParams({
        page: String(nextPage),
        perPage: String(snapshot.perPage),
      });

      if (normalizedFilters.search) params.set("search", normalizedFilters.search);
      if (normalizedFilters.status) params.set("status", normalizedFilters.status);
      if (normalizedFilters.category) params.set("category", normalizedFilters.category);

      const response = await fetch(`${ADMIN_PRODUCTS_API.list}?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message ?? PRODUCT_ERROR_MESSAGES.load);
      }

      const nextSnapshot = json as AdminProductsSnapshot;
      setProducts(nextSnapshot.products);
      setCategories(nextSnapshot.categories);
      setTags(nextSnapshot.tags);
      setIssues(nextSnapshot.issues);
      setPage(nextSnapshot.currentPage);
      setTotalPages(nextSnapshot.totalPages);
      setTotalProducts(nextSnapshot.totalProducts);
      setAppliedFilters(normalizedFilters);

      setSelectedProductId(nextSnapshot.products[0]?.id ?? "new");
      const nextDraft = nextSnapshot.products[0]
        ? productToDraft(nextSnapshot.products[0])
        : newProductDraft();
      resetDraft(nextDraft);
      setIsEditorOpen(false);
    } catch (error) {
      setNotice(messageFromError(error, PRODUCT_ERROR_MESSAGES.load));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    const draftToSave = draftRef.current;

    if (!draftToSave.name.trim()) {
      setNotice(PRODUCT_ERROR_MESSAGES.missingName);
      return false;
    }

    if (
      changedFieldsRef.current.has("regularPrice") &&
      !hasValidProductPrice(draftToSave.regularPrice)
    ) {
      setNotice(PRODUCT_ERROR_MESSAGES.invalidRegularPrice);
      return false;
    }

    if (
      changedFieldsRef.current.has("salePrice") &&
      draftToSave.salePrice.trim() &&
      !hasValidProductPrice(draftToSave.salePrice)
    ) {
      setNotice(PRODUCT_ERROR_MESSAGES.invalidSalePrice);
      return false;
    }

    setIsSaving(true);
    setNotice("");

    try {
      const endpoint =
        selectedProductId === "new"
          ? ADMIN_PRODUCTS_API.list
          : ADMIN_PRODUCTS_API.detail(selectedProductId);
      const response = await fetch(endpoint, {
        body: JSON.stringify(
          buildPayload(
            draftToSave,
            selectedProductId === "new" ? undefined : changedFieldsRef.current,
          ),
        ),
        headers: { "Content-Type": "application/json" },
        method: selectedProductId === "new" ? "POST" : "PATCH",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message ?? PRODUCT_ERROR_MESSAGES.save);
      }

      const savedProduct = json.product as AdminProduct;
      setProducts((currentProducts) => {
        const exists = currentProducts.some((product) => product.id === savedProduct.id);
        if (exists) {
          return currentProducts.map((product) =>
            product.id === savedProduct.id ? savedProduct : product,
          );
        }
        return [savedProduct, ...currentProducts];
      });
      setSelectedProductId(savedProduct.id);
      setTags((currentTags) => mergeTags(currentTags, savedProduct.tags));
      const nextDraft = productToDraft(savedProduct);
      resetDraft(nextDraft);
      setNotice(PRODUCT_NOTICES.saved);
      return true;
    } catch (error) {
      setNotice(messageFromError(error, PRODUCT_ERROR_MESSAGES.save));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpload(file: File, target: ImageUploadTarget) {
    setIsUploading(true);
    setNotice("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(ADMIN_PRODUCTS_API.media, {
        body: formData,
        method: "POST",
      });
      const json = (await response.json().catch(() => null)) as
        | { media?: { alt: string; id: number; src: string }; message?: string }
        | null;

      if (!response.ok || !json?.media) {
        throw new Error(
          response.status === 413
            ? PRODUCT_ERROR_MESSAGES.imageTooLarge
            : json?.message ?? PRODUCT_ERROR_MESSAGES.upload,
        );
      }

      const media = json.media;
      updateDraftState((currentDraft) => ({
        ...currentDraft,
        imageIds:
          target === "cover"
            ? [
                String(media.id),
                ...currentDraft.imageIds.filter((_, index) => index > 0),
              ]
            : [...currentDraft.imageIds, String(media.id)],
        images:
          target === "cover"
            ? [
                {
                  alt: media.alt,
                  id: media.id,
                  position: 0,
                  src: media.src,
                },
                ...currentDraft.images.slice(1).map((image, index) => ({
                  ...image,
                  position: index + 1,
                })),
              ]
            : [
                ...currentDraft.images,
                {
                  alt: media.alt,
                  id: media.id,
                  position: currentDraft.images.length,
                  src: media.src,
                },
              ],
      }), ["imageIds"]);
      setNotice(
        target === "cover" ? PRODUCT_NOTICES.coverUpdated : PRODUCT_NOTICES.secondaryAdded,
      );
    } catch (error) {
      const message = messageFromError(error, PRODUCT_ERROR_MESSAGES.upload);
      setNotice(message);
      options.onUploadError?.(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleCreateTag(name: string, shouldSelect = false) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setNotice(PRODUCT_ERROR_MESSAGES.missingTagName);
      return;
    }

    const existingTag = tags.find(
      (tag) => normalizeKey(tag.name) === normalizeKey(trimmedName),
    );

    if (existingTag) {
      if (shouldSelect) {
        updateDraftState((currentDraft) => ({
          ...currentDraft,
          tagIds: currentDraft.tagIds.includes(String(existingTag.id))
            ? currentDraft.tagIds
            : [...currentDraft.tagIds, String(existingTag.id)],
        }), ["tagIds"]);
      }
      setNewTagName("");
      setNotice(PRODUCT_NOTICES.tagApplied);
      return;
    }

    setIsCreatingTag(true);
    setNotice("");

    try {
      const response = await fetch(ADMIN_PRODUCTS_API.tags, {
        body: JSON.stringify({ name: trimmedName }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message ?? PRODUCT_ERROR_MESSAGES.createTag);
      }

      const tag = json.tag as AdminProductTaxonomyTerm;
      setTags((currentTags) => mergeTags(currentTags, [tag]));
      if (shouldSelect) {
        updateDraftState((currentDraft) => ({
          ...currentDraft,
          tagIds: currentDraft.tagIds.includes(String(tag.id))
            ? currentDraft.tagIds
            : [...currentDraft.tagIds, String(tag.id)],
        }), ["tagIds"]);
      }
      setNewTagName("");
      setNotice(PRODUCT_NOTICES.tagCreated);
    } catch (error) {
      setNotice(messageFromError(error, PRODUCT_ERROR_MESSAGES.createTag));
    } finally {
      setIsCreatingTag(false);
    }
  }

  function updateDraft<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    updateDraftState((currentDraft) => ({ ...currentDraft, [key]: value }), [key]);
  }

  function removeImage(imageId: string) {
    updateDraftState((currentDraft) => ({
      ...currentDraft,
      imageIds: currentDraft.imageIds.filter((id) => id !== imageId),
      images: currentDraft.images.filter((image) => String(image.id) !== imageId),
    }), ["imageIds"]);
  }

  function moveImageToCover(imageId: string) {
    updateDraftState((currentDraft) => {
      const targetImage = currentDraft.images.find(
        (image) => String(image.id) === imageId,
      );

      if (!targetImage) {
        return currentDraft;
      }

      const nextImages = [
        targetImage,
        ...currentDraft.images.filter((image) => String(image.id) !== imageId),
      ].map((image, position) => ({ ...image, position }));
      const nextImageIds = nextImages
        .map((image) => String(image.id))
        .filter((id) => id !== "0");

      return {
        ...currentDraft,
        imageIds: nextImageIds,
        images: nextImages,
      };
    }, ["imageIds"]);
  }

  function toggleDraftTerm(key: DraftTermKey, id: string) {
    updateDraftState((currentDraft) => {
      const currentIds = currentDraft[key];
      return {
        ...currentDraft,
        [key]: currentIds.includes(id)
          ? currentIds.filter((currentId) => currentId !== id)
          : [...currentIds, id],
      };
    }, [key]);
  }

  function togglePromotion(isEnabled: boolean) {
    updateDraftState((currentDraft) => {
      const promotionTagId = promotionTag ? String(promotionTag.id) : "";
      const nextTagIds =
        isEnabled && promotionTagId
          ? Array.from(new Set([...currentDraft.tagIds, promotionTagId]))
          : currentDraft.tagIds.filter((id) => id !== promotionTagId);

      return {
        ...currentDraft,
        tagIds: nextTagIds,
        ...(isEnabled ? {} : { dateOnSaleFrom: "", dateOnSaleTo: "", salePrice: "" }),
      };
    }, isEnabled ? ["tagIds"] : ["tagIds", "dateOnSaleFrom", "dateOnSaleTo", "salePrice"]);

    if (isEnabled && !promotionTag) {
      setNotice(PRODUCT_ERROR_MESSAGES.promotionTagMissing);
    }
  }

  function updateFilter<K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  }

  return {
    appliedFilters,
    catalogSummary,
    categories,
    closeEditor,
    draft,
    filters,
    handleCreateTag,
    handleSave,
    handleUpload,
    isCreatingTag,
    isEditorOpen,
    isLoading,
    isPromotionEnabled,
    isSaving,
    isUploading,
    issues,
    loadProducts,
    moveImageToCover,
    newTagName,
    notice,
    page,
    perPage: snapshot.perPage,
    products,
    removeImage,
    selectedProduct,
    selectedProductId,
    selectProduct,
    setNewTagName,
    startNewProduct,
    tags,
    toggleDraftTerm,
    togglePromotion,
    totalPages,
    totalProducts,
    updateDraft,
    updateFilter,
  };
}

export type UseAdminProductsManagerReturn = ReturnType<typeof useAdminProductsManager>;
