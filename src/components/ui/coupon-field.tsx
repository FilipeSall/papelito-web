"use client";

import { useState } from "react";

import { useCartStore } from "@/features/cart/store/use-cart-store";

type CouponStatus = "idle" | "applying" | "applied" | "invalid";

/**
 * Campo de cupom do carrinho e do checkout. Vive nas duas superfícies porque o
 * benefício de frete grátis só passa a valer depois que a modalidade de entrega
 * é escolhida, e essa escolha acontece no checkout.
 */
export function CouponField({ label = "Cupom de desconto" }: { label?: string }) {
  const coupon = useCartStore((state) => state.coupon);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<CouponStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleApply() {
    const trimmed = input.trim();

    if (!trimmed) {
      removeCoupon();
      setStatus("idle");
      setMessage(null);
      return;
    }

    setStatus("applying");
    setMessage(null);
    const result = await applyCoupon(trimmed);

    if (result.ok) {
      setStatus("applied");
      setMessage(result.message ?? null);
      setInput("");
      return;
    }

    setStatus("invalid");
    setMessage(result.message);
  }

  function handleRemove() {
    removeCoupon();
    setStatus("idle");
    setMessage(null);
    setInput("");
  }

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-tertiary">
        {label}
      </p>

      {coupon ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-[12px] border border-[#E5E7EB] bg-bg-light px-3 py-2">
          <span className="truncate text-xs font-black uppercase tracking-[0.12em] text-brand-dark">
            {coupon.code}
          </span>
          <button
            className="shrink-0 cursor-pointer text-xs font-semibold text-text-tertiary underline transition hover:text-brand-dark"
            onClick={handleRemove}
            type="button"
          >
            Remover
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <input
            className="h-10 min-w-0 flex-1 rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-sm tracking-[-0.1504px] text-brand-dark outline-none placeholder:text-black/50 focus:border-brand-dark/25"
            disabled={status === "applying"}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Insira seu cupom"
            type="text"
            value={input}
          />
          <button
            className="h-10 shrink-0 cursor-pointer whitespace-nowrap rounded-[12px] bg-brand-dark px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={status === "applying"}
            onClick={handleApply}
            type="button"
          >
            {status === "applying" ? "..." : "Aplicar"}
          </button>
        </div>
      )}

      {message ? (
        <p
          className={`mt-2 text-xs ${status === "invalid" ? "text-[#B42318]" : "text-[#92400E]"}`}
          role={status === "invalid" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
