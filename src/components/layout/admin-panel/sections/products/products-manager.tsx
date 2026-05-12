"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import { ProductImageFallback } from "@/components/ui";
import type {
  AdminProduct,
  AdminProductImage,
  AdminProductsSnapshot,
  AdminProductTaxonomyTerm,
} from "@/lib/server/admin-products";

import { formatCurrency } from "../../formatters";
import { Panel, StatusBadge } from "../../primitives";

type ProductDraft = {
  categoryIds: string[];
  dateOnSaleFrom: string;
  dateOnSaleTo: string;
  description: string;
  height: string;
  imageIds: string[];
  images: AdminProductImage[];
  length: string;
  manageStock: boolean;
  name: string;
  regularPrice: string;
  salePrice: string;
  shortDescription: string;
  sku: string;
  slug: string;
  status: string;
  stockQuantity: string;
  stockStatus: string;
  tagIds: string[];
  weight: string;
  width: string;
};

type ProductFilters = {
  category: string;
  search: string;
  status: string;
  stockStatus: string;
};

const STATUS_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Publicado", value: "publish" },
  { label: "Rascunho", value: "draft" },
  { label: "Pendente", value: "pending" },
  { label: "Privado", value: "private" },
];

const EDIT_STATUS_OPTIONS = STATUS_OPTIONS.filter((option) => option.value);

const STOCK_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Em estoque", value: "instock" },
  { label: "Sem estoque", value: "outofstock" },
  { label: "Sob encomenda", value: "onbackorder" },
];

const EDIT_STOCK_OPTIONS = STOCK_OPTIONS.filter((option) => option.value);

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#039;/gi, "'");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseDescriptionParagraphs(value: string) {
  const paragraphMatches = Array.from(value.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
  const rawParagraphs =
    paragraphMatches.length > 0
      ? paragraphMatches.map((match) => match[1] ?? "")
      : value
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean);

  const paragraphs = rawParagraphs.map((paragraph) =>
      decodeHtmlEntities(
        paragraph
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/[ \t]+\n/g, "\n")
          .trim(),
      ),
    );

  return paragraphs.length > 0 ? paragraphs : [""];
}

function buildDescriptionHtml(paragraphs: string[]) {
  return paragraphs
    .map((paragraph) => {
      const lines = paragraph
        .split(/\n+/)
        .map((line) => escapeHtml(line.trim()))
        .filter(Boolean);

      return lines.length > 0 ? `<p>${lines.join("<br />\n")}</p>` : "<p></p>";
    })
    .join("\n");
}

function parseMoney(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: string) {
  const parsed = parseMoney(value);
  return parsed > 0 ? formatCurrency(parsed) : "Sem preco";
}

function toDateTimeLocal(value: string) {
  return value ? value.slice(0, 16) : "";
}

function productToDraft(product: AdminProduct): ProductDraft {
  return {
    categoryIds: product.categories.map((category) => String(category.id)),
    dateOnSaleFrom: toDateTimeLocal(product.dateOnSaleFrom),
    dateOnSaleTo: toDateTimeLocal(product.dateOnSaleTo),
    description: product.description,
    height: product.dimensions.height,
    imageIds: product.images.map((image) => String(image.id)).filter((id) => id !== "0"),
    images: product.images,
    length: product.dimensions.length,
    manageStock: product.manageStock,
    name: product.name,
    regularPrice: product.regularPrice,
    salePrice: product.salePrice,
    shortDescription: product.shortDescription,
    sku: product.sku,
    slug: product.slug,
    status: product.status,
    stockQuantity: product.stockQuantity === null ? "" : String(product.stockQuantity),
    stockStatus: product.stockStatus,
    tagIds: product.tags.map((tag) => String(tag.id)),
    weight: product.weight,
    width: product.dimensions.width,
  };
}

function newProductDraft(): ProductDraft {
  return {
    categoryIds: [],
    dateOnSaleFrom: "",
    dateOnSaleTo: "",
    description: "",
    height: "",
    imageIds: [],
    images: [],
    length: "",
    manageStock: true,
    name: "",
    regularPrice: "",
    salePrice: "",
    shortDescription: "",
    sku: "",
    slug: "",
    status: "draft",
    stockQuantity: "",
    stockStatus: "instock",
    tagIds: [],
    weight: "",
    width: "",
  };
}

