"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";

import type { AdminVendorStockItem } from "@/lib/server/admin-vendor-operations";

import { VendorStockEditModal } from "./vendor-stock-edit-modal";

function formatDate(value: string) {
  if (!value) return "Sem ajuste";
  const parsed = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDelta(delta: number) {
  return delta > 0 ? `+${delta}` : String(delta);
}

type VendorStockTableProps = {
  items: AdminVendorStockItem[];
  vendorId: number;
};

export function VendorStockTable({ items, vendorId }: VendorStockTableProps) {
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [editingItem, setEditingItem] = useState<AdminVendorStockItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  function toggleExpanded(productId: number) {
    setExpandedIds((current) =>
      current.includes(productId)
        ? current.filter((value) => value !== productId)
        : [...current, productId],
    );
  }

  async function handleSave(payload: { qty: number; reason: string }) {
    if (!editingItem) return;

    setSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/stock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: editingItem.productId,
          qty: payload.qty,
          reason: payload.reason,
        }),
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setErrorMessage(data?.message ?? "Não foi possível salvar o ajuste.");
        return;
      }

      setEditingItem(null);
      setFeedback({ tone: "success", text: "Estoque atualizado com sucesso." });
      router.refresh();
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {feedback ? (
          <p
            className={[
              "rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]",
              feedback.tone === "success"
                ? "border border-[#97b38e] bg-[#e4efe0] text-[#28422d]"
                : "border border-[#d7b0aa] bg-[#fee2e2] text-[#7a3428]",
            ].join(" ")}
          >
            {feedback.text}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                {["Produto", "Quantidade", "Última atualização", "Histórico", ""].map((label) => (
                  <th
                    className="border-b border-[#231f20]/10 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48"
                    key={label}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isExpanded = expandedIds.includes(item.productId);

                return (
                  <Fragment key={item.productId}>
                    <tr key={item.productId}>
                      <td className="border-b border-[#231f20]/8 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[#231f20]/10 bg-white">
                            {item.imageUrl ? (
                              <Image
                                alt={item.productName}
                                className="object-cover"
                                fill
                                sizes="40px"
                                src={item.imageUrl}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[9px] uppercase tracking-[0.14em] text-[#231f20]/40">
                                sem img
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#231f20]">{item.productName}</p>
                            <p className="text-xs text-[#231f20]/52">{item.sku || "Sem SKU"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-[#231f20]/8 px-4 py-3">
                        <span
                          className={[
                            "inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-[0.16em]",
                            item.isZeroed
                              ? "bg-[#f3e3df] text-[#7a3428]"
                              : "bg-[#e4efe0] text-[#28422d]",
                          ].join(" ")}
                        >
                          {item.qty}
                        </span>
                      </td>
                      <td className="border-b border-[#231f20]/8 px-4 py-3 text-sm text-[#231f20]/72">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="border-b border-[#231f20]/8 px-4 py-3">
                        <button
                          type="button"
                          className="text-xs font-semibold uppercase tracking-[0.14em] text-[#231f20] underline"
                          onClick={() => toggleExpanded(item.productId)}
                        >
                          {isExpanded ? "Ocultar" : "Ver últimos 5"}
                        </button>
                      </td>
                      <td className="border-b border-[#231f20]/8 px-4 py-3 text-right">
                        <button
                          type="button"
                          className="inline-flex h-10 items-center rounded-[12px] border border-[#231f20]/14 bg-white px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#231f20] transition hover:border-[#231f20]/40"
                          onClick={() => {
                            setErrorMessage(null);
                            setEditingItem(item);
                          }}
                        >
                          Ajustar
                        </button>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr>
                        <td className="border-b border-[#231f20]/8 bg-white/70 px-4 py-4" colSpan={5}>
                          {item.history.length > 0 ? (
                            <div className="space-y-2">
                              {item.history.map((entry, index) => (
                                <div
                                  className="grid gap-2 rounded-xl border border-[#231f20]/10 bg-white px-3 py-2 text-sm text-[#231f20]/74 md:grid-cols-[90px_1fr_140px]"
                                  key={`${item.productId}-${index}-${entry.createdAt}`}
                                >
                                  <span className="font-semibold text-[#231f20]">
                                    {formatDelta(entry.delta)}
                                  </span>
                                  <span>{entry.reason || "Ajuste manual"}</span>
                                  <span className="text-xs uppercase tracking-[0.12em] text-[#231f20]/52">
                                    {formatDate(entry.createdAt)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-[#231f20]/62">
                              Nenhum histórico recente para este produto.
                            </p>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem ? (
        <VendorStockEditModal
          errorMessage={errorMessage}
          initialQty={editingItem.qty}
          loading={saving}
          onCancel={() => {
            if (!saving) {
              setEditingItem(null);
              setErrorMessage(null);
            }
          }}
          onConfirm={handleSave}
          productName={editingItem.productName}
        />
      ) : null}
    </>
  );
}
