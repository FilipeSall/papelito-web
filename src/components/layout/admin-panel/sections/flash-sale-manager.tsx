"use client";

import { useMemo, useState } from "react";

import type {
  AdminFlashSaleCampaign,
  AdminFlashSaleProduct,
  AdminFlashSaleSnapshot,
} from "@/lib/server/admin-flash-sale";
import type { AdminProduct } from "@/lib/server/admin-products";
import { formatBRL } from "@/lib/format-currency";
import { messageFromError } from "@/utils/error-message";

type FlashSaleManagerProps = {
  snapshot: AdminFlashSaleSnapshot;
  initialCandidates: AdminProduct[];
  initialIssues: string[];
};

type FlashSaleDraft = {
  title: string;
  startsAt: string;
  endsAt: string;
  label: string;
  supportingText: string;
};

const FLASH_SALE_API = "/api/admin/flash-sale";
const PRODUCTS_API = "/api/admin/products";

function campaignToDraft(campaign: AdminFlashSaleCampaign | null): FlashSaleDraft {
  return {
    title: campaign?.title ?? "",
    startsAt: toDatetimeLocal(campaign?.startsAt),
    endsAt: toDatetimeLocal(campaign?.endsAt),
    label: campaign?.label ?? "Oferta Relampago",
    supportingText: campaign?.supportingText ?? "",
  };
}

