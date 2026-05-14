"use client";

import { useMemo, useState } from "react";

import {
  ADMIN_PRODUCTS_API,
  PRODUCT_ERROR_MESSAGES,
  PRODUCT_NOTICES,
  PUBLISHED_PRODUCT_STATUS,
} from "@/constants/admin-products";
import {
  buildPayload,
  findPromotionTag,
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

export function useAdminProductsManager(snapshot: AdminProductsSnapshot) {
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
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [notice, setNotice] = useState("");

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

  function selectProduct(product: AdminProduct) {
    setSelectedProductId(product.id);
    setDraft(productToDraft(product));
    setNotice("");
    setIsEditorOpen(true);
  }

  function startNewProduct() {
    setSelectedProductId("new");
    setDraft(newProductDraft());
    setNotice("");
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
  }

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
      setDraft(
        nextSnapshot.products[0]
          ? productToDraft(nextSnapshot.products[0])
          : newProductDraft(),
      );
      setIsEditorOpen(false);
    } catch (error) {
      setNotice(messageFromError(error, PRODUCT_ERROR_MESSAGES.load));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      setNotice(PRODUCT_ERROR_MESSAGES.missingName);
      return;
    }

    setIsSaving(true);
    setNotice("");

    try {
      const endpoint =
        selectedProductId === "new"
          ? ADMIN_PRODUCTS_API.list
          : ADMIN_PRODUCTS_API.detail(selectedProductId);
      const response = await fetch(endpoint, {
        body: JSON.stringify(buildPayload(draft)),
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
      setDraft(productToDraft(savedProduct));
      setNotice(PRODUCT_NOTICES.saved);
    } catch (error) {
      setNotice(messageFromError(error, PRODUCT_ERROR_MESSAGES.save));
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
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message ?? PRODUCT_ERROR_MESSAGES.upload);
      }

      const media = json.media as { alt: string; id: number; src: string };
      setDraft((currentDraft) => ({
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
      }));
      setNotice(
        target === "cover" ? PRODUCT_NOTICES.coverUpdated : PRODUCT_NOTICES.secondaryAdded,
      );
    } catch (error) {
      setNotice(messageFromError(error, PRODUCT_ERROR_MESSAGES.upload));
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
        setDraft((currentDraft) => ({
          ...currentDraft,
          tagIds: currentDraft.tagIds.includes(String(existingTag.id))
            ? currentDraft.tagIds
            : [...currentDraft.tagIds, String(existingTag.id)],
        }));
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
      setTags((currentTags) =>
        [...currentTags, tag].sort((left, right) =>
          left.name.localeCompare(right.name, "pt-BR"),
        ),
      );
      if (shouldSelect) {
        setDraft((currentDraft) => ({
          ...currentDraft,
          tagIds: currentDraft.tagIds.includes(String(tag.id))
            ? currentDraft.tagIds
            : [...currentDraft.tagIds, String(tag.id)],
        }));
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
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
  }

  function removeImage(imageId: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      imageIds: currentDraft.imageIds.filter((id) => id !== imageId),
      images: currentDraft.images.filter((image) => String(image.id) !== imageId),
    }));
  }

  function moveImageToCover(imageId: string) {
    setDraft((currentDraft) => {
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
    });
  }

  function toggleDraftTerm(key: DraftTermKey, id: string) {
    setDraft((currentDraft) => {
      const currentIds = currentDraft[key];
      return {
        ...currentDraft,
        [key]: currentIds.includes(id)
          ? currentIds.filter((currentId) => currentId !== id)
          : [...currentIds, id],
      };
    });
  }

  function togglePromotion(isEnabled: boolean) {
    setDraft((currentDraft) => {
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
    });

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