function buildPayload(draft: ProductDraft) {
  const stockQuantity = draft.stockQuantity.trim()
    ? Number.parseInt(draft.stockQuantity, 10)
    : null;

  return {
    categories: draft.categoryIds.map(Number),
    dateOnSaleFrom: draft.dateOnSaleFrom || null,
    dateOnSaleTo: draft.dateOnSaleTo || null,
    description: draft.description,
    dimensions: {
      height: draft.height,
      length: draft.length,
      width: draft.width,
    },
    images: draft.imageIds.map(Number),
    manageStock: draft.manageStock,
    name: draft.name,
    regularPrice: draft.regularPrice,
    salePrice: draft.salePrice,
    shortDescription: draft.shortDescription,
    sku: draft.sku,
    slug: draft.slug,
    status: draft.status,
    stockQuantity: Number.isInteger(stockQuantity) ? stockQuantity : null,
    stockStatus: draft.stockStatus,
    tags: draft.tagIds.map(Number),
    weight: draft.weight,
  };
}

function termNames(ids: string[], terms: AdminProductTaxonomyTerm[]) {
  const selected = terms.filter((term) => ids.includes(String(term.id)));
  if (selected.length === 0) return "Sem categoria";
  return selected.map((term) => term.name).join(", ");
}

function getFrontendProductHref(product: AdminProduct | null) {
  return product ? `/produtos/${product.id}` : "";
}

