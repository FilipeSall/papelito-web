"use client";

import { useState } from "react";

import { BaseModal } from "@/components/ui/base-modal";
import type { EventPaymentMethod, ManualConfirmInput } from "@/features/expocannabis/types/order";

import { RadioCard } from "./radio-card";
import { TextField } from "./text-field";

type ManualConfirmDialogProps = {
  open: boolean;
  defaultMethod: EventPaymentMethod;
  error: string;
  busy: boolean;
  onSubmit: (input: ManualConfirmInput) => void;
  onClose: () => void;
};

/** Liberação manual do supervisor: NSU ou ID da transação, forma e motivo. */
export function ManualConfirmDialog({ open, defaultMethod, error, busy, onSubmit, onClose }: Readonly<ManualConfirmDialogProps>) {
  const [nsu, setNsu] = useState("");
  const [method, setMethod] = useState<EventPaymentMethod>(defaultMethod);
  const [reason, setReason] = useState("");

  return (
    <BaseModal open={open} onClose={onClose} ariaLabelledBy="expo-manual-title" contentClassName="w-full max-w-lg">
      <form
        className="grid gap-4 rounded-xl bg-white p-6 text-[#231F20]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ nsu: nsu.trim(), method, reason: reason.trim() });
        }}
      >
        <h2 id="expo-manual-title" className="text-[22px] font-extrabold">
          Liberar manualmente
        </h2>
        <TextField id="expo-nsu" label="NSU ou ID da transação" value={nsu} onChange={setNsu} />
        <div role="radiogroup" aria-label="Forma de pagamento" className="grid grid-cols-2 gap-3">
          <RadioCard title="Cartão" checked={method === "card"} onSelect={() => setMethod("card")} />
          <RadioCard title="Pix" checked={method === "pix"} onSelect={() => setMethod("pix")} />
        </div>
        <TextField id="expo-reason" label="Motivo" value={reason} onChange={setReason} />
        {error ? (
          <p role="alert" className="text-sm font-bold text-[#B42318]">
            {error}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-14 rounded-md border-2 border-[#231F20] font-extrabold">
            Cancelar
          </button>
          <button type="submit" disabled={busy} className="h-14 rounded-md bg-[#231F20] font-extrabold text-brand-yellow disabled:opacity-50">
            Liberar pagamento
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
