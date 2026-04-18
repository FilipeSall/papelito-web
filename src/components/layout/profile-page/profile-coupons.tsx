"use client";

import { useMemo } from "react";

import {
  useProfileCoupons,
  type ProfileCouponFilter,
  type ProfileCouponItem,
} from "@/features/coupons";

type CouponFilterButtonProps = {
  filter: ProfileCouponFilter;
  label: string;
  isActive: boolean;
  count: number;
  onSelect: (filter: ProfileCouponFilter) => void;
};

/**
 * Botão de filtro da lista de cupons.
 */
function CouponFilterButton({
  filter,
  label,
  isActive,
  count,
  onSelect,
}: CouponFilterButtonProps) {
  return (
    <button
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-black uppercase transition ${
        isActive
          ? "bg-brand-dark text-white"
          : "bg-[#EDEEF0] text-[#6A7282] hover:bg-gray-300"
      }`}
      onClick={() => onSelect(filter)}
      type="button"
    >
      {label}
      {filter !== "all" && (
        <span className={`ml-1 text-[10px] ${isActive ? "text-white/80" : "text-[#6A7282]"}`}>
          ({count})
        </span>
      )}
    </button>
  );
}

/**
 * Ícone circular de destaque no card de cupom.
 */
function CouponBadgeIcon({ code }: { code: string }) {
  const variant = code.length % 4;
  const styles = [
    { bg: "bg-[#D5F4DF]", text: "text-[#166534]", icon: "C" },
    { bg: "bg-[#DBEAFE]", text: "text-[#1D4ED8]", icon: "F" },
    { bg: "bg-[#FEF3C7]", text: "text-[#92400E]", icon: "P" },
    { bg: "bg-[#EDE9FE]", text: "text-[#7C3AED]", icon: "G" },
  ][variant];

  return (
    <span
      aria-hidden
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${styles.bg} ${styles.text}`}
    >
      {styles.icon}
    </span>
  );
}

/**
 * Card individual de cupom com ação de copiar código.
 */
function CouponCard({
  coupon,
  wasCopied,
  onCopy,
}: {
  coupon: ProfileCouponItem;
  wasCopied: boolean;
  onCopy: (coupon: ProfileCouponItem) => void;
}) {
  return (
    <article className="relative rounded-2xl border border-dashed border-[#2F2F2F] bg-white p-4 shadow-sm">
      <span className="absolute inset-y-3 left-0 w-1 rounded-r bg-brand-yellow" />

      <div className="ml-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CouponBadgeIcon code={coupon.code} />
            <p className="text-2xl font-black uppercase tracking-[0.7px] text-brand-dark">
              {coupon.code}
            </p>
          </div>

          <p className="mt-1 text-xs text-[#6A7282]">{coupon.description}</p>

          <span className="mt-3 inline-flex rounded-full bg-brand-yellow px-2 py-1 text-xs font-black text-brand-dark">
            {coupon.highlight}
          </span>

          {coupon.minimumLabel && (
            <p className="mt-2 text-xs text-[#6A7282]">{coupon.minimumLabel}</p>
          )}

          <p className="mt-1 text-xs text-[#9AA1AF]">{coupon.expiresAtLabel}</p>
        </div>

        <button
          className="inline-flex h-8 shrink-0 items-center rounded-full bg-brand-dark px-4 text-xs font-black text-white transition hover:opacity-90"
          onClick={() => onCopy(coupon)}
          type="button"
        >
          {wasCopied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </article>
  );
}

/**
 * Skeleton de carregamento para os cards de cupom.
 */
function CouponsLoadingState() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          className="h-28 animate-pulse rounded-2xl bg-white shadow-sm"
          key={`coupon-skeleton-${index}`}
        />
      ))}
    </div>
  );
}

/**
 * Seção de cupons da área privada conforme layout do Figma.
 */
export function ProfileCoupons() {
  const {
    coupons,
    filteredCoupons,
    filter,
    setFilter,
    couponCodeInput,
    setCouponCodeInput,
    copyFeedbackById,
    applyCouponMessage,
    isLoading,
    errorMessage,
    activeCountLabel,
    onApplyCouponCode,
    onCopyCouponCode,
  } = useProfileCoupons();

  const counts = useMemo(
    () => ({
      all: coupons.length,
      active: coupons.filter((item) => item.status === "active").length,
      used: coupons.filter((item) => item.status === "used").length,
      expired: coupons.filter((item) => item.status === "expired").length,
    }),
    [coupons],
  );

  return (
    <section className="flex flex-1 flex-col gap-4">
      <header>
        <h2 className="text-xl font-black uppercase tracking-[-0.45px] text-brand-dark">
          Meus Cupons
        </h2>
        <p className="mt-0.5 text-sm text-[#99A1AF]">{activeCountLabel}</p>
      </header>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm font-black text-brand-dark">Adicionar cupom</p>

        <div className="mt-3 flex gap-3">
          <input
            className="h-[46px] flex-1 rounded-[14px] border border-[#E5E7EB] px-4 text-sm font-black uppercase tracking-[1.2px] text-brand-dark placeholder:text-[rgba(10,10,10,0.5)]"
            onChange={(event) => setCouponCodeInput(event.target.value)}
            placeholder="Digite o código do cupom"
            value={couponCodeInput}
          />
          <button
            className="h-[46px] rounded-[14px] bg-brand-dark px-5 text-sm font-black text-white transition hover:opacity-90"
            onClick={onApplyCouponCode}
            type="button"
          >
            Adicionar
          </button>
        </div>

        {applyCouponMessage && (
          <p className="mt-2 text-xs text-[#6A7282]">{applyCouponMessage}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <CouponFilterButton
          count={counts.all}
          filter="all"
          isActive={filter === "all"}
          label="Todos"
          onSelect={setFilter}
        />
        <CouponFilterButton
          count={counts.active}
          filter="active"
          isActive={filter === "active"}
          label="Ativos"
          onSelect={setFilter}
        />
        <CouponFilterButton
          count={counts.used}
          filter="used"
          isActive={filter === "used"}
          label="Usados"
          onSelect={setFilter}
        />
        <CouponFilterButton
          count={counts.expired}
          filter="expired"
          isActive={filter === "expired"}
          label="Expirados"
          onSelect={setFilter}
        />
      </div>

      {isLoading && <CouponsLoadingState />}

      {!isLoading && errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && (
        <>
          {filteredCoupons.length === 0 ? (
            <div className="rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
              <p className="text-sm text-gray-500">Nenhum cupom encontrado para este filtro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {filteredCoupons.map((coupon) => (
                <CouponCard
                  coupon={coupon}
                  key={coupon.id}
                  onCopy={onCopyCouponCode}
                  wasCopied={Boolean(copyFeedbackById[coupon.id])}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
