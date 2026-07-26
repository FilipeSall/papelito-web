"use client";

import { BadgePercent, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import type { Coupon, CouponInput, CouponListSnapshot } from "@/features/coupons/types/coupon";
import { formatBRL } from "@/lib/format-currency";

import { AdminToast, Panel } from "../../primitives";
import { CouponDeleteModal } from "./coupon-delete-modal";
import { CouponFormModal } from "./coupon-form-modal";

type CouponsManagerProps = {
  initialList: CouponListSnapshot;
  initialIssues: string[];
};

type ToastState = {
  description: string;
  title: string;
} | null;

const TOAST_HIDE_DELAY_MS = 2600;
const TOAST_REMOVE_DELAY_MS = 2900;

function formatDiscount(coupon: Coupon): string {
  if (coupon.discountType === "percent") {
    return `${coupon.amount.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
  }
  return formatBRL(coupon.amount);
}

function formatRestrictions(coupon: Coupon): string {
  const parts: string[] = [];
  if (coupon.vendorIds.length > 0) parts.push(`${coupon.vendorIds.length} vendor(s)`);
  if (coupon.productIds.length > 0) parts.push(`${coupon.productIds.length} produto(s)`);
  return parts.length > 0 ? parts.join(" • ") : "Sem restricoes";
}

function formatDate(value: string | null): string {
  if (!value) return "Sem validade";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return value;
  }
}

function formatUsage(coupon: Coupon): string {
  const limit = coupon.usageLimit > 0 ? coupon.usageLimit : "∞";
  return `${coupon.usageCount} / ${limit}`;
}

export function CouponsManager({ initialList, initialIssues }: CouponsManagerProps) {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>(initialList.items);
  const [issues] = useState<string[]>(initialIssues);
  const [modalCoupon, setModalCoupon] = useState<Coupon | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRemoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastEnterFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
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

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/coupons?status=any&perPage=50", {
      cache: "no-store",
    });
    if (!response.ok) return;
    const data = (await response.json()) as { list?: CouponListSnapshot };
    if (data.list) setCoupons(data.list.items);
  }, []);

  const showToast = useCallback((nextToast: NonNullable<ToastState>) => {
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
    }, TOAST_HIDE_DELAY_MS);

    toastRemoveTimerRef.current = setTimeout(() => {
      setToast(null);
    }, TOAST_REMOVE_DELAY_MS);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastHideTimerRef.current) {
      clearTimeout(toastHideTimerRef.current);
    }
    if (toastRemoveTimerRef.current) {
      clearTimeout(toastRemoveTimerRef.current);
    }

    setToastVisible(false);
    toastRemoveTimerRef.current = setTimeout(() => {
      setToast(null);
    }, TOAST_REMOVE_DELAY_MS - TOAST_HIDE_DELAY_MS);
  }, []);

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
    const method = id ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}) as { message?: string });
      if (!response.ok) {
        return body?.message || "Falha ao salvar cupom.";
      }

      showToast(
        id
          ? {
              description: "As alteracoes do cupom ja foram salvas e ele esta pronto para uso conforme as restricoes definidas.",
              title: "Cupom atualizado com sucesso.",
            }
          : {
              description: "O novo cupom foi criado e ja pode ser usado conforme as configuracoes preenchidas.",
              title: "Cupom criado com sucesso.",
            },
      );
      setModalOpen(false);
      startTransition(() => {
        router.refresh();
        void refresh();
      });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Erro inesperado.";
    }
  }

  function openDelete(coupon: Coupon) {
    setDeleteError(null);
    setDeleteTarget(coupon);
  }

  function closeDelete() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/coupons/${targetId}`, {
        method: "DELETE",
      });

      if (response.ok || response.status === 404) {
        setCoupons((prev) => prev.filter((c) => c.id !== targetId));
        showToast(
          response.status === 404
            ? {
                description: "O registro nao existia mais no backend e a lista foi sincronizada com o estado atual.",
                title: "Lista de cupons atualizada.",
              }
            : {
                description: "O cupom foi removido e nao podera mais ser usado em novas compras.",
                title: "Cupom removido com sucesso.",
              },
        );
        setDeleteTarget(null);
        startTransition(() => {
          router.refresh();
          void refresh();
        });
        return;
      }

      const body = (await response.json().catch(() => ({}))) as { message?: string };
      setDeleteError(body?.message || "Falha ao remover cupom.");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#231f20]/10 px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <BadgePercent className="h-5 w-5 text-[#6a5f00]" strokeWidth={2} />
            <div>
              <h2 className="text-base font-semibold text-[#1e1c10]">Cupons</h2>
              <p className="text-xs text-[#4b4731]">
                Gerencie cupons percentuais e de valor fixo, com restricoes por vendor e produto.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[12px] bg-[#1e1c10] px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#fee400] transition hover:bg-[#1e1c10]/90"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Novo cupom
          </button>
        </div>

        {issues.length > 0 ? (
          <div className="border-b border-[#cec7aa] bg-[#fff9ea] px-5 py-3 text-xs text-[#6a5f00] md:px-6">
            {issues.map((issue) => (
              <p key={issue}>{issue}</p>
            ))}
          </div>
        ) : null}

        {coupons.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[#4b4731] md:px-6">
            Nenhum cupom cadastrado. Crie o primeiro acima.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-205 text-sm">
              <thead className="border-b border-[#231f20]/10 bg-[#f6f1da] text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#231f20]/64">
                <tr>
                  <th className="px-5 py-3">Codigo</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Valor</th>
                  <th className="px-5 py-3">Validade</th>
                  <th className="px-5 py-3">Restricoes</th>
                  <th className="px-5 py-3">Usos</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#231f20]/8">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="text-[#1e1c10]">
                    <td className="px-5 py-3 font-mono font-semibold">{coupon.code}</td>
                    <td className="px-5 py-3 text-[#4b4731]">
                      {coupon.discountType === "percent" ? "Percentual" : "Valor fixo"}
                    </td>
                    <td className="px-5 py-3 font-semibold">{formatDiscount(coupon)}</td>
                    <td className="px-5 py-3 text-[#4b4731]">{formatDate(coupon.dateExpires)}</td>
                    <td className="px-5 py-3 text-[#4b4731]">{formatRestrictions(coupon)}</td>
                    <td className="px-5 py-3 text-[#4b4731]">{formatUsage(coupon)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                          coupon.status === "publish"
                            ? "bg-[#ECFDF5] text-[#047857]"
                            : "bg-[#FEF3C7] text-[#92400E]"
                        }`}
                      >
                        {coupon.status === "publish" ? "Ativo" : "Rascunho"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Editar ${coupon.code}`}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#1e1c10] transition hover:bg-[#6a5f00]/10"
                          onClick={() => openEdit(coupon)}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Excluir ${coupon.code}`}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#b91c1c] transition hover:bg-[#fee2e2] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={deleting && deleteTarget?.id === coupon.id}
                          onClick={() => openDelete(coupon)}
                        >
                          {deleting && deleteTarget?.id === coupon.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                          ) : (
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isPending ? (
          <div className="border-t border-[#231f20]/10 px-5 py-2 text-xs text-[#4b4731] md:px-6">
            Atualizando lista...
          </div>
        ) : null}
      </Panel>

      {toast ? (
        <AdminToast
          description={toast.description}
          onClose={dismissToast}
          title={toast.title}
          visible={toastVisible}
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
    </>
  );
}