export function FlashSaleManager({
  snapshot,
  initialCandidates,
  initialIssues,
}: FlashSaleManagerProps) {
  const [draft, setDraft] = useState<FlashSaleDraft>(() => campaignToDraft(snapshot.campaign));
  const [selectedProducts, setSelectedProducts] = useState<AdminFlashSaleProduct[]>(
    snapshot.selectedProducts,
  );
  const [candidates, setCandidates] = useState<AdminProduct[]>(initialCandidates);
  const [issues, setIssues] = useState<string[]>(initialIssues);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const derivedStatus = useMemo(
    () => deriveStatus(draft.startsAt, draft.endsAt),
    [draft.endsAt, draft.startsAt],
  );

  const summaryItems = useMemo(
    () => [
      { label: "Status", value: derivedStatus.label, hint: derivedStatus.description },
      { label: "Produtos", value: String(selectedProducts.length), hint: "ordem manual da home" },
      {
        label: "Janela",
        value: formatWindow(draft.startsAt, draft.endsAt),
        hint: "timezone da loja no WordPress",
      },
    ],
    [derivedStatus.description, derivedStatus.label, draft.endsAt, draft.startsAt, selectedProducts.length],
  );

  async function handleSearchProducts() {
    setIsSearching(true);
    setNotice("");

    try {
      const params = new URLSearchParams({
        page: "1",
        perPage: "12",
        status: "publish",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`${PRODUCTS_API}?${params.toString()}`, { cache: "no-store" });
      const json = (await response.json()) as {
        issues?: string[];
        message?: string;
        products?: AdminProduct[];
      };

      if (!response.ok) {
        throw new Error(json.message ?? "Nao foi possivel consultar produtos.");
      }

      setCandidates(Array.isArray(json.products) ? json.products : []);
      setIssues(Array.isArray(json.issues) ? json.issues : []);
    } catch (error) {
      setNotice(messageFromError(error, "Nao foi possivel consultar produtos."));
    } finally {
      setIsSearching(false);
    }
  }

  function addProduct(product: AdminProduct) {
    if (selectedProducts.some((item) => item.productId === product.id)) {
      setNotice("Produto ja esta na campanha.");
      return;
    }

    setSelectedProducts((current) => [
      ...current,
      {
        id: String(product.id),
        productId: product.id,
        name: product.name,
        sku: product.sku,
        category: product.categories[0]?.name ?? "Produto",
        badge: product.tags[0]?.name ?? "Destaque",
        discount: resolveDiscount(product),
        originalPrice: toMoney(product.regularPrice),
        price: toMoney(product.salePrice || product.price),
        rating: 0,
        reviews: 0,
        image: product.images[0]?.src ?? "",
        permalink: product.permalink,
        status: product.status,
      },
    ]);
    setNotice("");
  }

  function removeProduct(productId: number) {
    setSelectedProducts((current) => current.filter((product) => product.productId !== productId));
    setNotice("");
  }

  function moveProduct(productId: number, direction: -1 | 1) {
    setSelectedProducts((current) => {
      const index = current.findIndex((product) => product.productId === productId);

      if (index < 0) {
        return current;
      }

      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextProducts = [...current];
      const [item] = nextProducts.splice(index, 1);
      nextProducts.splice(nextIndex, 0, item);
      return nextProducts;
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setNotice("");

    try {
      const response = await fetch(FLASH_SALE_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title.trim(),
          startsAt: toApiDatetime(draft.startsAt),
          endsAt: toApiDatetime(draft.endsAt),
          productIds: selectedProducts.map((product) => product.productId),
          label: draft.label.trim(),
          supportingText: draft.supportingText.trim(),
        }),
      });
      const json = (await response.json()) as AdminFlashSaleSnapshot & { message?: string };

      if (!response.ok) {
        throw new Error(json.message ?? "Nao foi possivel salvar a campanha.");
      }

      setDraft(campaignToDraft(json.campaign));
      setSelectedProducts(json.selectedProducts);
      setIssues(json.issues);
      setNotice("Campanha salva.");
    } catch (error) {
      setNotice(messageFromError(error, "Nao foi possivel salvar a campanha."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setNotice("");

    try {
      const response = await fetch(FLASH_SALE_API, { method: "DELETE" });
      const json = (await response.json()) as AdminFlashSaleSnapshot & { message?: string };

      if (!response.ok) {
        throw new Error(json.message ?? "Nao foi possivel remover a campanha.");
      }

      setDraft(campaignToDraft(null));
      setSelectedProducts([]);
      setIssues([]);
      setNotice("Campanha removida.");
    } catch (error) {
      setNotice(messageFromError(error, "Nao foi possivel remover a campanha."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {(notice || issues.length > 0) && (
        <div className="rounded-[18px] border border-[#cfbf80] bg-[#fff6bf] px-4 py-4 text-sm leading-6 text-[#231f20] shadow-[0_10px_30px_rgba(207,191,128,0.16)]">
          {[notice, ...issues].filter(Boolean).join(" ")}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {summaryItems.map((item, index) => (
          <section
            className="animate-admin-panel-enter relative min-h-27 overflow-hidden rounded-[12px] border border-[#231f20]/18 bg-white p-4 text-[#231f20]"
            key={item.label}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div aria-hidden className="absolute left-0 top-0 h-1 w-full bg-[#231f20]/18" />
            <p className="text-sm font-semibold text-[#231f20]/82">{item.label}</p>
            <p
              className="mt-3 text-[1.45rem] font-semibold leading-none text-[#231f20]"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              {item.value}
            </p>
            <p className="mt-3 text-sm leading-5 text-[#231f20]/62">{item.hint}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[12px] border border-[#231f20]/18 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
                campanha
              </p>
              <h3
                className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.04em] text-[#231f20]"
                style={{ fontFamily: "var(--font-admin-display)" }}
              >
                Oferta Relampago
              </h3>
              <p className="mt-2 max-w-[54ch] text-sm leading-6 text-[#5e574c]">
                Uma campanha ativa por vez, sem historico no v1. O payload salvo no plugin passa a
                ser a fonte da home.
              </p>
            </div>
            <div
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                derivedStatus.tone === "warning"
                  ? "bg-[#fff6bf] text-[#6b5a00]"
                  : "bg-[#231f20] text-white"
              }`}
            >
              {derivedStatus.label}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field
              label="Titulo"
              value={draft.title}
              onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
              placeholder="Ex: Giro Hemp Week"
            />
            <Field
              label="Label"
              value={draft.label}
              onChange={(value) => setDraft((current) => ({ ...current, label: value }))}
              placeholder="Ex: Oferta Relampago"
            />
            <Field
              label="Inicio"
              type="datetime-local"
              value={draft.startsAt}
              onChange={(value) => setDraft((current) => ({ ...current, startsAt: value }))}
            />
            <Field
              label="Fim"
              type="datetime-local"
              value={draft.endsAt}
              onChange={(value) => setDraft((current) => ({ ...current, endsAt: value }))}
            />
          </div>

          <label className="mt-4 flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              Supporting text
            </span>
            <textarea
              className="min-h-28 rounded-[12px] border border-[#231f20]/14 bg-[#f6f1e8] px-4 py-3 text-sm leading-6 text-[#231f20] outline-none transition focus:border-[#231f20]/32"
              onChange={(event) =>
                setDraft((current) => ({ ...current, supportingText: event.target.value }))
              }
              placeholder="Texto de apoio exibido ao lado do contador na home."
              value={draft.supportingText}
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="inline-flex h-11 items-center rounded-[12px] bg-[#231f20] px-5 text-sm font-semibold text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isSaving}
              onClick={handleSave}
              type="button"
            >
              {isSaving ? "Salvando..." : "Salvar campanha"}
            </button>
            <button
              className="inline-flex h-11 items-center rounded-[12px] border border-[#231f20]/16 px-5 text-sm font-semibold text-[#231f20] transition hover:bg-[#231f20]/4 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isDeleting}
              onClick={handleDelete}
              type="button"
            >
              {isDeleting ? "Removendo..." : "Remover campanha"}
            </button>
          </div>
        </section>

        <section className="rounded-[12px] border border-[#231f20]/18 bg-[#231f20] p-5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/56">
            preview home
          </p>
          <h3
            className="mt-3 text-[2rem] font-semibold uppercase leading-none tracking-[0.06em]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            {draft.title.trim() || "Oferta Relampago"}
          </h3>
          <p className="mt-4 max-w-[42ch] text-sm leading-6 text-white/78">
            {draft.supportingText.trim() || "A home usara este texto enquanto a campanha estiver ativa."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "starts", value: formatDatePreview(draft.startsAt) },
              { label: "ends", value: formatDatePreview(draft.endsAt) },
              { label: "items", value: String(selectedProducts.length).padStart(2, "0") },
            ].map((item) => (
              <div key={item.label} className="rounded-[16px] border border-white/12 bg-white/6 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/56">
                  {item.label}
                </p>
                <p
                  className="mt-2 text-sm font-semibold uppercase tracking-[0.08em]"
                  style={{ fontFamily: "var(--font-admin-mono)" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3">
            {selectedProducts.length === 0 ? (
              <div className="rounded-[14px] border border-white/12 bg-white/6 px-4 py-4 text-sm text-white/72">
                Nenhum produto selecionado ainda.
              </div>
            ) : (
              selectedProducts.slice(0, 4).map((product) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-[14px] border border-white/12 bg-white/6 px-4 py-3"
                  key={product.productId}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{product.name}</p>
                    <p className="mt-1 text-xs text-white/56">{product.sku || "SKU sem cadastro"}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-[#FFE500]">
                    {formatBRL(product.price)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[12px] border border-[#231f20]/18 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              produtos da campanha
            </p>
            <p className="mt-2 text-sm leading-6 text-[#5e574c]">
              A ordem salva define a ordem da home. O backend rejeita produtos sem imagem ou sem
              preco promocional real.
            </p>
          </div>
          <div className="flex w-full gap-3 md:max-w-xl">
            <input
              className="h-11 flex-1 rounded-[12px] border border-[#231f20]/14 bg-[#f6f1e8] px-4 text-sm text-[#231f20] outline-none transition focus:border-[#231f20]/32"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSearchProducts();
                }
              }}
              placeholder="Buscar por nome ou SKU"
              value={search}
            />
            <button
              className="inline-flex h-11 items-center rounded-[12px] border border-[#231f20]/16 px-4 text-sm font-semibold text-[#231f20] transition hover:bg-[#231f20]/4 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isSearching}
              onClick={handleSearchProducts}
              type="button"
            >
              {isSearching ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              selecionados
            </p>
            {selectedProducts.length === 0 ? (
              <EmptyBlock body="Adicione produtos publicados para montar a campanha." title="Sem produtos" />
            ) : (
              selectedProducts.map((product, index) => (
                <SelectedProductRow
                  index={index}
                  key={product.productId}
                  onMoveDown={() => moveProduct(product.productId, 1)}
                  onMoveUp={() => moveProduct(product.productId, -1)}
                  onRemove={() => removeProduct(product.productId)}
                  product={product}
                  total={selectedProducts.length}
                />
              ))
            )}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              candidatos
            </p>
            {candidates.length === 0 ? (
              <EmptyBlock body="Nenhum produto publicado encontrado para o filtro atual." title="Sem resultados" />
            ) : (
              candidates.map((product) => (
                <CandidateProductRow
                  key={product.id}
                  onAdd={() => addProduct(product)}
                  product={product}
                  selected={selectedProducts.some((item) => item.productId === product.id)}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
        {label}
      </span>
      <input
        className="h-11 rounded-[12px] border border-[#231f20]/14 bg-[#f6f1e8] px-4 text-sm text-[#231f20] outline-none transition focus:border-[#231f20]/32"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function EmptyBlock({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-[#231f20]/18 bg-[#faf7f1] px-4 py-5">
      <p className="text-sm font-semibold text-[#231f20]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[#5e574c]">{body}</p>
    </div>
  );
}

function SelectedProductRow({
  index,
  onMoveDown,
  onMoveUp,
  onRemove,
  product,
  total,
}: {
  index: number;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  product: AdminFlashSaleProduct;
  total: number;
}) {
  return (
    <div className="flex gap-3 rounded-[14px] border border-[#231f20]/14 bg-[#faf7f1] p-3">
      <div className="flex h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-white">
        {product.image ? (
          <img alt={product.name} className="h-full w-full object-cover" src={product.image} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase text-[#8b8374]">
            sem img
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8b8374]">
              slot {(index + 1).toString().padStart(2, "0")}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[#231f20]">{product.name}</p>
            <p className="mt-1 text-xs text-[#5e574c]">
              {product.sku || "SKU sem cadastro"} · {product.category}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#231f20]">{formatBRL(product.price)}</p>
            <p className="mt-1 text-xs text-[#5e574c]">{formatBRL(product.originalPrice)}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded-[10px] border border-[#231f20]/14 px-3 py-1.5 text-xs font-semibold text-[#231f20] disabled:opacity-40"
            disabled={index === 0}
            onClick={onMoveUp}
            type="button"
          >
            Subir
          </button>
          <button
            className="rounded-[10px] border border-[#231f20]/14 px-3 py-1.5 text-xs font-semibold text-[#231f20] disabled:opacity-40"
            disabled={index === total - 1}
            onClick={onMoveDown}
            type="button"
          >
            Descer
          </button>
          <button
            className="rounded-[10px] border border-[#b95b4c]/22 px-3 py-1.5 text-xs font-semibold text-[#9e3a2c]"
            onClick={onRemove}
            type="button"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}

function CandidateProductRow({
  onAdd,
  product,
  selected,
}: {
  onAdd: () => void;
  product: AdminProduct;
  selected: boolean;
}) {
  const image = product.images[0]?.src ?? "";
  const salePrice = toMoney(product.salePrice || product.price);
  const regularPrice = toMoney(product.regularPrice);

  return (
    <div className="flex gap-3 rounded-[14px] border border-[#231f20]/14 bg-white p-3 shadow-[0_10px_24px_rgba(35,31,32,0.04)]">
      <div className="flex h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-[#faf7f1]">
        {image ? (
          <img alt={product.name} className="h-full w-full object-cover" src={image} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase text-[#8b8374]">
            sem img
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#231f20]">{product.name}</p>
            <p className="mt-1 text-xs text-[#5e574c]">
              {product.sku || "SKU sem cadastro"} · {product.categories[0]?.name ?? "Produto"}
            </p>
          </div>
          <button
            className="inline-flex h-9 shrink-0 items-center rounded-[10px] border border-[#231f20]/16 px-3 text-xs font-semibold text-[#231f20] transition hover:bg-[#231f20]/4 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={selected}
            onClick={onAdd}
            type="button"
          >
            {selected ? "Selecionado" : "Adicionar"}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-[#5e574c]">
          <span>Promo: {formatBRL(salePrice)}</span>
          <span>Base: {formatBRL(regularPrice)}</span>
          <span>Status: {product.status}</span>
        </div>
      </div>
    </div>
  );
}

function deriveStatus(startsAt: string, endsAt: string) {
  if (!startsAt || !endsAt) {
    return {
      label: "draft",
      description: "defina inicio, fim e produtos",
      tone: "warning" as const,
    };
  }

  const startsAtMs = Date.parse(startsAt);
  const endsAtMs = Date.parse(endsAt);

  if (Number.isNaN(startsAtMs) || Number.isNaN(endsAtMs) || startsAtMs >= endsAtMs) {
    return {
      label: "invalid",
      description: "janela invalida",
      tone: "warning" as const,
    };
  }

  const now = Date.now();

  if (now < startsAtMs) {
    return {
      label: "scheduled",
      description: "aguardando abertura",
      tone: "default" as const,
    };
  }

  if (now > endsAtMs) {
    return {
      label: "expired",
      description: "janela encerrada",
      tone: "warning" as const,
    };
  }

  return {
    label: "active",
    description: "campanha publica elegivel",
    tone: "default" as const,
  };
}

function toDatetimeLocal(value: string | undefined) {
  if (!value) {
    return "";
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return "";
  }

  const date = new Date(parsed);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatDatePreview(value: string) {
  if (!value) {
    return "--";
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(parsed);
}

function formatWindow(startsAt: string, endsAt: string) {
  if (!startsAt || !endsAt) {
    return "--";
  }

  return `${formatDatePreview(startsAt)} -> ${formatDatePreview(endsAt)}`;
}

function toApiDatetime(value: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function toMoney(value: string) {
  const parsed = Number.parseFloat(value || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveDiscount(product: AdminProduct) {
  const regular = toMoney(product.regularPrice);
  const sale = toMoney(product.salePrice);

  if (regular <= 0 || sale <= 0 || sale >= regular) {
    return 0;
  }

  return Math.round(((regular - sale) / regular) * 100);
}
