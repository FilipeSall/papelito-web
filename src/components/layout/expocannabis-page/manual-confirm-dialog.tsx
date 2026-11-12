"use client";

import { useState } from "react";

import { BaseModal } from "@/components/ui/base-modal";
import { EXPO_SCOPE_CLASS } from "@/features/expocannabis/fonts";
import type { EventPaymentMethod, ManualConfirmInput } from "@/features/expocannabis/types/order";

import { RadioCard } from "./radio-card";
import { TextField } from "./text-field";
import { WarnBox } from "./warn-box";

type ManualConfirmDialogProps = {
  open: boolean;
  defaultMethod: EventPaymentMethod;
  error: string;
  busy: boolean;
  onSubmit: (input: ManualConfirmInput) => void;
  onClose: () => void;
};

const ACTION = "min-h-15 rounded-lg px-4 text-lg font-extrabold transition-transform duration-120 enabled:active:scale-98 disabled:opacity-60 motion-reduce:transition-none";

/** Liberação manual do supervisor: NSU ou ID da transação, forma e motivo. Renderiza em portal, com o escopo visual do estande. */
export function ManualConfirmDialog({ open, defaultMethod, error, busy, onSubmit, onClose }: Readonly<ManualConfirmDialogProps>) {
  const [nsu, setNsu] = useState("");
  const [method, setMethod] = useState<EventPaymentMethod>(defaultMethod);
  const [reason, setReason] = useState("");

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      ariaLabelledBy="expo-manual-title"
      containerClassName={`${EXPO_SCOPE_CLASS} items-center justify-center px-4 py-6`}
      overlayClassName="bg-black/45 expo-dim"
      contentClassName="w-full max-w-lg"
    >
      <form
        className="grid gap-3.5 rounded-xl bg-white p-6 text-[#231F20]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ nsu: nsu.trim(), method, reason: reason.trim() });
        }}
      >
        <h2 id="expo-manual-title" className="text-[22px] font-extrabold">
          Liberar manualmente
        </h2>
        <TextField id="expo-nsu" label="NSU ou ID da transação" value={nsu} onChange={setNsu} />
        <div role="radiogroup" aria-label="Forma de pagamento" className="grid grid-cols-2 gap-2.5">
          <RadioCard title="Cartão" checked={method === "card"} onSelect={() => setMethod("card")} />
          <RadioCard title="Pix" checked={method === "pix"} onSelect={() => setMethod("pix")} />
        </div>
        <TextField id="expo-reason" label="Motivo" value={reason} onChange={setReason} />
        {error ? <WarnBox>{error}</WarnBox> : null}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className={`${ACTION} bg-[#F4F4F5]`}>
            Cancelar
          </button>
          <button type="submit" disabled={busy} className={`${ACTION} bg-[#231F20] text-brand-yellow`}>
            Liberar pagamento
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
