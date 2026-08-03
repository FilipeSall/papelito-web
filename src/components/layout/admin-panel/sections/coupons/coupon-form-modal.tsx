"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  Coupon,
  CouponDiscountType,
  CouponInput,
  CouponStatus,
} from "@/features/coupons/types/coupon";
import type { SelectOption } from "@/types/admin-products-manager";

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

type AdminProductsResponse = {
  products?: Array<{ id?: number; name?: string; sku?: string }>;
};

function CouponFieldLabel({ label, text }: { label: string; text: string }) {
  return (
    <span className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase leading-none tracking-[0.18em] text-[#4b4731]">
      <span className="leading-none">{label}</span>
      <InfoTooltip text={text} />
    </span>
  );
}

function buildInitialState(coupon: Coupon | null): CouponInput {
  if (!coupon) {
    return {
      code: "",
      discountType: "percent",
      amount: 10,
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

  const [productResults, setProductResults] = useState<AdminProductRow[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [productLabels, setProductLabels] = useState<Record<number, string>>({});

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
      if (!response.ok) return;
      const data = (await response.json()) as { items?: VendorOption[] };
      setVendorOptions(data.items ?? []);
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

  useEffect(() => {
    if (form.productIds.length === 0) return;
    const missing = form.productIds.filter((id) => !productLabels[id]);
    if (missing.length === 0) return;

    void (async () => {
      const updates: Record<number, string> = {};
      for (const id of missing) {
        try {
          const response = await fetch(`/wp-json/wp/v2/product/${id}?_fields=id,title`, {
            cache: "force-cache",
          });
          if (response.ok) {
            const product = (await response.json()) as { title?: { rendered?: string } };
            if (product?.title?.rendered) updates[id] = product.title.rendered;
          }
        } catch {
          // ignore
        }
      }
      if (Object.keys(updates).length > 0) {
        setProductLabels((prev) => ({ ...prev, ...updates }));
      }
    })();
  }, [form.productIds, productLabels]);

  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return;
    }
    setProductLoading(true);
    const handle = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          search: productSearch.trim(),
          perPage: "20",
          status: "publish",
        });
        const response = await fetch(`/api/admin/products?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as AdminProductsResponse;
        const rows: AdminProductRow[] = Array.isArray(data.products)
          ? data.products
              .map((p) => ({
                id: typeof p.id === "number" ? p.id : 0,
                name: typeof p.name === "string" ? p.name : "",
                sku: typeof p.sku === "string" ? p.sku : "",
              }))
              .filter((p): p is AdminProductRow => p.id > 0 && p.name.length > 0)
          : [];
        setProductResults(rows);
        setProductLabels((prev) => {
          const next = { ...prev };
          for (const row of rows) {
            next[row.id] = row.name;
          }
          return next;
        });
      } finally {
        setProductLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [productSearch]);

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

    if (form.amount <= 0) {
      setError("O valor do desconto precisa ser maior que zero.");
      return;
    }

    if (form.discountType === "percent" && form.amount > 100) {
      setError("Percentual não pode ultrapassar 100%.");
      return;
    }

    setSubmitting(true);
    const message = await onSubmit({ ...form, code, role: "customer" }, coupon?.id ?? null);
    setSubmitting(false);
    if (message) setError(message);
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#231f20]/10 px-6 py-4">
          <h3 className="text-lg font-semibold text-[#1e1c10]">
            {coupon ? `Editar cupom ${coupon.code}` : "Novo cupom"}
          </h3>
          <button
            type="button"
            aria-label="Fechar"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#1e1c10] transition hover:bg-[#f6f1da]"
            onClick={onClose}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <CouponFieldLabel
                label="Código"
                text="Código único do cupom. Ele e digitado pelo cliente no carrinho ou checkout."
              />
              <input
                type="text"
                className="h-11 w-full rounded-xl border border-[#cec7aa] bg-[#fff9ea] px-4 font-mono text-sm uppercase outline-none focus:border-[#6a5f00] focus:ring-1 focus:ring-[#6a5f00]"
                maxLength={50}
                value={form.code}
                onChange={(event) => update("code", event.target.value.toUpperCase())}
                placeholder="EX: FERIAS20"
                required
              />
            </label>

            <AdminSelectField
              helpText="Define se o cupom fica disponível para uso imediato ou salvo como rascunho."
              label="Status"
              onChange={(value) => update("status", value as CouponStatus)}
              options={STATUS_OPTIONS}
              placeholder="Selecione"
              value={form.status}
            />

            <AdminSelectField
              helpText="Escolha entre desconto percentual sobre o pedido ou valor fixo abatido no total."
              label="Tipo de desconto"
              onChange={(value) => update("discountType", value as CouponDiscountType)}
              options={DISCOUNT_TYPE_OPTIONS}
              placeholder="Selecione"
              value={form.discountType}
            />

            <label className="block text-sm">
              <CouponFieldLabel
                label={`Valor ${form.discountType === "percent" ? "(%)" : "(R$)"}`}
                text={
                  form.discountType === "percent"
                    ? "Percentual de desconto aplicado sobre os itens elegiveis do pedido."
                    : "Valor fixo abatido do total elegível do pedido."
                }
              />
              <input
                type="number"
                className="h-11 w-full rounded-xl border border-[#cec7aa] bg-[#fff9ea] px-4 text-sm outline-none focus:border-[#6a5f00] focus:ring-1 focus:ring-[#6a5f00]"
                min={0}
                step={form.discountType === "percent" ? 1 : 0.01}
                value={form.amount}
                onChange={(event) => update("amount", Number(event.target.value))}
                required
              />
            </label>

            <label className="block text-sm">
              <CouponFieldLabel
                label="Validade"
                text="Data limite para uso do cupom. Se ficar vazia, o cupom continua sem expiracao."
              />
              <input
                type="date"
                className="h-11 w-full rounded-xl border border-[#cec7aa] bg-[#fff9ea] px-3 text-sm outline-none focus:border-[#6a5f00] focus:ring-1 focus:ring-[#6a5f00]"
                value={form.dateExpires ?? ""}
                onChange={(event) => update("dateExpires", event.target.value || null)}
              />
            </label>

            <label className="block text-sm">
              <CouponFieldLabel
                label="Subtotal mínimo (R$)"
                text="Valor mínimo do subtotal do pedido para liberar o uso do cupom."
              />
              <input
                type="number"
                className="h-11 w-full rounded-xl border border-[#cec7aa] bg-[#fff9ea] px-4 text-sm outline-none focus:border-[#6a5f00] focus:ring-1 focus:ring-[#6a5f00]"
                min={0}
                step={0.01}
                value={form.minimumAmount}
                onChange={(event) => update("minimumAmount", Number(event.target.value))}
              />
            </label>

            <label className="block text-sm">
              <CouponFieldLabel
                label="Limite total de usos (0 = ilimitado)"
                text="Quantidade máxima de vezes que o cupom pode ser usado no total."
              />
              <input
                type="number"
                className="h-11 w-full rounded-xl border border-[#cec7aa] bg-[#fff9ea] px-4 text-sm outline-none focus:border-[#6a5f00] focus:ring-1 focus:ring-[#6a5f00]"
                min={0}
                value={form.usageLimit}
                onChange={(event) => update("usageLimit", Number(event.target.value))}
              />
            </label>

            <label className="block text-sm">
              <CouponFieldLabel
                label="Limite por usuário (0 = ilimitado)"
                text="Quantidade máxima de usos do mesmo cupom por cliente."
              />
              <input
                type="number"
                className="h-11 w-full rounded-xl border border-[#cec7aa] bg-[#fff9ea] px-4 text-sm outline-none focus:border-[#6a5f00] focus:ring-1 focus:ring-[#6a5f00]"
                min={0}
                value={form.usageLimitPerUser}
                onChange={(event) => update("usageLimitPerUser", Number(event.target.value))}
              />
            </label>

          </div>

          <fieldset className="rounded-xl border border-[#cec7aa] bg-[#fff9ea] p-4">
            <legend className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4b4731]">
              Restrições (vazio = todos)
            </legend>

            <div className="mt-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-[#1e1c10]">Vendors permitidos</p>
                <InfoTooltip text="Se selecionar vendors, o cupom só vale para produtos vendidos por essas lojas." />
              </div>
              <input
                type="search"
                className="mt-2 h-10 w-full rounded-lg border border-[#cec7aa] bg-white px-3 text-sm outline-none focus:border-[#6a5f00] focus:ring-1 focus:ring-[#6a5f00]"
                placeholder="Buscar vendor por nome ou e-mail"
                value={vendorSearch}
                onChange={(event) => setVendorSearch(event.target.value)}
              />
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[#cec7aa] bg-white">
                {vendorLoading ? (
                  <p className="px-3 py-2 text-xs text-[#4b4731]">Carregando vendors...</p>
                ) : vendorOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-[#4b4731]">Nenhum vendor aprovado encontrado.</p>
                ) : (
                  vendorOptions.map((vendor) => {
                    const checked = form.vendorIds.includes(vendor.id);
                    return (
                      <label
                        key={vendor.id}
                        className="flex cursor-pointer items-center gap-2 border-b border-[#cec7aa] px-3 py-2 text-xs last:border-b-0 hover:bg-[#fff9ea]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleVendor(vendor.id)}
                        />
                        <span className="font-semibold text-[#1e1c10]">{vendor.name}</span>
                        <span className="text-[#4b4731]">{vendor.email}</span>
                      </label>
                    );
                  })
                )}
              </div>
              {form.vendorIds.length > 0 ? (
                <p className="mt-1 text-xs text-[#4b4731]">
                  {form.vendorIds.length} vendor(s) selecionado(s)
                </p>
              ) : null}
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-[#1e1c10]">Produtos permitidos</p>
                <InfoTooltip text="Se selecionar produtos, o cupom só vale para esses itens específicos." />
              </div>
              <input
                type="search"
                className="mt-2 h-10 w-full rounded-lg border border-[#cec7aa] bg-white px-3 text-sm outline-none focus:border-[#6a5f00] focus:ring-1 focus:ring-[#6a5f00]"
                placeholder="Buscar produto por nome ou SKU"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
              />
              {productSearch.trim() ? (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[#cec7aa] bg-white">
                  {productLoading ? (
                    <p className="px-3 py-2 text-xs text-[#4b4731]">Buscando...</p>
                  ) : productResults.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-[#4b4731]">Nenhum produto encontrado.</p>
                  ) : (
                    productResults.map((product) => {
                      const checked = form.productIds.includes(product.id);
                      return (
                        <label
                          key={product.id}
                          className="flex cursor-pointer items-center gap-2 border-b border-[#cec7aa] px-3 py-2 text-xs last:border-b-0 hover:bg-[#fff9ea]"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProduct(product.id)}
                          />
                          <span className="font-semibold text-[#1e1c10]">{product.name}</span>
                          {product.sku ? (
                            <span className="text-[#4b4731]">SKU {product.sku}</span>
                          ) : null}
                        </label>
                      );
                    })
                  )}
                </div>
              ) : null}
              {form.productIds.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1">
                  {form.productIds.map((id) => (
                    <li
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-[#1e1c10] px-3 py-1 text-[10px] font-semibold text-[#fee400]"
                    >
                      {productLabels[id] ?? `Produto #${id}`}
                      <button
                        type="button"
                        aria-label={`Remover produto ${id}`}
                        className="cursor-pointer"
                        onClick={() => toggleProduct(id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </fieldset>

          {error ? (
            <p className="rounded-lg bg-[#fee2e2] px-3 py-2 text-xs text-[#b91c1c]">{error}</p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-[#231f20]/10 pt-4">
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center rounded-[12px] border border-[#cec7aa] bg-white px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#1e1c10] transition hover:bg-[#f6f1da]"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex h-10 cursor-pointer items-center rounded-[12px] bg-[#1e1c10] px-5 text-xs font-semibold uppercase tracking-[0.06em] text-[#fee400] transition hover:bg-[#1e1c10]/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Salvando..." : coupon ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
