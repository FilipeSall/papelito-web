"use client";

import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  Coupon,
  CouponDiscountType,
  CouponInput,
  CouponStatus,
} from "@/features/coupons/types/coupon";
import type { SelectOption } from "@/types/admin-products-manager";
import { messageFromError, messageFromResponse } from "@/utils/error-message";

import { InfoTooltip } from "../products/components/form-fields";
import { AdminSelectField } from "../products/components/admin-select-field";

const STATUS_OPTIONS: readonly SelectOption[] = [
  { label: "Ativo (publish)", value: "publish" },
  { label: "Rascunho (draft)", value: "draft" },
];

const DISCOUNT_TYPE_OPTIONS: readonly SelectOption[] = [
  { label: "Percentual", value: "percent" },
  { label: "Valor fixo", value: "fixed_cart" },
];

type CouponFormModalProps = {
  coupon: Coupon | null;
  onClose: () => void;
  onSubmit: (payload: CouponInput, id: number | null) => Promise<string | null>;
};

type VendorOption = {
  id: number;
  name: string;
  storeName: string;
  displayName: string;
  email: string;
};

type AdminProductRow = {
  id: number;
  name: string;
  sku: string;
};

type ProductOptionsResponse = {
  items?: Array<{ id?: number; name?: string; sku?: string }>;
};

const PRODUCT_OPTIONS_ENDPOINT = "/api/admin/coupons/product-options";

function mapProductRows(payload: ProductOptionsResponse): AdminProductRow[] {
  if (!Array.isArray(payload.items)) {
    return [];
  }

  return payload.items
    .map((item) => ({
      id: typeof item.id === "number" ? item.id : 0,
      name: typeof item.name === "string" ? item.name : "",
      sku: typeof item.sku === "string" ? item.sku : "",
    }))
    .filter((item): item is AdminProductRow => item.id > 0 && item.name.length > 0);
}

const COUPON_FIELD_CLASS =
  "mt-2 h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none transition placeholder:text-[#1a1a1a]/40 focus:border-[#1a1a1a] focus:ring-0";

function CouponFieldLabel({ label, text }: { label: string; text: string }) {
  return (
    <span className="flex h-4 items-center gap-1.5 text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]">
      <span>{label}</span>
      <InfoTooltip text={text} />
    </span>
  );
}

function CouponSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="border-t-2 border-[#1a1a1a]/10 pt-5 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-center gap-2">
        <span aria-hidden="true" className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          {title}
        </h4>
      </div>
      {children}
    </section>
  );
}

function buildInitialState(coupon: Coupon | null): CouponInput {
  if (!coupon) {
    return {
      code: "",
      discountType: "percent",
      amount: 10,
      freeShipping: false,
      dateExpires: null,
      usageLimit: 0,
      usageLimitPerUser: 0,
      minimumAmount: 0,
      role: "customer",
      vendorIds: [],
      productIds: [],
      status: "publish",
    };
  }

  return {
    code: coupon.code,
    discountType: coupon.discountType,
    amount: coupon.amount,
    freeShipping: coupon.freeShipping,
    dateExpires: coupon.dateExpires ? coupon.dateExpires.slice(0, 10) : null,
    usageLimit: coupon.usageLimit,
    usageLimitPerUser: coupon.usageLimitPerUser,
    minimumAmount: coupon.minimumAmount,
    role: "customer",
    vendorIds: coupon.vendorIds,
    productIds: coupon.productIds,
    status: coupon.status,
  };
}

