"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ADMIN_PRODUCTS_API,
  PRODUCT_ERROR_MESSAGES,
  PRODUCT_NOTICES,
  PUBLISHED_PRODUCT_STATUS,
} from "@/constants/admin-products";
import {
  applyTaxonomyToDraft,
  buildPayload,
  buildTaxonomyPayload,
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
  AdminTaxonomySnapshot,
  ProductTaxonomy,
} from "@/lib/server/admin-taxonomy";
import type {
  DraftTermKey,
  ImageUploadTarget,
  ProductDraft,
  ProductFilters,
} from "@/types/admin-products-manager";
import { uploadDirectFile } from "@/lib/client/direct-upload";
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

function productSaveValidationError(
  draft: ProductDraft,
  changedFields: Set<keyof ProductDraft>,
) {
  if (!draft.name.trim()) {
    return PRODUCT_ERROR_MESSAGES.missingName;
  }

  // A regra "exatamente 1 categoria principal" é do banco, não da tela. Aqui é
  // só experiência: falhar antes de gastar uma ida ao WooCommerce.
  if (!draft.taxonomyCategoryId) {
    return PRODUCT_ERROR_MESSAGES.missingCategory;
  }

  if (
    changedFields.has("regularPrice") &&
    !hasValidProductPrice(draft.regularPrice)
  ) {
    return PRODUCT_ERROR_MESSAGES.invalidRegularPrice;
  }

  if (
    changedFields.has("salePrice") &&
    draft.salePrice.trim() &&
    !hasValidProductPrice(draft.salePrice)
  ) {
    return PRODUCT_ERROR_MESSAGES.invalidSalePrice;
  }

  return null;
}

async function saveAdminProduct(
  selectedProductId: number | "new",
  draft: ProductDraft,
  changedFields: Set<keyof ProductDraft>,
) {
  const isNewProduct = selectedProductId === "new";
  const endpoint = isNewProduct
    ? ADMIN_PRODUCTS_API.list
    : ADMIN_PRODUCTS_API.detail(selectedProductId);
  const response = await fetch(endpoint, {
    body: JSON.stringify(
      buildPayload(draft, isNewProduct ? undefined : changedFields),
    ),
    headers: { "Content-Type": "application/json" },
    method: isNewProduct ? "POST" : "PATCH",
  });
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message ?? PRODUCT_ERROR_MESSAGES.save);
  }

  return json.product as AdminProduct;
}

