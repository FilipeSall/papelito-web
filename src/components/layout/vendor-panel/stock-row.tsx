"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { VendorStockItem } from "@/features/vendor-stock/types/vendor-stock";

export function StockRow({
  focused,
  item,
  onFeedback,
}: {
  focused: boolean;
  item: VendorStockItem;
  onFeedback: (message: string, error?: boolean) => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLTableRowElement>(null);
  const [qty, setQty] = useState(String(item.qty));
  const [saving, setSaving] = useState(false);

  useEffect(() => setQty(String(item.qty)), [item.qty]);
  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focused]);

  async function save() {
    const nextQty = Number(qty);
    if (!Number.isInteger(nextQty) || nextQty < 0) {
      onFeedback("Informe uma quantidade inteira maior ou igual a zero.", true);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/vendor/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: item.productId, qty: nextQty }),
      });
      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        onFeedback(data?.message ?? "Nao foi possivel atualizar o estoque.", true);
        return;
      }

      onFeedback(nextQty === 0 ? "Estoque zerado. A notificacao foi registrada." : "Estoque atualizado.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className={focused ? "bg-brand-yellow/18" : ""} ref={ref}>
      <td className="border-b border-brand-dark/8 px-4 py-3">
        <p className="text-sm font-semibold text-brand-dark">{item.productName}</p>
        <p className="text-xs text-brand-dark/48">{item.sku || "Sem SKU"}</p>
      </td>
      <td className="border-b border-brand-dark/8 px-4 py-3 text-sm text-brand-dark/68">
        {item.updatedAt || "Sem ajuste"}
      </td>
      <td className="border-b border-brand-dark/8 px-4 py-3">
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            item.qty === 0 ? "bg-[#f3e3df] text-[#7a3428]" : "bg-[#e4efe0] text-[#28422d]"
          }`}
        >
          {item.qty === 0 ? "Zerado" : "Disponivel"}
        </span>
      </td>
      <td className="border-b border-brand-dark/8 px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <input
            aria-label={`Quantidade de ${item.productName}`}
            className="h-10 w-20 rounded-[10px] border border-brand-dark/16 bg-white px-3 text-right text-sm outline-none focus:border-brand-dark"
            min={0}
            onChange={(event) => setQty(event.target.value)}
            type="number"
            value={qty}
          />
          <button
            className="h-10 rounded-[10px] bg-brand-dark px-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-yellow disabled:opacity-45"
            disabled={saving || qty === String(item.qty)}
            onClick={save}
            type="button"
          >
            {saving ? "Salvando" : "Salvar"}
          </button>
        </div>
      </td>
    </tr>
  );
}
