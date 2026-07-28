"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  normalizeProductImage,
  getCartLineTotal,
  useCartCouponRevalidator,
  useCartPricing,
  useCartStockValidation,
  useCartStore,
  useCartSummary,
} from "@/features/cart";
import { formatBRL } from "@/lib/format-currency";
import { ArrowRightIcon } from "@/components/ui/icons";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  CartPaymentChip,
  CartQuantityControl,
  CartSummaryRow,
} from "./atoms";

function EmptyCartBagIcon() {
  return (
    <svg
      aria-hidden
      className="h-5.5 w-5.5 text-brand-yellow"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 9V7.5C8 5.567 9.567 4 11.5 4C13.433 4 15 5.567 15 7.5V9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <rect
        height="10"
        rx="2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        width="12"
        x="5.5"
        y="9"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.67 4H13.33"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M12 4V12.67C12 13.4 11.4 14 10.67 14H5.33C4.6 14 4 13.4 4 12.67V4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M5.33 4V2.67C5.33 1.93 5.93 1.33 6.67 1.33H9.33C10.07 1.33 10.67 1.93 10.67 2.67V4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path d="M6.67 6.67V11.33" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      <path d="M9.33 6.67V11.33" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

export function CartPageContent() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  const summary = useCartSummary();
  const pricingError = useCartStore((state) => state.pricingError);
  const pricing = useCartStore((state) => state.pricing);
  const pricingRequiresConfirmation = useCartStore(
    (state) => state.pricingRequiresConfirmation,
  );
  const confirmPricingAdjustments = useCartStore(
    (state) => state.confirmPricingAdjustments,
  );
  const { isPricing } = useCartPricing();
  const stockValidation = useCartStockValidation({ validateOnMount: true });
	const { isB2bPurchaseBlocked } = useAuthSession();

  const [couponInput, setCouponInput] = useState("");
  const [couponStatus, setCouponStatus] = useState<"idle" | "applying" | "applied" | "invalid">(
    "idle",
  );
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  const handleCouponRevalidation = useCallback(
    ({ removed, code }: { removed: boolean; reason?: string; code: string | null }) => {
      if (removed && code) {
        setCouponStatus("invalid");
        setCouponMessage(`O cupom ${code} não vale mais para este carrinho.`);
      }
    },
    [],
  );
  useCartCouponRevalidator(handleCouponRevalidation);

  async function handleApplyCoupon() {
    const trimmed = couponInput.trim();
    if (!trimmed) {
      removeCoupon();
      setCouponStatus("idle");
      setCouponMessage(null);
      return;
    }

    setCouponStatus("applying");
    setCouponMessage(null);
    const result = await applyCoupon(trimmed);

    if (result.ok) {
      setCouponStatus("applied");
      setCouponMessage(result.message ?? null);
      setCouponInput("");
    } else {
      setCouponStatus("invalid");
      setCouponMessage(result.message);
    }
  }

  function handleRemoveCoupon() {
    removeCoupon();
    setCouponStatus("idle");
    setCouponMessage(null);
    setCouponInput("");
  }

  async function handleCheckout() {
		if (isB2bPurchaseBlocked) {
			setCheckoutMessage("Sua empresa ainda não está apta para comprar. Revise o cadastro empresarial.");
			return;
		}
    if (stockValidation.isValidating || isPricing) return;

    if (pricingRequiresConfirmation) {
      setCheckoutMessage("Confirme os preços recalculados antes de continuar.");
      return;
    }

    if (pricingError) {
      setCheckoutMessage(pricingError);
      return;
    }

    setCheckoutMessage(null);
    const outcome = await stockValidation.validateStock();

    if (outcome.status === "valid") {
      router.push("/checkout");
      return;
    }

    setCheckoutMessage(
      outcome.status === "changed"
        ? "O estoque mudou. Revise as quantidades atualizadas antes de continuar."
        : outcome.message,
    );
  }

  if (items.length === 0) {
    return (
      <main className="bg-bg-light">
        <section className="mx-auto flex min-h-144 w-full max-w-391 items-start justify-center px-6 pb-16 pt-24 md:min-h-152 md:px-8 md:pt-30">
          <div className="flex w-full max-w-107.75 flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-dark">
              <EmptyCartBagIcon />
            </div>

            <h1 className="mt-6 text-[30px] font-black uppercase leading-9 tracking-[0.3955px] text-brand-dark">
              Carrinho Vazio
            </h1>

            <p className="mt-3 text-base leading-6 tracking-[-0.3125px] text-text-tertiary">
              Você ainda não adicionou nenhum produto ao carrinho.
            </p>

            <Link
              className="mt-8 inline-flex h-14 items-center gap-3 rounded-full bg-brand-yellow px-7 text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition hover:brightness-95"
              href="/produtos"
            >
              Explorar Produtos
              <ArrowRightIcon className="h-4.5 w-4.5" size={18} strokeWidth={1.8} />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const itemLabel = summary.totalItems === 1 ? "1 item" : `${summary.totalItems} itens`;

  return (
    <main className="bg-bg-light">
      <section className="bg-brand-dark">
        <div className="mx-auto w-full max-w-391 px-6 pb-6 pt-8 md:px-8 md:pb-8 md:pt-10">
          <h1 className="text-4xl font-black uppercase leading-10 tracking-[0.3691px] text-white">
            Meu <span className="text-brand-yellow">Carrinho</span>
          </h1>
          <p className="mt-2 text-base text-white/50">{itemLabel}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-6 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,318px)]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between border-b border-[#F3F4F6] px-6 py-4">
                <h2 className="text-sm font-black uppercase tracking-[-0.1504px] text-brand-dark">
                  Produtos no carrinho
                </h2>
                <button
                  type="button"
                  className="text-xs font-medium text-[#FF6467] transition hover:opacity-80"
                  onClick={clearCart}
                >
                  Limpar tudo
                </button>
              </div>

              <ul className="divide-y divide-[#F3F4F6]">
                {items.map((item) => {
                  const stockQty = stockValidation.products[item.id]?.stockQty;
                  const stockOutOfStock = stockQty === 0;
                  const stockLimitReached =
                    stockQty !== undefined && item.quantity >= stockQty;

                  return (
                  <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-4 md:flex-nowrap">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[14px] bg-bg-light p-2">
                      {normalizeProductImage(item.image, item.name) ? (
                        <Image
                          alt={item.name}
                          className="h-16 w-16 object-contain"
                          height={64}
                          src={normalizeProductImage(item.image, item.name)!}
                          width={64}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-white/70" />
                      )}
                    </div>

                    <div className="min-w-45 flex-1">
                      <p className="text-xs text-text-muted">{item.category || "Produto"}</p>
                      <p className="mt-0.5 text-sm font-black tracking-[-0.1504px] text-brand-dark">
                        {item.name}
                      </p>
                      <p className="mt-1 text-base font-black tracking-[-0.3125px] text-brand-dark">
                        {formatBRL(item.price)}
                      </p>
                      <p className="mt-1 text-xs text-text-tertiary">
                        Vendor: {item.vendorName}
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <CartQuantityControl
                        quantity={item.quantity}
                        loading={stockValidation.isItemPending(item.id)}
                        increaseDisabled={
                          stockValidation.isItemPending(item.id) ||
                          stockValidation.isValidating ||
                          stockOutOfStock ||
                          stockLimitReached
                        }
                        increaseDisabledReason={
                          stockOutOfStock || stockLimitReached
                            ? "Não há mais unidades disponíveis"
                            : undefined
                        }
                        onDecrease={() => {
                          decreaseItem(item.id);
                          stockValidation.clearIssue(item.id);
                        }}
                        onIncrease={() => void stockValidation.increaseItem(item.id)}
                      />
                      {stockValidation.issues[item.id] ? (
                        <p
                          className="max-w-52 text-center text-[11px] leading-4 text-[#B42318]"
                          role="alert"
                        >
                          {stockValidation.issues[item.id].message}
                        </p>
                      ) : null}
                    </div>

                    <p className="w-22 text-right text-base font-black tracking-[-0.3125px] text-brand-dark">
                      {formatBRL(getCartLineTotal(item, pricing))}
                    </p>

                    <button
                      type="button"
                      aria-label={`Remover ${item.name} do carrinho`}
                      className="cursor-pointer text-[#D1D5DC] transition hover:text-[#FF6467]"
                      onClick={() => removeItem(item.id)}
                    >
                      <TrashIcon />
                    </button>
                  </li>
                  );
                })}
              </ul>
            </div>

            <Link
              className="mt-4 inline-flex items-center text-sm font-medium tracking-[-0.1504px] text-text-muted transition hover:text-brand-dark"
              href="/produtos"
            >
              ← Continuar Comprando
            </Link>
          </div>

          <aside className="h-fit min-w-0 rounded-2xl border border-[#E5E7EB] bg-[#F5F5F5] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
            <h2 className="text-sm font-black uppercase tracking-[-0.1504px] text-brand-dark">
              Resumo do Pedido
            </h2>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.6px] text-text-tertiary">
                Cupom de desconto
              </p>

              {summary.coupon ? (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-[14px] bg-[#ECFDF5] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black tracking-[-0.1504px] text-[#047857]">
                      {summary.coupon.code}
                    </p>
                    <p className="text-xs text-[#047857]/80">
                      {summary.coupon.applied === false
                        ? "Sem desconto adicional"
                        : `-${formatBRL(summary.coupon.discountValue)} aplicado`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer text-xs font-bold uppercase tracking-[0.6px] text-[#047857] transition hover:opacity-80"
                    onClick={handleRemoveCoupon}
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    className="h-10.5 min-w-0 flex-1 rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-sm tracking-[-0.1504px] text-brand-dark outline-none placeholder:text-black/50 focus:border-brand-dark/25"
                    placeholder="Insira seu cupom"
                    type="text"
                    value={couponInput}
                    disabled={couponStatus === "applying"}
                    onChange={(event) => setCouponInput(event.target.value)}
                  />
                  <button
                    type="button"
                    className="h-10.5 shrink-0 cursor-pointer whitespace-nowrap rounded-[14px] bg-brand-dark px-4 text-xs font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:px-5"
                    onClick={handleApplyCoupon}
                    disabled={couponStatus === "applying"}
                  >
                    {couponStatus === "applying" ? "Aplicando..." : "Aplicar"}
                  </button>
                </div>
              )}

              {couponStatus === "invalid" && couponMessage ? (
                <p className="mt-2 text-xs text-[#FF6467]">{couponMessage}</p>
              ) : null}
              {couponStatus === "applied" && couponMessage ? (
                <p className="mt-2 text-xs text-[#92400E]">{couponMessage}</p>
              ) : null}
            </div>

            <div className="mt-6 space-y-3">
              <CartSummaryRow label="Subtotal" value={formatBRL(summary.subtotal)} />
              <CartSummaryRow label="Frete" value={formatBRL(summary.shipping)} />
              {summary.discount > 0 && (
                <CartSummaryRow
                  label="Desconto"
                  value={`- ${formatBRL(summary.discount)}`}
                  labelClassName="text-sm text-[#16A34A]"
                  valueClassName="text-sm font-medium text-[#16A34A]"
                />
              )}
              {summary.hasFreeShipping ? (
                <p className="text-xs text-[#16A34A]">Parabéns! Você ganhou frete grátis.</p>
              ) : (
                <p className="text-xs text-text-muted">
                  Faltam {formatBRL(summary.amountToFreeShipping)} para frete gratis
                </p>
              )}

              <div className="border-t border-[#F3F4F6] pt-3">
                <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                  <span className="text-2xl font-black uppercase tracking-[-0.3125px] text-brand-dark">
                    Total
                  </span>
                  <span className="whitespace-nowrap text-[clamp(2rem,2.4vw,3.25rem)] font-black leading-none tracking-[-0.4492px] text-brand-dark">
                    {formatBRL(summary.total)}
                  </span>
                </div>
              </div>
            </div>

            {pricingRequiresConfirmation ? (
              <div className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-3 text-xs text-[#92400E]" role="alert">
                <p>A campanha mudou ou expirou. O preço normal foi restaurado.</p>
                <button
                  className="mt-2 cursor-pointer font-black uppercase underline"
                  onClick={() => {
                    confirmPricingAdjustments();
                    setCheckoutMessage(null);
                  }}
                  type="button"
                >
                  Confirmar novos preços
                </button>
              </div>
            ) : null}

            {stockValidation.globalError || checkoutMessage || pricingError ? (
              <p
                className="mt-4 rounded-[12px] border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs text-[#B42318]"
                role="alert"
              >
                {checkoutMessage ?? pricingError ?? stockValidation.globalError}
              </p>
            ) : null}

            <button
              type="button"
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-yellow text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition enabled:cursor-pointer enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
				disabled={stockValidation.isValidating || isPricing || pricingRequiresConfirmation || isB2bPurchaseBlocked}
              onClick={() => void handleCheckout()}
            >
              {stockValidation.isValidating
                ? "Validando estoque..."
                : isPricing
                  ? "Recalculando..."
                  : "Finalizar Compra"}
              <ArrowRightIcon className="h-4.5 w-4.5" size={18} strokeWidth={1.8} />
            </button>

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <CartPaymentChip label="Visa" />
              <CartPaymentChip label="Master" />
              <CartPaymentChip label="Pix" />
              <CartPaymentChip label="Boleto" />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
