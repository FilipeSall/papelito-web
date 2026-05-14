"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  AdminFlashSaleProduct,
  AdminFlashSaleSnapshot,
} from "@/lib/server/admin-flash-sale";
import type {
  AdminProduct,
  AdminProductTaxonomyTerm,
} from "@/lib/server/admin-products";
import { messageFromError } from "@/utils/error-message";

import { FlashSaleActionBar } from "./flash-sale-action-bar";
import { FlashSaleCampaignForm } from "./flash-sale-campaign-form";
import { FlashSaleEmptyAlert } from "./flash-sale-empty-alert";
import { FlashSalePageHeader } from "./flash-sale-page-header";
import type {
  FlashSaleNotification,
  FlashSaleNotificationTone,
} from "./flash-sale-notification-bell";
import { FlashSaleToast } from "./flash-sale-toast";
import {
  ProductSearchPicker,
  type ProductPickerFilters,
} from "./product-search-picker";
import { SelectedProductsList } from "./selected-products-list";
import {
  applyDiscount,
  buildProductWarnings,
  campaignToDraft,
  deriveStatus,
  toApiDatetime,
  toMoney,
  type FlashSaleDraft,
} from "./utils";

type FlashSaleManagerProps = {
  initialCandidates: AdminProduct[];
  initialCategories: AdminProductTaxonomyTerm[];
  initialIssues: string[];
  initialPage: number;
  initialPerPage: number;
  initialTotalPages: number;
  initialTotalProducts: number;
  snapshot: AdminFlashSaleSnapshot;
};

const FLASH_SALE_API = "/api/admin/flash-sale";
const PRODUCTS_API = "/api/admin/products";
const FEEDBACK_TTL_MS = 6000;

function logFlashSaleDebug(event: string, payload?: Record<string, unknown>) {
  console.info(`[flash-sale][ui] ${event}`, payload ?? {});
}

type FeedbackEntry = {
  id: string;
  message: string;
  tone: FlashSaleNotificationTone;
};

type ToastState = {
  description: string;
  title: string;
};

type ProductsApiResponse = {
  categories?: AdminProductTaxonomyTerm[];
  currentPage?: number;
  issues?: string[];
  message?: string;
  perPage?: number;
  products?: AdminProduct[];
  totalPages?: number;
  totalProducts?: number;
};