function canViewProduct(product: AdminProduct | null) {
  return product?.status === "publish";
}

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function ProductsManager({ snapshot }: { snapshot: AdminProductsSnapshot }) {
  const [products, setProducts] = useState(snapshot.products);
  const [categories, setCategories] = useState(snapshot.categories);
  const [tags, setTags] = useState(snapshot.tags);
  const [issues, setIssues] = useState(snapshot.issues);
  const [page, setPage] = useState(snapshot.currentPage);
  const [totalPages, setTotalPages] = useState(snapshot.totalPages);
  const [totalProducts, setTotalProducts] = useState(snapshot.totalProducts);
  const [filters, setFilters] = useState<ProductFilters>({
    category: "",
    search: "",
    status: "",
    stockStatus: "",
  });
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
  const [notice, setNotice] = useState("");

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const stockSummary = useMemo(() => {
    const lowStock = products.filter(
      (product) =>
        product.manageStock &&
        typeof product.stockQuantity === "number" &&
        product.stockQuantity <= 5,
    ).length;
    const published = products.filter((product) => product.status === "publish").length;
    return { lowStock, published };
  }, [products]);

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

  async function loadProducts(nextPage = 1) {
    setIsLoading(true);
    setNotice("");

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        perPage: String(snapshot.perPage),
      });

      if (filters.search.trim()) params.set("search", filters.search.trim());
      if (filters.status) params.set("status", filters.status);
      if (filters.stockStatus) params.set("stockStatus", filters.stockStatus);
      if (filters.category) params.set("category", filters.category);

      const response = await fetch(`/api/admin/products?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message ?? "Nao foi possivel carregar produtos.");
      }

      const nextSnapshot = json as AdminProductsSnapshot;
      setProducts(nextSnapshot.products);
      setCategories(nextSnapshot.categories);
      setTags(nextSnapshot.tags);
      setIssues(nextSnapshot.issues);
      setPage(nextSnapshot.currentPage);
      setTotalPages(nextSnapshot.totalPages);
      setTotalProducts(nextSnapshot.totalProducts);

      setSelectedProductId(nextSnapshot.products[0]?.id ?? "new");
      setDraft(nextSnapshot.products[0] ? productToDraft(nextSnapshot.products[0]) : newProductDraft());
      setIsEditorOpen(false);
    } catch (error) {
      setNotice(messageFromError(error, "Nao foi possivel carregar produtos."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadProducts(1);
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      setNotice("Informe o nome do produto.");
      return;
    }

    setIsSaving(true);
    setNotice("");

    try {
      const endpoint =
        selectedProductId === "new"
          ? "/api/admin/products"
          : `/api/admin/products/${selectedProductId}`;
      const response = await fetch(endpoint, {
        body: JSON.stringify(buildPayload(draft)),
        headers: { "Content-Type": "application/json" },
        method: selectedProductId === "new" ? "POST" : "PATCH",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message ?? "Nao foi possivel salvar o produto.");
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
      setNotice("Produto salvo.");
    } catch (error) {
      setNotice(messageFromError(error, "Nao foi possivel salvar o produto."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsUploading(true);
    setNotice("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/products/media", {
        body: formData,
        method: "POST",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message ?? "Nao foi possivel enviar imagem.");
      }

      const media = json.media as { alt: string; id: number; src: string };
      setDraft((currentDraft) => ({
        ...currentDraft,
        imageIds: [...currentDraft.imageIds, String(media.id)],
        images: [
          ...currentDraft.images,
          {
            alt: media.alt,
            id: media.id,
            position: currentDraft.images.length,
            src: media.src,
          },
        ],
      }));
      setNotice("Imagem adicionada a galeria.");
    } catch (error) {
      setNotice(messageFromError(error, "Nao foi possivel enviar imagem."));
    } finally {
      setIsUploading(false);
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
      const targetImage = currentDraft.images.find((image) => String(image.id) === imageId);

      if (!targetImage) {
        return currentDraft;
      }

      const nextImages = [
        targetImage,
        ...currentDraft.images.filter((image) => String(image.id) !== imageId),
      ].map((image, position) => ({ ...image, position }));
      const nextImageIds = nextImages.map((image) => String(image.id)).filter((id) => id !== "0");

      return {
        ...currentDraft,
        imageIds: nextImageIds,
        images: nextImages,
      };
    });
  }

  function toggleDraftTerm(key: "categoryIds" | "tagIds", id: string) {
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

  return (
    <div className="space-y-4">
      <Panel>
        <form
          className="grid gap-3 border-b border-[#231f20]/10 px-4 py-4 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr_auto] md:items-end"
          onSubmit={handleFilterSubmit}
        >
          <label className="grid gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/52">
              Busca
            </span>
            <input
              className="min-h-11 rounded-[12px] border-2 border-[#231f20]/18 bg-white px-3 text-sm outline-none transition focus:border-[#231f20]"
              onChange={(event) =>
                setFilters((currentFilters) => ({ ...currentFilters, search: event.target.value }))
              }
              placeholder="Nome, SKU ou slug"
              value={filters.search}
            />
          </label>
          <AdminSelectField
            label="Status"
            onChange={(value) =>
              setFilters((currentFilters) => ({ ...currentFilters, status: value }))
            }
            options={STATUS_OPTIONS}
            placeholder="Todos"
            value={filters.status}
          />
          <AdminSelectField
            label="Estoque"
            onChange={(value) =>
              setFilters((currentFilters) => ({ ...currentFilters, stockStatus: value }))
            }
            options={STOCK_OPTIONS}
            placeholder="Todos"
            value={filters.stockStatus}
          />
          <AdminSelectField
            label="Categoria"
            onChange={(value) =>
              setFilters((currentFilters) => ({ ...currentFilters, category: value }))
            }
            options={[
              { label: "Todas", value: "" },
              ...categories.map((category) => ({
                label: category.name,
                value: String(category.id),
              })),
            ]}
            placeholder="Todas"
            value={filters.category}
          />
          <div className="flex gap-2">
            <button
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[12px] border-2 border-[#231f20] bg-[#ffe500] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#231f20] disabled:opacity-60 md:flex-none"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Filtrando" : "Filtrar"}
            </button>
            <button
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[12px] border-2 border-[#231f20] bg-[#231f20] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#ffe500] md:flex-none"
              onClick={startNewProduct}
              type="button"
            >
              Novo
            </button>
          </div>
        </form>

        <div className="grid divide-y divide-[#231f20]/10 md:grid-cols-4 md:divide-x md:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/48">
              Produtos
            </p>
            <p className="mt-1 text-xl font-semibold">{totalProducts}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/48">
              Pagina
            </p>
            <p className="mt-1 text-xl font-semibold">
              {page}/{Math.max(totalPages, 1)}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/48">
              Publicados na lista
            </p>
            <p className="mt-1 text-xl font-semibold">{stockSummary.published}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/48">
              Baixo estoque
            </p>
            <p className="mt-1 text-xl font-semibold">{stockSummary.lowStock}</p>
          </div>
        </div>
      </Panel>

      {(issues.length > 0 || notice) && (
        <div className="rounded-[14px] border-2 border-[#231f20] bg-[#fff8c5] px-4 py-3 text-sm font-medium text-[#231f20]">
          {[notice, ...issues].filter(Boolean).join(" ")}
        </div>
      )}

      <>
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#231f20]/10 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              Catalogo
            </p>
            <div className="flex gap-2">
              <button
                className="rounded-[10px] border border-[#231f20]/18 px-3 py-2 text-xs font-semibold disabled:opacity-40"
                disabled={page <= 1 || isLoading}
                onClick={() => loadProducts(page - 1)}
                type="button"
              >
                Anterior
              </button>
              <button
                className="rounded-[10px] border border-[#231f20]/18 px-3 py-2 text-xs font-semibold disabled:opacity-40"
                disabled={page >= totalPages || isLoading}
                onClick={() => loadProducts(page + 1)}
                type="button"
              >
                Proxima
              </button>
            </div>
          </div>

          <div className="max-h-[72rem] overflow-auto">
            {products.length === 0 ? (
              <div className="px-5 py-12 text-sm text-[#231f20]/62">
                Nenhum produto encontrado.
              </div>
            ) : (
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead className="sticky top-0 z-10 bg-[#fbf7ef]">
                  <tr>
                    {["produto", "status", "preco", "estoque"].map((header) => (
                      <th
                        className="border-b border-[#231f20]/12 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/48"
                        key={header}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    return (
                      <tr
                        className="cursor-pointer transition hover:bg-[#fff8c5]/70"
                        key={product.id}
                        onClick={() => selectProduct(product)}
                      >
                        <td className="border-b border-[#231f20]/8 px-4 py-3 align-top">
                          <div className="flex gap-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[10px] border border-[#231f20]/12 bg-white">
                              {product.images[0]?.src ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  alt={product.images[0].alt || product.name}
                                  className="h-full w-full object-cover"
                                  src={product.images[0].src}
                                />
                              ) : (
                                <ProductImageFallback className="h-full w-full" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-semibold text-[#231f20]">
                                {product.name}
                              </p>
                              <p className="mt-1 truncate text-xs text-[#231f20]/54">
                                {product.sku || "SKU vazio"} · {product.slug || "sem slug"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="border-b border-[#231f20]/8 px-4 py-3 align-top">
                          <StatusBadge label={product.status} />
                        </td>
                        <td className="border-b border-[#231f20]/8 px-4 py-3 align-top text-sm font-semibold">
                          {formatMoney(product.salePrice || product.regularPrice || product.price)}
                          {product.salePrice ? (
                            <p className="mt-1 text-xs font-normal text-[#9a3f2f]">promo ativa</p>
                          ) : null}
                        </td>
                        <td className="border-b border-[#231f20]/8 px-4 py-3 align-top text-sm">
                          <span className="font-semibold">{product.stockQuantity ?? "n/a"}</span>
                          <p className="mt-1 text-xs text-[#231f20]/54">{product.stockStatus}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Panel>

        {isEditorOpen ? (
          <div
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#231f20]/58 px-3 py-3 backdrop-blur-sm md:px-5 md:py-5"
            role="dialog"
          >
            <div className="relative w-full max-w-[min(96rem,calc(100vw-2rem))]">
              <Panel className="max-h-[calc(100vh-2rem)] overflow-hidden">
                <button
                  aria-label="Fechar modal"
                  className="absolute -right-2 -top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#231f20] bg-[#d9362b] text-lg font-black leading-none text-white shadow-[4px_4px_0_rgba(35,31,32,0.18)] transition hover:bg-[#b92d24] md:-right-3 md:-top-3"
                  onClick={() => setIsEditorOpen(false)}
                  type="button"
                >
                  x
                </button>
          <div className="flex flex-col gap-3 border-b border-[#231f20]/10 px-4 py-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
                {selectedProductId === "new" ? "Novo produto" : `Produto #${selectedProductId}`}
              </p>
              <h3
                className="mt-2 text-2xl font-semibold uppercase tracking-[0.06em]"
                style={{ fontFamily: "var(--font-admin-display)" }}
              >
                {draft.name || "Produto sem nome"}
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-[#231f20]/62">
                {stripHtml(draft.shortDescription || draft.description).slice(0, 150) ||
                  termNames(draft.categoryIds, categories)}
              </p>
            </div>
            <div className="flex gap-2">
              {canViewProduct(selectedProduct) ? (
                <a
                  className="inline-flex min-h-10 items-center rounded-[12px] border-2 border-[#231f20] px-3 text-xs font-semibold uppercase tracking-[0.14em]"
                  href={getFrontendProductHref(selectedProduct)}
                  rel="noreferrer"
                  target="_blank"
                >
                  Ver
                </a>
              ) : null}
              <button
                className="inline-flex min-h-10 items-center rounded-[12px] border-2 border-[#231f20] bg-[#231f20] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#ffe500] disabled:opacity-60"
                disabled={isSaving}
                onClick={handleSave}
                type="button"
              >
                {isSaving ? "Salvando" : "Salvar"}
              </button>
            </div>
          </div>

          <div className="grid max-h-[calc(100vh-9rem)] gap-0 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-4 px-4 py-4">
              <div className="grid gap-3 md:grid-cols-2">
                <TextField
                  label="Nome"
                  onChange={(value) => updateDraft("name", value)}
                  value={draft.name}
                />
                <TextField
                  label="Slug"
                  onChange={(value) => updateDraft("slug", value)}
                  value={draft.slug}
                />
                <TextField
                  label="SKU"
                  onChange={(value) => updateDraft("sku", value)}
                  value={draft.sku}
                />
                <AdminSelectField
                  label="Status"
                  onChange={(value) => updateDraft("status", value)}
                  options={EDIT_STATUS_OPTIONS}
                  placeholder="Status"
                  value={draft.status}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <TextField
                  inputMode="decimal"
                  label="Preco regular"
                  onChange={(value) => updateDraft("regularPrice", value)}
                  value={draft.regularPrice}
                />
                <TextField
                  inputMode="decimal"
                  label="Preco promocional"
                  onChange={(value) => updateDraft("salePrice", value)}
                  value={draft.salePrice}
                />
                <TextField
                  label="Inicio promocao"
                  onChange={(value) => updateDraft("dateOnSaleFrom", value)}
                  type="datetime-local"
                  value={draft.dateOnSaleFrom}
                />
                <TextField
                  label="Fim promocao"
                  onChange={(value) => updateDraft("dateOnSaleTo", value)}
                  type="datetime-local"
                  value={draft.dateOnSaleTo}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <TextField
                  inputMode="numeric"
                  label="Estoque"
                  onChange={(value) => updateDraft("stockQuantity", value)}
                  value={draft.stockQuantity}
                />
                <AdminSelectField
                  label="Situacao"
                  onChange={(value) => updateDraft("stockStatus", value)}
                  options={EDIT_STOCK_OPTIONS}
                  placeholder="Situacao"
                  value={draft.stockStatus}
                />
                <TextField
                  inputMode="decimal"
                  label="Peso"
                  onChange={(value) => updateDraft("weight", value)}
                  value={draft.weight}
                />
                <label className="flex items-end gap-2 rounded-[12px] border-2 border-[#231f20]/18 bg-white px-3 py-3 text-sm font-semibold">
                  <input
                    checked={draft.manageStock}
                    className="h-5 w-5 accent-[#231f20]"
                    onChange={(event) => updateDraft("manageStock", event.target.checked)}
                    type="checkbox"
                  />
                  Controlar estoque
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <TextField
                  inputMode="decimal"
                  label="Comprimento"
                  onChange={(value) => updateDraft("length", value)}
                  value={draft.length}
                />
                <TextField
                  inputMode="decimal"
                  label="Largura"
                  onChange={(value) => updateDraft("width", value)}
                  value={draft.width}
                />
                <TextField
                  inputMode="decimal"
                  label="Altura"
                  onChange={(value) => updateDraft("height", value)}
                  value={draft.height}
                />
              </div>

              <label className="grid gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/52">
                  Descricao curta
                </span>
                <textarea
                  className="min-h-24 rounded-[12px] border-2 border-[#231f20]/18 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#231f20]"
                  onChange={(event) => updateDraft("shortDescription", event.target.value)}
                  value={draft.shortDescription}
                />
              </label>

              <LongDescriptionEditor
                onChange={(value) => updateDraft("description", value)}
                value={draft.description}
              />
            </div>

            <aside className="space-y-4 border-t border-[#231f20]/10 px-4 py-4 xl:border-l xl:border-t-0">
              <TermChecklist
                label="Categorias"
                onToggle={(id) => toggleDraftTerm("categoryIds", id)}
                selectedIds={draft.categoryIds}
                terms={categories}
              />

              <TermChecklist
                label="Tags"
                onToggle={(id) => toggleDraftTerm("tagIds", id)}
                selectedIds={draft.tagIds}
                terms={tags}
              />

              <div className="rounded-[14px] border-2 border-[#231f20]/18 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/52">
                    Fotos do produto
                  </span>
                  <label className="cursor-pointer rounded-[10px] border border-[#231f20] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]">
                    {isUploading ? "Enviando" : "Upload"}
                    <input
                      accept="image/*"
                      className="sr-only"
                      disabled={isUploading}
                      onChange={handleUpload}
                      type="file"
                    />
                  </label>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#231f20]/48">
                      Imagem principal
                    </p>
                    <div className="mt-2 aspect-square overflow-hidden rounded-[12px] border border-[#231f20]/12 bg-[#f7f2e7]">
                      {draft.images[0]?.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={draft.images[0].alt || draft.name || "Produto"}
                          className="h-full w-full object-cover"
                          src={draft.images[0].src}
                        />
                      ) : (
                        <ProductImageFallback className="h-full w-full" />
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#231f20]/48">
                      Fotos secundarias
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {draft.images.slice(1).length === 0 ? (
                        <div className="col-span-2 rounded-[12px] border border-dashed border-[#231f20]/24 px-3 py-8 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#231f20]/42">
                          sem fotos secundarias
                        </div>
                      ) : (
                        draft.images.slice(1).map((image) => (
                          <div
                            className="group relative aspect-square overflow-hidden rounded-[12px] border border-[#231f20]/12 bg-[#f7f2e7]"
                            key={`${image.id}-${image.src}`}
                          >
                            {image.src ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                alt={image.alt || draft.name || "Produto"}
                                className="h-full w-full object-cover"
                                src={image.src}
                              />
                            ) : (
                              <ProductImageFallback className="h-full w-full" />
                            )}
                            <div className="absolute inset-x-1 bottom-1 flex gap-1">
                              <button
                                className="flex-1 rounded-full border border-[#231f20] bg-[#ffe500] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em]"
                                onClick={() => moveImageToCover(String(image.id))}
                                type="button"
                              >
                                capa
                              </button>
                              <button
                                aria-label="Remover foto secundaria"
                                className="rounded-full border border-[#231f20] bg-[#d9362b] px-2 py-1 text-[9px] font-bold text-white"
                                onClick={() => removeImage(String(image.id))}
                                type="button"
                              >
                                x
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
              </Panel>
            </div>
          </div>
        ) : null}
      </>
    </div>
  );
}

function TextField({
  inputMode,
  label,
  onChange,
  type = "text",
  value,
}: {
  inputMode?: "decimal" | "numeric";
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/52">
        {label}
      </span>
      <input
        className="min-h-11 rounded-[12px] border-2 border-[#231f20]/18 bg-white px-3 text-sm outline-none transition focus:border-[#231f20]"
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function LongDescriptionEditor({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  const paragraphs = useMemo(() => parseDescriptionParagraphs(value), [value]);

  function updateParagraph(index: number, nextValue: string) {
    const nextParagraphs = paragraphs.map((paragraph, paragraphIndex) =>
      paragraphIndex === index ? nextValue : paragraph,
    );
    onChange(buildDescriptionHtml(nextParagraphs));
  }

  function addParagraph() {
    onChange(buildDescriptionHtml([...paragraphs, ""]));
  }

  function removeParagraph(index: number) {
    const nextParagraphs = paragraphs.filter((_, paragraphIndex) => paragraphIndex !== index);
    onChange(buildDescriptionHtml(nextParagraphs.length > 0 ? nextParagraphs : [""]));
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/52">
            Descricao longa
          </span>
          <p className="mt-1 text-xs leading-5 text-[#231f20]/56">
            O WordPress salva esse campo como paragrafos HTML. Edite o conteudo em blocos
            visuais; cada bloco vira um paragrafo no produto.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-[12px] border-2 border-[#231f20] bg-[#ffe500] px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#231f20]"
          onClick={addParagraph}
          type="button"
        >
          Adicionar paragrafo
        </button>
      </div>

      <div className="space-y-3 rounded-[14px] border-2 border-[#231f20]/18 bg-white p-3">
        {paragraphs.map((paragraph, index) => (
          <div className="rounded-[12px] border border-[#231f20]/12 bg-[#fbf7ef] p-3" key={index}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#231f20]/48">
                Paragrafo {index + 1}
              </span>
              {paragraphs.length > 1 ? (
                <button
                  className="rounded-full border border-[#231f20]/20 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9a3f2f]"
                  onClick={() => removeParagraph(index)}
                  type="button"
                >
                  remover
                </button>
              ) : null}
            </div>
            <textarea
              className="min-h-24 w-full resize-y rounded-[10px] border-2 border-[#231f20]/14 bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-[#231f20]"
              onChange={(event) => updateParagraph(index, event.target.value)}
              placeholder="Escreva este paragrafo. Quebras de linha viram linhas dentro do mesmo paragrafo."
              value={paragraph}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSelectField({
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: readonly { label: string; value: string }[];
  placeholder: string;
  value: string;
}) {
  return (
    <CheckoutCustomSelect
      label={label}
      labelClassName="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/52"
      listClassName="border-2 border-[#231f20] shadow-[6px_6px_0_rgba(35,31,32,0.12)]"
      onChange={onChange}
      optionClassName="tracking-normal"
      options={options}
      placeholder={placeholder}
      triggerClassName="min-h-11 rounded-[12px] border-2 border-[#231f20]/18 bg-white px-3 text-sm tracking-normal focus:border-[#231f20]"
      value={value}
    />
  );
}

function TermChecklist({
  label,
  onToggle,
  selectedIds,
  terms,
}: {
  label: string;
  onToggle: (id: string) => void;
  selectedIds: string[];
  terms: AdminProductTaxonomyTerm[];
}) {
  return (
    <div className="grid gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/52">
        {label}
      </span>
      <div className="max-h-44 space-y-2 overflow-auto rounded-[12px] border-2 border-[#231f20]/18 bg-white p-2">
        {terms.length === 0 ? (
          <p className="px-2 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#231f20]/42">
            sem opcoes
          </p>
        ) : (
          terms.map((term) => {
            const termId = String(term.id);
            return (
              <label
                className="flex cursor-pointer items-center gap-2 rounded-[10px] px-2 py-2 text-sm transition hover:bg-[#fff8c5]"
                key={term.id}
              >
                <input
                  checked={selectedIds.includes(termId)}
                  className="h-4 w-4 accent-[#231f20]"
                  onChange={() => onToggle(termId)}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1 truncate">{term.name}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
