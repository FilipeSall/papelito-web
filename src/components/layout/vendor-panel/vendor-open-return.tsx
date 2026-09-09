"use client";

import { useRouter } from "next/navigation";
import { Undo2 } from "lucide-react";
import { useState } from "react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import { FOCUS_RING } from "@/components/layout/operational-panel";
import type { VendorOrderItem } from "@/features/vendor-orders/types/vendor-orders";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";

const primaryButton = [
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
  FOCUS_RING,
].join(" ");

const secondaryButton = [
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

const fieldClassName = [
  "h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none",
  FOCUS_RING,
].join(" ");

const areaClassName = [
  "min-h-20 w-full border-2 border-[#1a1a1a] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
  FOCUS_RING,
].join(" ");

const labelClassName = "block text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]";

const REASONS = [
  { label: "Desistência da compra", value: "regret" },
  { label: "Produto com defeito", value: "defective" },
  { label: "Danificado no transporte", value: "damaged" },
  { label: "Item errado", value: "incorrect_item" },
  { label: "Item incompleto", value: "incomplete_item" },
  { label: "Outro motivo", value: "other" },
];

type Selection = { checked: boolean; qty: number };

/**
 * Registra a devolução que o vendor já combinou com o cliente pelo suporte.
 *
 * O comprador nunca abre o processo sozinho — ele pede por mensagem. Este é o
 * ponto onde a conversa vira registro auditável, e por isso a devolução nasce
 * já aprovada, na etapa de autorização de postagem.
 */
export function VendorOpenReturn({
  items,
  orderId,
}: Readonly<{ items: VendorOrderItem[]; orderId: number }>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [reason, setReason] = useState(REASONS[0].value);
  const [reasonOther, setReasonOther] = useState("");
  const [selection, setSelection] = useState<Record<number, Selection>>(() =>
    Object.fromEntries(items.map((item) => [item.itemId, { checked: items.length === 1, qty: 1 }])),
  );

  function update(itemId: number, patch: Partial<Selection>) {
    setSelection((current) => ({ ...current, [itemId]: { ...current[itemId], ...patch } }));
  }

  async function submit() {
    const chosen = items
      .filter((item) => selection[item.itemId]?.checked)
      .map((item) => ({ orderItemId: item.itemId, qty: selection[item.itemId].qty }));

    if (chosen.length === 0) {
      setFeedback({ error: true, message: "⚠ Marque ao menos um item para devolver." });
      return;
    }
    if (reason === "other" && reasonOther.trim() === "") {
      setFeedback({ error: true, message: "⚠ Descreva o motivo combinado com o cliente." });
      return;
    }

    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/vendor/orders/${orderId}/returns`, {
        body: JSON.stringify({ items: chosen, orderId, reason, reasonOther: reasonOther.trim() }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback({ error: true, message: `⚠ ${payload?.message ?? "Não foi possível abrir a devolução."}` });
        return;
      }

      router.push(`/vendor/devolucoes/${payload?.id ?? ""}`);
      router.refresh();
    } catch {
      setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor. Verifique sua conexão." });
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-6 text-[#231f20]/74">
          O cliente pede a devolução pelo suporte do pedido. Depois de combinar o que volta, registre aqui —
          a devolução nasce aprovada e o próximo passo é enviar a autorização de postagem.
        </p>
        <button className={secondaryButton} onClick={() => setOpen(true)} type="button">
          <Undo2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
          Abrir devolução
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FeedbackBanner feedback={feedback} />

      <ul className="space-y-3">
        {items.map((item) => {
          const row = selection[item.itemId];
          return (
            <li className="border-2 border-[#1a1a1a]/20 bg-white p-3" key={item.itemId}>
              <label className="flex items-start gap-3">
                <input
                  checked={row?.checked ?? false}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a1a1a]"
                  onChange={(event) => update(item.itemId, { checked: event.target.checked })}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-[#1a1a1a]">{item.name}</span>
                  <span className="mt-0.5 block text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/55">
                    Comprado {item.qty}
                  </span>
                </span>
              </label>
              {row?.checked && item.qty > 1 ? (
                <div className="mt-3 flex items-center gap-3 pl-7">
                  <label className={labelClassName} htmlFor={`return-qty-${item.itemId}`}>
                    Devolver
                  </label>
                  <input
                    className={`${fieldClassName} w-20`}
                    id={`return-qty-${item.itemId}`}
                    max={item.qty}
                    min={1}
                    onChange={(event) => update(item.itemId, { qty: Number(event.target.value) || 1 })}
                    type="number"
                    value={row.qty}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <CheckoutCustomSelect
        anchoredMenu
        label="Motivo combinado *"
        labelClassName={labelClassName}
        onChange={setReason}
        options={REASONS}
        placeholder="Selecione"
        triggerClassName="mt-1.5 h-11 rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm font-semibold text-[#1a1a1a] focus:border-[#1a1a1a]"
        value={reason}
      />

      {reason === "other" ? (
        <label className="block">
          <span className={labelClassName}>Descreva o motivo *</span>
          <textarea
            className={`${areaClassName} mt-1.5`}
            maxLength={500}
            onChange={(event) => setReasonOther(event.target.value)}
            placeholder="O que o cliente relatou no suporte."
            value={reasonOther}
          />
        </label>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button className={primaryButton} disabled={busy} onClick={() => void submit()} type="button">
          {busy ? "Abrindo..." : "Registrar devolução"}
        </button>
        <button className={secondaryButton} disabled={busy} onClick={() => setOpen(false)} type="button">
          Cancelar
        </button>
      </div>
    </div>
  );
}
