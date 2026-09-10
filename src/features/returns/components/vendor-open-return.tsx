"use client";

import { Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FOCUS_RING } from "@/components/layout/operational-panel";

import { returnReasonLabel } from "../return-status";

type ReturnItem = { itemId: number; name: string; qty: number };
type Selection = { checked: boolean; qty: number };

const primaryButton = [
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
  FOCUS_RING,
].join(" ");

const secondaryButton = [
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

export function VendorOpenReturn({
  items,
  orderId,
  reason,
  reasonOther,
  threadId,
}: Readonly<{
  items: ReturnItem[];
  orderId: number;
  reason: string;
  reasonOther: string | null;
  threadId: number;
}>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<number, Selection>>(() =>
    Object.fromEntries(
      items.map((item) => [
        item.itemId,
        { checked: items.length === 1, qty: 1 },
      ]),
    ),
  );

  function update(itemId: number, patch: Partial<Selection>) {
    setSelection((current) => ({
      ...current,
      [itemId]: { ...current[itemId], ...patch },
    }));
  }

  async function submit() {
    const selected = items
      .filter((item) => selection[item.itemId]?.checked)
      .map((item) => ({
        orderItemId: item.itemId,
        qty: selection[item.itemId].qty,
      }));

    if (selected.length === 0) {
      setError("Marque ao menos um item para devolver.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/vendor/orders/${orderId}/returns`, {
        body: JSON.stringify({ items: selected, threadId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? "Não foi possível iniciar a devolução.");
        return;
      }

      router.push(`/vendor/devolucoes/${payload?.id ?? ""}`);
      router.refresh();
    } catch {
      setError("Não foi possível falar com o servidor. Verifique sua conexão.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        className={secondaryButton}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Undo2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
        Iniciar devolução
      </button>
    );
  }

  return (
    <section className="space-y-4 border-t-2 border-[#1a1a1a]/10 bg-[#faf8f2] px-5 py-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/55">
          Motivo da devolução
        </p>
        <p className="mt-1 text-sm font-bold text-[#1a1a1a]">
          {returnReasonLabel(reason)}
          {reason === "other" && reasonOther ? ` — ${reasonOther}` : ""}
        </p>
      </div>

      {error ? (
        <p className="text-sm font-semibold text-red-700">⚠ {error}</p>
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => {
          const row = selection[item.itemId];
          return (
            <li
              className="border-2 border-[#1a1a1a]/20 bg-white p-3"
              key={item.itemId}
            >
              <label className="flex items-start gap-3">
                <input
                  checked={row?.checked ?? false}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a1a1a]"
                  onChange={(event) =>
                    update(item.itemId, { checked: event.target.checked })
                  }
                  type="checkbox"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-[#1a1a1a]">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/55">
                    Comprado {item.qty}
                  </span>
                </span>
              </label>
              {row?.checked && item.qty > 1 ? (
                <label className="mt-3 flex items-center gap-3 pl-7 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
                  Devolver
                  <input
                    className={`h-11 w-20 border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none ${FOCUS_RING}`}
                    max={item.qty}
                    min={1}
                    onChange={(event) =>
                      update(item.itemId, {
                        qty: Number(event.target.value) || 1,
                      })
                    }
                    type="number"
                    value={row.qty}
                  />
                </label>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-3">
        <button
          className={primaryButton}
          disabled={busy}
          onClick={() => void submit()}
          type="button"
        >
          {busy ? "Iniciando..." : "Registrar devolução"}
        </button>
        <button
          className={secondaryButton}
          disabled={busy}
          onClick={() => setOpen(false)}
          type="button"
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}