async function saveAdminProductTaxonomy(
  selectedProductId: number | "new",
  savedProduct: AdminProduct,
  draft: ProductDraft,
): Promise<{ ok: true } | { message: string; ok: false }> {
  const response = await fetch(
    `/api/admin/products/${savedProduct.id}/taxonomy`,
    {
      body: JSON.stringify(buildTaxonomyPayload(draft)),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    },
  );

  if (response.ok) {
    return { ok: true };
  }

  const json = (await response.json().catch(() => null)) as {
    message?: string;
  } | null;
  const errorMessage = json?.message ?? PRODUCT_ERROR_MESSAGES.saveTaxonomy;

  if (
    selectedProductId === "new" &&
    savedProduct.status === PUBLISHED_PRODUCT_STATUS
  ) {
    const rollbackResponse = await fetch(
      ADMIN_PRODUCTS_API.detail(savedProduct.id),
      {
        body: JSON.stringify({ status: "draft" }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      },
    );

    if (!rollbackResponse.ok) {
      return {
        message: `${errorMessage} Não foi possível reverter o produto para rascunho.`,
        ok: false,
      };
    }
  }

  return {
    message:
      selectedProductId === "new"
        ? `${errorMessage} O produto foi mantido como rascunho.`
        : `${errorMessage} A classificação anterior foi preservada.`,
    ok: false,
  };
}

function upsertAdminProduct(
  currentProducts: AdminProduct[],
  savedProduct: AdminProduct,
) {
  const exists = currentProducts.some(
    (product) => product.id === savedProduct.id,
  );

  if (exists) {
    return currentProducts.map((product) =>
      product.id === savedProduct.id ? savedProduct : product,
    );
  }

  return [savedProduct, ...currentProducts];
}

export function useAdminProductsManager(
  snapshot: AdminProductsSnapshot,
  options: {
    initialFocusProductId?: number | null;
    excludedProductIds?: number[];
    onUploadError?: (message: string) => void;
    taxonomy?: AdminTaxonomySnapshot;
  } = {},
) {
  const initialFocusProductId = options.initialFocusProductId ?? null;
  const excludedProductIds = useMemo(
    () => new Set(options.excludedProductIds ?? []),
    [options.excludedProductIds],
  );
  const taxonomy = options.taxonomy ?? {
    categories: [],
    collections: [],
    issues: [],
    version: 0,
  };
  const [isTaxonomyLoading, setIsTaxonomyLoading] = useState(false);
  const taxonomyRequestRef = useRef(0);
  const [products, setProducts] = useState(snapshot.products);
  const [tags, setTags] = useState(snapshot.tags);
  const [issues, setIssues] = useState(snapshot.issues);
  const [page, setPage] = useState(snapshot.currentPage);
  const [totalPages, setTotalPages] = useState(snapshot.totalPages);
  const [totalProducts, setTotalProducts] = useState(snapshot.totalProducts);
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<ProductFilters>(EMPTY_FILTERS);
  const [selectedProductId, setSelectedProductId] = useState<number | "new">(
    snapshot.products[0]?.id ?? "new",
  );
  const [draft, setDraft] = useState<ProductDraft>(
    snapshot.products[0]
      ? productToDraft(snapshot.products[0])
      : newProductDraft(),
  );
  const draftRef = useRef(draft);
  const changedFieldsRef = useRef<Set<keyof ProductDraft>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isOpeningProduct, setIsOpeningProduct] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isPromotionScheduled, setIsPromotionScheduled] = useState(false);
  const [notice, setNotice] = useState("");
  const handledInitialFocusRef = useRef(false);
  const selectionRequestRef = useRef(0);

  const resetDraft = useCallback((nextDraft: ProductDraft) => {
    draftRef.current = nextDraft;
    changedFieldsRef.current = new Set();
    // Trocar de produto zera a intenção; o agendamento do produto carregado volta a
    // sair das datas e da tag dele.
    setIsPromotionScheduled(false);
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
    const drafts = products.filter(
      (product) => product.status === "draft",
    ).length;
    const promotionTag = findPromotionTag(tags);
    const promotions = products.filter((product) =>
      isPromotionActive(product, promotionTag?.id),
    ).length;
    return { drafts, promotions, published };
  }, [products, tags]);

  const promotionTag = useMemo(() => findPromotionTag(tags), [tags]);
  /**
   * Preço promocional preenchido NÃO marca o agendamento sozinho.
   *
   * Digitar o preço só habilita o toggle; agendar continua sendo uma decisão de quem
   * edita. Derivar de `salePrice` marcava a opção no meio da digitação e abria os campos
   * de data por conta própria.
   */
  const isPromotionEnabled =
    isPromotionScheduled ||
    Boolean(draft.dateOnSaleFrom || draft.dateOnSaleTo) ||
    Boolean(promotionTag && draft.tagIds.includes(String(promotionTag.id)));

  /**
   * A listagem vem da REST do WooCommerce e não conhece a taxonomia Papelito, que
   * mora em tabelas próprias. Ela é buscada quando o editor abre, por produto.
   */
  const loadProductTaxonomy = useCallback(async (productId: number) => {
    const requestId = taxonomyRequestRef.current + 1;
    taxonomyRequestRef.current = requestId;
    setIsTaxonomyLoading(true);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/taxonomy`,
        {
          cache: "no-store",
        },
      );
      const json = (await response.json().catch(() => null)) as {
        taxonomy?: ProductTaxonomy;
      } | null;

      if (
        !response.ok ||
        !json?.taxonomy ||
        taxonomyRequestRef.current !== requestId
      ) {
        return;
      }

      // Escreve direto no rascunho, sem passar por `updateDraftState`: carregar o
      // estado existente NÃO pode marcar os campos como alterados, senão um
      // salvamento parcial passaria a reenviar taxonomia que ninguém tocou.
      const loaded = json.taxonomy;
      setDraft((currentDraft) => {
        const nextDraft = applyTaxonomyToDraft(currentDraft, loaded);
        draftRef.current = nextDraft;
        return nextDraft;
      });
    } catch {
      // Falha de rede não pode travar a edição do produto: os campos ficam
      // vazios e o gate de "salvar sem categoria" avisa o admin.
    } finally {
      if (taxonomyRequestRef.current === requestId) {
        setIsTaxonomyLoading(false);
      }
    }
  }, []);

  const openProduct = useCallback(
    (product: AdminProduct) => {
      setSelectedProductId(product.id);
      setTags((currentTags) => mergeTags(currentTags, product.tags));
      const nextDraft = productToDraft(product);
      resetDraft(nextDraft);
      setNotice("");
      setIsEditorOpen(true);
      void loadProductTaxonomy(product.id);
    },
    [loadProductTaxonomy, resetDraft],
  );

  const selectProduct = useCallback(
    async (product: AdminProduct) => {
      if (product.type !== "variable") {
        openProduct(product);
        return;
      }

      const requestId = selectionRequestRef.current + 1;
      selectionRequestRef.current = requestId;
      setIsLoading(true);
      setIsOpeningProduct(true);
      setNotice("");

      try {
        const response = await fetch(ADMIN_PRODUCTS_API.detail(product.id), {
          cache: "no-store",
        });
        const json = (await response.json().catch(() => null)) as {
          message?: string;
          product?: AdminProduct;
        } | null;

        if (!response.ok || !json?.product) {
          throw new Error(json?.message ?? PRODUCT_ERROR_MESSAGES.load);
        }

        if (selectionRequestRef.current !== requestId) {
          return;
        }

        const detailedProduct = json.product;
        setProducts((currentProducts) =>
          currentProducts.map((currentProduct) =>
            currentProduct.id === detailedProduct.id
              ? detailedProduct
              : currentProduct,
          ),
        );
        openProduct(detailedProduct);
      } catch (error) {
        if (selectionRequestRef.current === requestId) {
          setNotice(
            messageFromError(
              error,
              "Não foi possível carregar os preços do produto.",
            ),
          );
        }
      } finally {
        if (selectionRequestRef.current === requestId) {
          setIsLoading(false);
          setIsOpeningProduct(false);
        }
      }
    },
    [openProduct],
  );

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
    const existingProduct = products.find(
      (product) => product.id === initialFocusProductId,
    );

    if (existingProduct) {
      void selectProduct(existingProduct);
      return;
    }

    let cancelled = false;
    const focusedProductId = initialFocusProductId;

    async function loadFocusedProduct() {
      setIsLoading(true);
      setIsOpeningProduct(true);
      setNotice("");

      try {
        const response = await fetch(
          ADMIN_PRODUCTS_API.detail(focusedProductId),
          {
            cache: "no-store",
          },
        );
        const json = (await response.json().catch(() => null)) as {
          message?: string;
          product?: AdminProduct;
        } | null;

        if (!response.ok || !json?.product) {
          throw new Error(json?.message ?? PRODUCT_ERROR_MESSAGES.load);
        }

        const focusedProduct = json.product;

        if (cancelled) {
          return;
        }

        if (excludedProductIds.has(focusedProduct.id)) {
          setNotice("Este produto é gerenciado na aba Kits.");
          return;
        }

        setProducts((currentProducts) => {
          if (
            currentProducts.some((product) => product.id === focusedProduct.id)
          ) {
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
          setNotice(
            messageFromError(
              error,
              "Não foi possível abrir o produto da notificação.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsOpeningProduct(false);
        }
      }
    }

    void loadFocusedProduct();

    return () => {
      cancelled = true;
    };
  }, [excludedProductIds, initialFocusProductId, products, resetDraft, selectProduct]);

  async function loadProducts(nextPage = 1, sourceFilters = appliedFilters) {
    setIsLoading(true);
    setNotice("");

    try {
      const normalizedFilters = normalizeFilters(sourceFilters);
      const params = new URLSearchParams({
        page: String(nextPage),
        perPage: String(snapshot.perPage),
      });
      if (excludedProductIds.size > 0) {
        params.set("exclude", Array.from(excludedProductIds).join(","));
      }

      if (normalizedFilters.search)
        params.set("search", normalizedFilters.search);
      if (normalizedFilters.status)
        params.set("status", normalizedFilters.status);
      if (normalizedFilters.category)
        params.set("category", normalizedFilters.category);

      const response = await fetch(
        `${ADMIN_PRODUCTS_API.list}?${params.toString()}`,
        {
          cache: "no-store",
        },
      );
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message ?? PRODUCT_ERROR_MESSAGES.load);
      }

      const nextSnapshot = json as AdminProductsSnapshot;
      const visibleProducts = nextSnapshot.products.filter(
        (product) => !excludedProductIds.has(product.id),
      );
      setProducts(visibleProducts);
      setTags(nextSnapshot.tags);
      setIssues(nextSnapshot.issues);
      setPage(nextSnapshot.currentPage);
      setTotalPages(nextSnapshot.totalPages);
      setTotalProducts(nextSnapshot.totalProducts);
      setAppliedFilters(normalizedFilters);

      setSelectedProductId(visibleProducts[0]?.id ?? "new");
      const nextDraft = visibleProducts[0]
        ? productToDraft(visibleProducts[0])
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

    const validationError = productSaveValidationError(
      draftToSave,
      changedFieldsRef.current,
    );
    if (validationError) {
      setNotice(validationError);
      return false;
    }

    setIsSaving(true);
    setNotice("");

    try {
      const savedProduct = await saveAdminProduct(
        selectedProductId,
        draftToSave,
        changedFieldsRef.current,
      );
      const taxonomyResult = await saveAdminProductTaxonomy(
        selectedProductId,
        savedProduct,
        draftToSave,
      );

      if (!taxonomyResult.ok) {
        setNotice(taxonomyResult.message);
        return false;
      }

      setProducts((currentProducts) =>
        upsertAdminProduct(currentProducts, savedProduct),
      );
      setSelectedProductId(savedProduct.id);
      setTags((currentTags) => mergeTags(currentTags, savedProduct.tags));
      const nextDraft = applyTaxonomyToDraft(productToDraft(savedProduct), {
        category: { id: Number(draftToSave.taxonomyCategoryId) },
        collections: draftToSave.taxonomyCollections,
        subcategories: draftToSave.taxonomySubcategoryIds.map((id) => ({
          id: Number(id),
        })),
      });
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
      const json = await uploadDirectFile<{
        media?: { alt: string; id: number; src: string };
      }>("media", file);
      if (!json.media) {
        throw new Error(PRODUCT_ERROR_MESSAGES.upload);
      }

      const media = json.media;
      updateDraftState(
        (currentDraft) => ({
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
        }),
        ["imageIds"],
      );
      setNotice(
        target === "cover"
          ? PRODUCT_NOTICES.coverUpdated
          : PRODUCT_NOTICES.secondaryAdded,
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
        updateDraftState(
          (currentDraft) => ({
            ...currentDraft,
            tagIds: currentDraft.tagIds.includes(String(existingTag.id))
              ? currentDraft.tagIds
              : [...currentDraft.tagIds, String(existingTag.id)],
          }),
          ["tagIds"],
        );
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
        updateDraftState(
          (currentDraft) => ({
            ...currentDraft,
            tagIds: currentDraft.tagIds.includes(String(tag.id))
              ? currentDraft.tagIds
              : [...currentDraft.tagIds, String(tag.id)],
          }),
          ["tagIds"],
        );
      }
      setNewTagName("");
      setNotice(PRODUCT_NOTICES.tagCreated);
    } catch (error) {
      setNotice(messageFromError(error, PRODUCT_ERROR_MESSAGES.createTag));
    } finally {
      setIsCreatingTag(false);
    }
  }

  function updateDraft<K extends keyof ProductDraft>(
    key: K,
    value: ProductDraft[K],
  ) {
    updateDraftState(
      (currentDraft) => ({ ...currentDraft, [key]: value }),
      [key],
    );
  }

  function removeImage(imageId: string) {
    updateDraftState(
      (currentDraft) => ({
        ...currentDraft,
        imageIds: currentDraft.imageIds.filter((id) => id !== imageId),
        images: currentDraft.images.filter(
          (image) => String(image.id) !== imageId,
        ),
      }),
      ["imageIds"],
    );
  }

  function moveImageToCover(imageId: string) {
    updateDraftState(
      (currentDraft) => {
        const targetImage = currentDraft.images.find(
          (image) => String(image.id) === imageId,
        );

        if (!targetImage) {
          return currentDraft;
        }

        const nextImages = [
          targetImage,
          ...currentDraft.images.filter(
            (image) => String(image.id) !== imageId,
          ),
        ].map((image, position) => ({ ...image, position }));
        const nextImageIds = nextImages
          .map((image) => String(image.id))
          .filter((id) => id !== "0");

        return {
          ...currentDraft,
          imageIds: nextImageIds,
          images: nextImages,
        };
      },
      ["imageIds"],
    );
  }

  function toggleDraftTerm(key: DraftTermKey, id: string) {
    updateDraftState(
      (currentDraft) => {
        const currentIds = currentDraft[key];
        return {
          ...currentDraft,
          [key]: currentIds.includes(id)
            ? currentIds.filter((currentId) => currentId !== id)
            : [...currentIds, id],
        };
      },
      [key],
    );
  }

  function togglePromotion(isEnabled: boolean) {
    // Marcar precisa valer por si: sem a tag de promoção no WooCommerce e com as datas
    // ainda vazias, não sobraria nada de onde derivar o estado marcado.
    setIsPromotionScheduled(isEnabled);

    updateDraftState(
      (currentDraft) => {
        const promotionTagId = promotionTag ? String(promotionTag.id) : "";
        const nextTagIds =
          isEnabled && promotionTagId
            ? Array.from(new Set([...currentDraft.tagIds, promotionTagId]))
            : currentDraft.tagIds.filter((id) => id !== promotionTagId);

        // Desmarcar cancela o agendamento, não o preço: `salePrice` tem campo próprio e
        // é o que habilita o toggle — limpá-lo aqui desabilitaria a opção que acabou de
        // ser desmarcada, sem o preço de volta.
        return {
          ...currentDraft,
          tagIds: nextTagIds,
          ...(isEnabled ? {} : { dateOnSaleFrom: "", dateOnSaleTo: "" }),
        };
      },
      isEnabled ? ["tagIds"] : ["tagIds", "dateOnSaleFrom", "dateOnSaleTo"],
    );

    if (isEnabled && !promotionTag) {
      setNotice(PRODUCT_ERROR_MESSAGES.promotionTagMissing);
    }
  }

  /**
   * Trocar a categoria principal LIMPA as subcategorias.
   *
   * Elas pertenciam à categoria anterior; o backend recusaria o conjunto com
   * `papelito_subcategory_foreign`. Limpar aqui evita o erro e deixa o efeito
   * explícito para quem está editando.
   */
  function setTaxonomyCategory(categoryId: string) {
    updateDraftState(
      (currentDraft) =>
        currentDraft.taxonomyCategoryId === categoryId
          ? currentDraft
          : {
              ...currentDraft,
              taxonomyCategoryId: categoryId,
              taxonomySubcategoryIds: [],
            },
      ["taxonomyCategoryId", "taxonomySubcategoryIds"],
    );
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
    closeEditor,
    isTaxonomyLoading,
    setTaxonomyCategory,
    taxonomy,
    draft,
    filters,
    handleCreateTag,
    handleSave,
    handleUpload,
    isCreatingTag,
    isEditorOpen,
    isLoading,
    isOpeningProduct,
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

export type UseAdminProductsManagerReturn = ReturnType<
  typeof useAdminProductsManager
>;