export function FlashSaleManager({
  initialCandidates,
  initialCategories,
  initialIssues,
  initialPage,
  initialPerPage,
  initialTotalPages,
  initialTotalProducts,
  snapshot,
}: FlashSaleManagerProps) {
  const [draft, setDraft] = useState<FlashSaleDraft>(() => campaignToDraft(snapshot.campaign));
  const [selectedProducts, setSelectedProducts] = useState<AdminFlashSaleProduct[]>(
    snapshot.selectedProducts,
  );
  const [candidates, setCandidates] = useState<AdminProduct[]>(initialCandidates);
  const [categories, setCategories] = useState<AdminProductTaxonomyTerm[]>(initialCategories);
  const [pickerFilters, setPickerFilters] = useState<ProductPickerFilters>({
    category: "",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [perPage] = useState(initialPerPage || 24);
  const [totalPages, setTotalPages] = useState(initialTotalPages || 1);
  const [totalProducts, setTotalProducts] = useState(initialTotalProducts || initialCandidates.length);
  const [serverIssues, setServerIssues] = useState<string[]>(initialIssues);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasPersistedCampaign, setHasPersistedCampaign] = useState(Boolean(snapshot.campaign));
  const [toast, setToast] = useState<ToastState | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const feedbackTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pickerFiltersRef = useRef<ProductPickerFilters>({
    category: "",
    search: "",
  });
  const toastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRemoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastEnterFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const timers = feedbackTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      if (toastHideTimerRef.current) {
        clearTimeout(toastHideTimerRef.current);
      }
      if (toastRemoveTimerRef.current) {
        clearTimeout(toastRemoveTimerRef.current);
      }
      if (toastEnterFrameRef.current) {
        cancelAnimationFrame(toastEnterFrameRef.current);
      }
    };
  }, []);

  const pushFeedback = useCallback(
    (tone: FlashSaleNotificationTone, message: string) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      setFeedback((current) => [{ id, message, tone }, ...current].slice(0, 8));
      const timer = setTimeout(() => {
        setFeedback((current) => current.filter((entry) => entry.id !== id));
        feedbackTimers.current.delete(id);
      }, FEEDBACK_TTL_MS);
      feedbackTimers.current.set(id, timer);
    },
    [],
  );

  const fetchCandidates = useCallback(
    async (nextPage: number, filters: ProductPickerFilters) => {
      logFlashSaleDebug("fetch:start", { filters, nextPage, perPage });
      setIsSearching(true);

      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          perPage: String(perPage),
          status: "publish",
        });

        if (filters.search.trim()) {
          params.set("search", filters.search.trim());
        }

        if (filters.category) {
          params.set("category", filters.category);
        }

        const response = await fetch(`${PRODUCTS_API}?${params.toString()}`, {
          cache: "no-store",
        });
        const json = (await response.json()) as ProductsApiResponse;

        if (!response.ok) {
          throw new Error(json.message ?? "Não foi possível consultar produtos.");
        }

        logFlashSaleDebug("fetch:success", {
          currentPage: json.currentPage ?? nextPage,
          filters,
          nextPage,
          productIds: Array.isArray(json.products) ? json.products.slice(0, 10).map((product) => product.id) : [],
          productsCount: Array.isArray(json.products) ? json.products.length : 0,
          totalPages: json.totalPages ?? 1,
          totalProducts: json.totalProducts ?? 0,
        });

        setCandidates(Array.isArray(json.products) ? json.products : []);
        if (Array.isArray(json.categories)) {
          setCategories(json.categories);
        }
        setCurrentPage(typeof json.currentPage === "number" ? json.currentPage : nextPage);
        setTotalPages(typeof json.totalPages === "number" && json.totalPages > 0 ? json.totalPages : 1);
        setTotalProducts(typeof json.totalProducts === "number" ? json.totalProducts : 0);
        if (Array.isArray(json.issues)) {
          setServerIssues(json.issues);
        }
      } catch (error) {
        console.error("[flash-sale][ui] fetch:error", {
          error,
          filters,
          nextPage,
        });
        pushFeedback("error", messageFromError(error, "Não foi possível consultar produtos."));
      } finally {
        setIsSearching(false);
      }
    },
    [perPage, pushFeedback],
  );

  const localWarnings = useMemo(
    () => buildProductWarnings(selectedProducts),
    [selectedProducts],
  );
  const status = useMemo(
    () => deriveStatus(draft.startsAt, draft.endsAt),
    [draft.endsAt, draft.startsAt],
  );
  const hasCampaignContent =
    Boolean(draft.title.trim()) ||
    Boolean(draft.startsAt) ||
    Boolean(draft.endsAt) ||
    draft.discountPercent > 0 ||
    selectedProducts.length > 0;
  const alertContent = useMemo(() => {
    if (!hasCampaignContent) {
      return {
        description:
          "Ainda não há configurações de campanha de Oferta Relâmpago. Preencha o formulário, selecione os produtos e aplique o save quando quiser publicar a vitrine.",
        title: "Sem campanha ativa",
        tone: "warning" as const,
      };
    }

    if (selectedProducts.length === 0) {
      return {
        description:
          "A campanha já pode ser editada, mas ainda não há produtos vinculados. Adicione itens para que a vitrine da home fique completa.",
        title: "Campanha sem produtos",
        tone: "warning" as const,
      };
    }

    if (status.label === "Ativa") {
      return {
        description:
          "A campanha está ativa na home. Todos os itens continuam listados abaixo e você pode alterar período, desconto e produtos a qualquer momento.",
        title: "Campanha ativa na home",
        tone: "active" as const,
      };
    }

    if (status.label === "Agendada") {
      return {
        description:
          "A campanha está pronta e programada. Os produtos seguem visíveis para edição e qualquer ajuste será refletido na próxima publicação.",
        title: "Campanha agendada",
        tone: "active" as const,
      };
    }

    return {
      description:
        "A janela atual já terminou, mas a configuração continua disponível. Você pode editar datas, desconto e produtos para reativar a campanha quando quiser.",
      title: "Campanha encerrada",
      tone: "warning" as const,
    };
  }, [hasCampaignContent, selectedProducts.length, status.label]);

  const showToast = useCallback((nextToast: ToastState) => {
    setToastVisible(false);
    setToast(nextToast);

    if (toastHideTimerRef.current) {
      clearTimeout(toastHideTimerRef.current);
    }
    if (toastRemoveTimerRef.current) {
      clearTimeout(toastRemoveTimerRef.current);
    }
    if (toastEnterFrameRef.current) {
      cancelAnimationFrame(toastEnterFrameRef.current);
    }

    toastEnterFrameRef.current = requestAnimationFrame(() => {
      setToastVisible(true);
    });

    toastHideTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2600);

    toastRemoveTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 2900);
  }, []);

  const notifications = useMemo<FlashSaleNotification[]>(() => {
    const issueEntries: FlashSaleNotification[] = [];
    const merged = new Set([...serverIssues, ...localWarnings]);

    merged.forEach((issue) => {
      issueEntries.push({ id: `issue:${issue}`, message: issue, tone: "warning" });
    });

    const feedbackEntries: FlashSaleNotification[] = feedback.map((entry) => ({
      id: entry.id,
      message: entry.message,
      tone: entry.tone,
    }));

    return [...feedbackEntries, ...issueEntries];
  }, [feedback, localWarnings, serverIssues]);

  const canSave = Boolean(draft.startsAt && draft.endsAt && selectedProducts.length > 0);

  function patchDraft(patch: Partial<FlashSaleDraft>) {
    setDraft((current) => {
      const next = { ...current, ...patch };

      if (patch.discountPercent !== undefined) {
        setSelectedProducts((items) =>
          items.map((item) => ({
            ...item,
            discount: patch.discountPercent ?? 0,
            price: applyDiscount(item.originalPrice, patch.discountPercent ?? 0),
          })),
        );
      }

      return next;
    });
  }

  function handleFiltersChange(patch: Partial<ProductPickerFilters>) {
    const nextFilters = { ...pickerFiltersRef.current, ...patch };
    pickerFiltersRef.current = nextFilters;
    setPickerFilters(nextFilters);
    logFlashSaleDebug("filters:change", { patch, nextFilters });
  }

  function handleApplyFilters() {
    logFlashSaleDebug("filters:apply", { filters: pickerFiltersRef.current });
    void fetchCandidates(1, pickerFiltersRef.current);
  }

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return;
    }
    logFlashSaleDebug("pagination:change", {
      currentPage,
      filters: pickerFiltersRef.current,
      nextPage,
      totalPages,
    });
    void fetchCandidates(nextPage, pickerFiltersRef.current);
  }

  function addProduct(product: AdminProduct) {
    if (selectedProducts.some((item) => item.productId === product.id)) {
      return;
    }

    const image = product.images[0]?.src ?? "";
    const basePrice = toMoney(product.regularPrice) || toMoney(product.price);

    setSelectedProducts((current) => [
      ...current,
      {
        badge: product.tags[0]?.name ?? "Destaque",
        category: product.categories[0]?.name ?? "Produto",
        discount: draft.discountPercent,
        hasImage: image.length > 0,
        id: String(product.id),
        image,
        name: product.name,
        originalPrice: basePrice,
        permalink: product.permalink,
        price: applyDiscount(basePrice, draft.discountPercent),
        productId: product.id,
        rating: 0,
        reviews: 0,
        sku: product.sku,
        status: product.status,
      },
    ]);
  }

  function removeProduct(productId: number) {
    setSelectedProducts((current) => current.filter((product) => product.productId !== productId));
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      const response = await fetch(FLASH_SALE_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title.trim(),
          startsAt: toApiDatetime(draft.startsAt),
          endsAt: toApiDatetime(draft.endsAt),
          productIds: selectedProducts.map((product) => product.productId),
          discountPercent: draft.discountPercent,
        }),
      });
      const json = (await response.json()) as AdminFlashSaleSnapshot & { message?: string };

      if (!response.ok) {
        throw new Error(json.message ?? "Não foi possível salvar a campanha.");
      }

      setDraft(campaignToDraft(json.campaign));
      setSelectedProducts(json.selectedProducts);
      setServerIssues(json.issues);
      setHasPersistedCampaign(true);
      if (hasPersistedCampaign) {
        pushFeedback("success", "Campanha atualizada com sucesso. Alterações já estão na home.");
        showToast({
          description: "Alterações já estão refletidas na home e podem ser ajustadas novamente quando quiser.",
          title: "Campanha atualizada com sucesso.",
        });
      } else {
        pushFeedback("success", "Campanha criada com sucesso. Ela já está na home.");
        showToast({
          description: "A vitrine promocional já está publicada na home e pronta para novos ajustes.",
          title: "Campanha criada com sucesso.",
        });
      }
    } catch (error) {
      pushFeedback("error", messageFromError(error, "Não foi possível salvar a campanha."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const response = await fetch(FLASH_SALE_API, { method: "DELETE" });
      const json = (await response.json()) as AdminFlashSaleSnapshot & { message?: string };

      if (!response.ok) {
        throw new Error(json.message ?? "Não foi possível remover a campanha.");
      }

      setDraft(campaignToDraft(null));
      setSelectedProducts([]);
      setServerIssues(json.issues);
      setHasPersistedCampaign(false);
      pushFeedback("success", "Campanha removida.");
    } catch (error) {
      pushFeedback("error", messageFromError(error, "Não foi possível remover a campanha."));
    } finally {
      setIsDeleting(false);
    }
  }

  const selectedIds = useMemo(
    () => new Set(selectedProducts.map((product) => product.productId)),
    [selectedProducts],
  );

  return (
    <>
      {toast ? (
        <FlashSaleToast
          description={toast.description}
          title={toast.title}
          visible={toastVisible}
        />
      ) : null}

      <div className="w-full space-y-6">
        <FlashSalePageHeader notifications={notifications} />

        <FlashSaleEmptyAlert
          description={alertContent.description}
          title={alertContent.title}
          tone={alertContent.tone}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-6">
            <FlashSaleCampaignForm
              disabled={isSaving || isDeleting}
              draft={draft}
              onChange={patchDraft}
            />
            <ProductSearchPicker
              candidates={candidates}
              categories={categories}
              currentPage={currentPage}
              filters={pickerFilters}
              isSearching={isSearching}
              onAdd={addProduct}
              onApply={handleApplyFilters}
              onFiltersChange={handleFiltersChange}
              onPageChange={handlePageChange}
              selectedIds={selectedIds}
              totalPages={totalPages}
              totalProducts={totalProducts}
            />
          </div>

          <div className="lg:col-span-6">
            <SelectedProductsList
              disabled={isSaving || isDeleting}
              onRemove={removeProduct}
              products={selectedProducts}
            />
          </div>
        </div>
      </div>

      <FlashSaleActionBar
        canSave={canSave}
        isDeleting={isDeleting}
        isSaving={isSaving}
        onDelete={handleDelete}
        onSave={handleSave}
      />
    </>
  );
}