export function CouponFormModal({ coupon, onClose, onSubmit }: CouponFormModalProps) {
  const initial = useMemo(() => buildInitialState(coupon), [coupon]);
  const [form, setForm] = useState<CouponInput>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorLoading, setVendorLoading] = useState(false);

  const [vendorError, setVendorError] = useState<string | null>(null);

  const [productOptions, setProductOptions] = useState<AdminProductRow[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [productLabels, setProductLabels] = useState<Record<number, string>>({});
  const productRequestRef = useRef(0);
  const requestedLabelsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const loadVendors = useCallback(async (search: string) => {
    setVendorLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const response = await fetch(`/api/admin/coupons/vendor-options?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setVendorError(await messageFromResponse(response, "Não foi possível carregar os vendors."));
        return;
      }

      const data = (await response.json()) as { items?: VendorOption[] };
      setVendorError(null);
      setVendorOptions(data.items ?? []);
    } catch (error) {
      setVendorError(messageFromError(error, "Não foi possível carregar os vendors."));
    } finally {
      setVendorLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVendors("");
  }, [loadVendors]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadVendors(vendorSearch);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [vendorSearch, loadVendors]);

  const rememberLabels = useCallback((rows: AdminProductRow[]) => {
    if (rows.length === 0) return;
    setProductLabels((prev) => {
      const next = { ...prev };
      for (const row of rows) {
        next[row.id] = row.name;
      }
      return next;
    });
  }, []);

  /**
   * A lista vem pronta na abertura, como a de vendors: o campo de texto só filtra.
   * Enquanto a resposta de um termo novo não chega, a caixa continua mostrando o
   * que já foi carregado — piscar vazio é o que fazia o seletor parecer quebrado.
   */
  const loadProducts = useCallback(async (search: string) => {
    const requestId = productRequestRef.current + 1;
    productRequestRef.current = requestId;
    setProductLoading(true);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const query = params.toString();
      const response = await fetch(
        query ? `${PRODUCT_OPTIONS_ENDPOINT}?${query}` : PRODUCT_OPTIONS_ENDPOINT,
        { cache: "no-store" },
      );

      if (productRequestRef.current !== requestId) return;

      if (!response.ok) {
        setProductError(await messageFromResponse(response, "Não foi possível carregar os produtos."));
        return;
      }

      const rows = mapProductRows((await response.json()) as ProductOptionsResponse);
      if (productRequestRef.current !== requestId) return;

      setProductError(null);
      setProductOptions(rows);
      rememberLabels(rows);
    } catch (error) {
      if (productRequestRef.current !== requestId) return;
      setProductError(messageFromError(error, "Não foi possível carregar os produtos."));
    } finally {
      if (productRequestRef.current === requestId) {
        setProductLoading(false);
      }
    }
  }, [rememberLabels]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadProducts(productSearch);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [productSearch, loadProducts]);

  useEffect(() => {
    const missing = form.productIds.filter(
      (id) => !productLabels[id] && !requestedLabelsRef.current.has(id),
    );
    if (missing.length === 0) return;

    for (const id of missing) {
      requestedLabelsRef.current.add(id);
    }

    void (async () => {
      try {
        const response = await fetch(
          `${PRODUCT_OPTIONS_ENDPOINT}?ids=${missing.join(",")}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        rememberLabels(mapProductRows((await response.json()) as ProductOptionsResponse));
      } catch {
        // O chip cai para "Produto #id"; o erro do seletor já é reportado na caixa.
      }
    })();
  }, [form.productIds, productLabels, rememberLabels]);

  const visibleProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();

    if (!term || !productLoading) {
      return productOptions;
    }

    return productOptions.filter(
      (product) =>
        product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term),
    );
  }, [productOptions, productLoading, productSearch]);

  function toggleVendor(id: number) {
    setForm((prev) => ({
      ...prev,
      vendorIds: prev.vendorIds.includes(id)
        ? prev.vendorIds.filter((v) => v !== id)
        : [...prev.vendorIds, id],
    }));
  }

  function toggleProduct(id: number) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((v) => v !== id)
        : [...prev.productIds, id],
    }));
  }

  function update<K extends keyof CouponInput>(key: K, value: CouponInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const code = form.code.trim().toUpperCase();
    if (!code) {
      setError("Informe um código para o cupom.");
      return;
    }

    if (form.amount <= 0 && !form.freeShipping) {
      setError("Informe um valor de desconto ou marque o frete grátis.");
      return;
    }

    if (form.discountType === "percent" && form.amount > 100) {
      setError("Percentual não pode ultrapassar 100%.");
      return;
    }

    setSubmitting(true);
    const message = await onSubmit(
      { ...form, amount: Math.max(0, form.amount), code, role: "customer" },
      coupon?.id ?? null,
    );
    setSubmitting(false);
    if (message) setError(message);
  }

  return (
    <div
      aria-labelledby="coupon-form-title"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8"
      onClick={onClose}
      role="dialog"
    >
      <form
        className="relative w-full max-w-3xl border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="h-2 w-full bg-brand-yellow" />

        <div className="flex items-start justify-between gap-4 border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">
              Painel admin · cupons
            </p>
            <h3
              className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]"
              id="coupon-form-title"
            >
              {coupon ? `Editar cupom ${coupon.code}` : "Novo cupom"}
            </h3>
          </div>
          <button
            aria-label="Fechar"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-transparent text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <CouponSection title="Regras do cupom">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <CouponFieldLabel
                  label="Código *"
                  text="Código único do cupom. Ele e digitado pelo cliente no carrinho ou checkout."
                />
                <input
                  className={`${COUPON_FIELD_CLASS} font-mono uppercase`}
                  maxLength={50}
                  onChange={(event) => update("code", event.target.value.toUpperCase())}
                  placeholder="EX: FERIAS20"
                  required
                  type="text"
                  value={form.code}
                />
              </label>

              <AdminSelectField
                helpText="Define se o cupom fica disponível para uso imediato ou salvo como rascunho."
                label="Status"
                onChange={(value) => update("status", value as CouponStatus)}
                options={STATUS_OPTIONS}
                placeholder="Selecione"
                value={form.status}
                variant="vendor-create"
              />

              <AdminSelectField
                helpText="Escolha entre desconto percentual sobre o pedido ou valor fixo abatido no total."
                label="Tipo de desconto"
                onChange={(value) => update("discountType", value as CouponDiscountType)}
                options={DISCOUNT_TYPE_OPTIONS}
                placeholder="Selecione"
                value={form.discountType}
                variant="vendor-create"
              />

              <label className="block">
                <CouponFieldLabel
                  label={`Valor ${form.discountType === "percent" ? "(%)" : "(R$)"}`}
                  text={
                    form.discountType === "percent"
                      ? "Percentual de desconto aplicado sobre os itens elegiveis do pedido."
                      : "Valor fixo abatido do total elegível do pedido. Pode ficar em zero num cupom só de frete grátis."
                  }
                />
                <input
                  className={COUPON_FIELD_CLASS}
                  min={0}
                  onChange={(event) => update("amount", Number(event.target.value))}
                  step={form.discountType === "percent" ? 1 : 0.01}
                  type="number"
                  value={form.amount}
                />
              </label>

              <div className="block">
                <CouponFieldLabel
                  label="Frete grátis"
                  text="Abate a modalidade de entrega escolhida no checkout, desde que o subtotal atinja o mínimo configurado em Frete grátis."
                />
                <label className="flex h-11 cursor-pointer items-center gap-3 border-2 border-[#1a1a1a] bg-white px-3">
                  <input
                    checked={form.freeShipping}
                    className="h-4 w-4 cursor-pointer accent-[#1a1a1a]"
                    onChange={(event) => update("freeShipping", event.target.checked)}
                    type="checkbox"
                  />
                  <span className="text-sm font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
                    Concede frete grátis
                  </span>
                </label>
              </div>

              <label className="block">
                <CouponFieldLabel
                  label="Validade"
                  text="Data limite para uso do cupom. Se ficar vazia, o cupom continua sem expiracao."
                />
                <input
                  className={COUPON_FIELD_CLASS}
                  onChange={(event) => update("dateExpires", event.target.value || null)}
                  type="date"
                  value={form.dateExpires ?? ""}
                />
              </label>

              <label className="block">
                <CouponFieldLabel
                  label="Subtotal mínimo (R$)"
                  text="Valor mínimo do subtotal do pedido para liberar o uso do cupom."
                />
                <input
                  className={COUPON_FIELD_CLASS}
                  min={0}
                  onChange={(event) => update("minimumAmount", Number(event.target.value))}
                  step={0.01}
                  type="number"
                  value={form.minimumAmount}
                />
              </label>

              <label className="block">
                <CouponFieldLabel
                  label="Limite total de usos (0 = ilimitado)"
                  text="Quantidade máxima de vezes que o cupom pode ser usado no total."
                />
                <input
                  className={COUPON_FIELD_CLASS}
                  min={0}
                  onChange={(event) => update("usageLimit", Number(event.target.value))}
                  type="number"
                  value={form.usageLimit}
                />
              </label>

              <label className="block">
                <CouponFieldLabel
                  label="Limite por usuário (0 = ilimitado)"
                  text="Quantidade máxima de usos do mesmo cupom por cliente."
                />
                <input
                  className={COUPON_FIELD_CLASS}
                  min={0}
                  onChange={(event) => update("usageLimitPerUser", Number(event.target.value))}
                  type="number"
                  value={form.usageLimitPerUser}
                />
              </label>
            </div>
          </CouponSection>

          <CouponSection title="Restrições (vazio = todos)">
            <div>
              <span className="flex h-4 items-center gap-1.5 text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]">
                <span>Vendors permitidos</span>
                <InfoTooltip text="Se selecionar vendors, o cupom só vale para produtos vendidos por essas lojas." />
              </span>
              <input
                className={COUPON_FIELD_CLASS}
                onChange={(event) => setVendorSearch(event.target.value)}
                placeholder="Buscar vendor por nome ou e-mail"
                type="search"
                value={vendorSearch}
              />
              <div className="mt-2 max-h-40 overflow-y-auto border-2 border-[#1a1a1a] bg-white">
                {vendorError ? (
                  <p className="px-3 py-2 text-xs font-bold text-[#c0392b]">⚠ {vendorError}</p>
                ) : vendorLoading && vendorOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs font-bold text-[#1a1a1a]/60">
                    Carregando vendors...
                  </p>
                ) : vendorOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs font-bold text-[#1a1a1a]/60">
                    Nenhum vendor aprovado encontrado.
                  </p>
                ) : (
                  vendorOptions.map((vendor) => {
                    const checked = form.vendorIds.includes(vendor.id);
                    return (
                      <label
                        className="flex cursor-pointer items-center gap-2 border-b-2 border-[#1a1a1a]/10 px-3 py-2 text-xs last:border-b-0 hover:bg-brand-yellow/30"
                        key={vendor.id}
                      >
                        <input
                          checked={checked}
                          className="h-4 w-4 accent-[#1a1a1a]"
                          onChange={() => toggleVendor(vendor.id)}
                          type="checkbox"
                        />
                        <span className="font-black text-[#1a1a1a]">{vendor.name}</span>
                        <span className="text-[#1a1a1a]/60">{vendor.email}</span>
                      </label>
                    );
                  })
                )}
              </div>
              {form.vendorIds.length > 0 ? (
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#1a1a1a]/60">
                  {form.vendorIds.length} vendor(s) selecionado(s)
                </p>
              ) : null}
            </div>

            <div className="mt-5">
              <span className="flex h-4 items-center gap-1.5 text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]">
                <span>Produtos permitidos</span>
                <InfoTooltip text="Se selecionar produtos, o cupom só vale para esses itens específicos." />
              </span>
              <input
                className={COUPON_FIELD_CLASS}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Buscar produto por nome ou SKU"
                type="search"
                value={productSearch}
              />
              <div className="mt-2 max-h-40 overflow-y-auto border-2 border-[#1a1a1a] bg-white">
                {productError ? (
                  <p className="px-3 py-2 text-xs font-bold text-[#c0392b]">⚠ {productError}</p>
                ) : productLoading && visibleProducts.length === 0 ? (
                  <p className="px-3 py-2 text-xs font-bold text-[#1a1a1a]/60">
                    Carregando produtos...
                  </p>
                ) : visibleProducts.length === 0 ? (
                  <p className="px-3 py-2 text-xs font-bold text-[#1a1a1a]/60">
                    Nenhum produto encontrado.
                  </p>
                ) : (
                  visibleProducts.map((product) => {
                    const checked = form.productIds.includes(product.id);
                    return (
                      <label
                        className="flex cursor-pointer items-center gap-2 border-b-2 border-[#1a1a1a]/10 px-3 py-2 text-xs last:border-b-0 hover:bg-brand-yellow/30"
                        key={product.id}
                      >
                        <input
                          checked={checked}
                          className="h-4 w-4 accent-[#1a1a1a]"
                          onChange={() => toggleProduct(product.id)}
                          type="checkbox"
                        />
                        <span className="font-black text-[#1a1a1a]">{product.name}</span>
                        {product.sku ? (
                          <span className="text-[#1a1a1a]/60">SKU {product.sku}</span>
                        ) : null}
                      </label>
                    );
                  })
                )}
              </div>
              {form.productIds.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {form.productIds.map((id) => (
                    <li
                      className="inline-flex items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-brand-yellow"
                      key={id}
                    >
                      {productLabels[id] ?? `Produto #${id}`}
                      <button
                        aria-label={`Remover produto ${id}`}
                        className="cursor-pointer text-sm leading-none transition hover:text-white"
                        onClick={() => toggleProduct(id)}
                        type="button"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </CouponSection>

          {error ? (
            <div className="border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3">
              <p className="text-sm font-bold text-[#c0392b]">⚠ {error}</p>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-4">
          <button
            className="inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Salvando...
              </>
            ) : coupon ? (
              "Atualizar cupom"
            ) : (
              "Criar cupom"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
