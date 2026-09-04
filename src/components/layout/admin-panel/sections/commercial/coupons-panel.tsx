"use client";

import {
  BadgeCheck,
  CalendarX,
  FileEdit,
  Loader2,
  Plus,
  Ticket,
  Trash2,
  TrendingUp,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import type { Coupon, CouponInput, CouponListSnapshot } from "@/features/coupons/types/coupon";
import { formatBRL } from "@/lib/format-currency";
import { messageFromError, messageFromResponse } from "@/utils/error-message";

import {
  AdminToast,
  EmptyResult,
  FOCUS_RING,
  InlineAlert,
  PrimaryButton,
  ResultButtonRow,
  ResultFrame,
  SectionHeading,
  StatusChip,
  type StatusShape,
} from "../../primitives";
import { Pagination } from "../accounts/pagination";

import {
  COUPONS_PER_PAGE,
  commercialHref,
  type CouponsPageFilters,
} from "./commercial-config";
import { CouponDeleteModal } from "./coupon-delete-modal";
import { CouponFormModal } from "./coupon-form-modal";
import { CouponsFilterBar } from "./coupons-filter-bar";
import { useAdminToast } from "./use-admin-toast";

type CouponsPanelProps = {
  filters: CouponsPageFilters;
  issues: string[];
  list: CouponListSnapshot;
};

function formatDiscount(coupon: Coupon): string {
  if (coupon.discountType === "percent") {
    return `${coupon.amount.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
  }

  return formatBRL(coupon.amount);
}

function formatRestrictions(coupon: Coupon): string {
  const parts: string[] = [];

  if (coupon.vendorIds.length > 0) {
    parts.push(`${coupon.vendorIds.length} ${coupon.vendorIds.length === 1 ? "vendor" : "vendors"}`);
  }

  if (coupon.productIds.length > 0) {
    parts.push(
      `${coupon.productIds.length} ${coupon.productIds.length === 1 ? "produto" : "produtos"}`,
    );
  }

  return parts.length > 0 ? `Vale só para ${parts.join(" e ")}` : "Vale para todo o catálogo";
}

function formatValidity(coupon: Coupon): string {
  if (!coupon.dateExpires) {
    return "Sem data de validade";
  }

  const parsed = new Date(coupon.dateExpires);

  if (Number.isNaN(parsed.getTime())) {
    return coupon.dateExpires;
  }

  return `Vale até ${parsed.toLocaleDateString("pt-BR")}`;
}

function isExpired(coupon: Coupon): boolean {
  if (!coupon.dateExpires) {
    return false;
  }

  const parsed = new Date(coupon.dateExpires);

  return !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now();
}

function isExhausted(coupon: Coupon): boolean {
  return coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit;
}

/**
 * Rascunho vence expirado e esgotado: um cupom que nunca foi publicado não "acabou".
 */
function couponStatusShape(coupon: Coupon): StatusShape {
  if (coupon.status === "draft") {
    return { icon: FileEdit, label: "Rascunho", tone: "pending" };
  }

  if (isExpired(coupon)) {
    return { icon: CalendarX, label: "Expirado", tone: "critical" };
  }

  if (isExhausted(coupon)) {
    return { icon: TrendingUp, label: "Esgotado", tone: "critical" };
  }

  return { icon: BadgeCheck, label: "Ativo", tone: "positive" };
}

export function CouponsPanel({ filters, issues, list }: Readonly<CouponsPanelProps>) {
  const router = useRouter();
  const [modalCoupon, setModalCoupon] = useState<Coupon | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { dismissToast, isVisible, showToast, toast } = useAdminToast();

  const totalPages = Math.max(1, Math.ceil(list.total / (list.perPage || COUPONS_PER_PAGE)));
  const currentPage = Math.min(Math.max(1, list.page), totalPages);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router, startTransition]);

  function openCreate() {
    setModalCoupon(null);
    setModalOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setModalCoupon(coupon);
    setModalOpen(true);
  }

  async function handleSubmit(payload: CouponInput, id: number | null): Promise<string | null> {
    const url = id ? `/api/admin/coupons/${id}` : "/api/admin/coupons";

    try {
      const response = await fetch(url, {
        body: JSON.stringify(payload),
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        method: id ? "PUT" : "POST",
      });

      if (!response.ok) {
        return await messageFromResponse(response, "Falha ao salvar cupom.");
      }

      showToast(
        id
          ? {
              description: `${payload.code} já vale conforme as restrições que você definiu.`,
              title: "Cupom atualizado",
            }
          : {
              description: `${payload.code} já pode ser digitado no carrinho e no checkout.`,
              title: "Cupom criado",
            },
      );
      setModalOpen(false);
      refresh();

      return null;
    } catch (error) {
      return messageFromError(error, "Erro inesperado.");
    }
  }

  function openDelete(coupon: Coupon) {
    setDeleteError(null);
    setDeleteTarget(coupon);
  }

  function closeDelete() {
    if (deleting) {
      return;
    }

    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;
    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/coupons/${target.id}`, { method: "DELETE" });

      if (response.ok || response.status === 404) {
        showToast(
          response.status === 404
            ? {
                description: `${target.code} já não existia no backend e a lista foi sincronizada.`,
                title: "Lista atualizada",
              }
            : {
                description: `${target.code} não pode mais ser usado em novas compras.`,
                title: "Cupom removido",
              },
        );
        setDeleteTarget(null);
        refresh();

        return;
      }

      setDeleteError(await messageFromResponse(response, "Falha ao remover cupom."));
    } catch (error) {
      setDeleteError(messageFromError(error, "Erro inesperado."));
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = filters.search.length > 0 || filters.status !== "any";
  const summary = isPending
    ? "Atualizando…"
    : `${list.total} ${list.total === 1 ? "cupom" : "cupons"}${hasFilters ? " no recorte" : ""}`;

  return (
    <div className="space-y-4">
      <SectionHeading
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            Novo cupom
          </PrimaryButton>
        }
        description="Desconto percentual ou de valor fixo, com restrição opcional por vendor e por produto. Quem decide se um cupom vale é o WordPress, a cada carrinho."
        title="Cupons"
      />

      {issues.map((issue) => (
        <InlineAlert key={issue}>{issue}</InlineAlert>
      ))}

      <CouponsFilterBar filters={filters} />

      {list.items.length === 0 ? (
        <EmptyResult
          body={
            hasFilters
              ? "Nenhum cupom corresponde ao recorte atual. Limpe a busca ou troque a situação."
              : "Crie o primeiro cupom para começar a distribuir desconto por vendor ou por produto."
          }
          title={hasFilters ? "Nada neste recorte" : "Nenhum cupom cadastrado"}
        />
      ) : (
        <ResultFrame
          footer={
            totalPages > 1 ? (
              <Pagination
                currentPage={currentPage}
                hrefFor={(page) => commercialHref("cupons", { ...filters, page })}
                totalPages={totalPages}
              />
            ) : undefined
          }
          summary={summary}
        >
          {list.items.map((coupon) => {
            const status = couponStatusShape(coupon);
            const usageLabel =
              coupon.usageLimit > 0
                ? `${coupon.usageCount} / ${coupon.usageLimit} usos`
                : `${coupon.usageCount} ${coupon.usageCount === 1 ? "uso" : "usos"} · sem limite`;

            return (
              <ResultButtonRow
                ariaLabel={`Editar cupom ${coupon.code}`}
                key={coupon.id}
                lead={
                  <div className="min-w-0">
                    <p
                      className="truncate font-mono text-sm font-semibold uppercase tracking-[0.06em] text-[#1a1a1a]"
                      style={{ fontFamily: "var(--font-admin-mono)" }}
                    >
                      {coupon.code}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#231f20]/70">
                      <span className="text-[#1a1a1a]">{formatDiscount(coupon)}</span>
                      <span aria-hidden>·</span>
                      <span>
                        {coupon.discountType === "percent" ? "sobre os itens" : "no total elegível"}
                      </span>
                      {coupon.freeShipping ? (
                        <span className="inline-flex items-center gap-1 text-[#1a1a1a]">
                          <Truck aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                          frete grátis
                        </span>
                      ) : null}
                    </p>
                  </div>
                }
                meta={
                  <div className="min-w-0 text-xs leading-5 text-[#231f20]/70">
                    <p className="truncate">{formatRestrictions(coupon)}</p>
                    <p className="truncate">{formatValidity(coupon)}</p>
                    {coupon.minimumAmount > 0 ? (
                      <p className="truncate">Subtotal mínimo {formatBRL(coupon.minimumAmount)}</p>
                    ) : null}
                  </div>
                }
                onOpen={() => openEdit(coupon)}
                trailing={
                  <>
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/60"
                      data-numeric
                    >
                      {usageLabel}
                    </span>
                    <StatusChip icon={status.icon} label={status.label} tone={status.tone} />
                    <button
                      aria-label={`Excluir cupom ${coupon.code}`}
                      className={[
                        "inline-flex h-9 w-9 items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#c0392b] transition hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-45",
                        FOCUS_RING,
                      ].join(" ")}
                      disabled={deleting && deleteTarget?.id === coupon.id}
                      onClick={() => openDelete(coupon)}
                      type="button"
                    >
                      {deleting && deleteTarget?.id === coupon.id ? (
                        <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={2.4} />
                      ) : (
                        <Trash2 aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                      )}
                    </button>
                  </>
                }
              />
            );
          })}
        </ResultFrame>
      )}

      <p className="flex items-start gap-2 text-xs leading-5 text-[#231f20]/64">
        <Ticket aria-hidden className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
        A contagem de usos vem do WooCommerce. Não há registro de quem usou cada cupom nem de
        receita atribuída a ele.
      </p>

      {toast ? (
        <AdminToast
          description={toast.description}
          onClose={dismissToast}
          title={toast.title}
          visible={isVisible}
        />
      ) : null}

      {modalOpen ? (
        <CouponFormModal
          coupon={modalCoupon}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}

      {deleteTarget ? (
        <CouponDeleteModal
          coupon={deleteTarget}
          deleting={deleting}
          errorMessage={deleteError}
          onCancel={closeDelete}
          onConfirm={confirmDelete}
        />
      ) : null}
    </div>
  );
}
