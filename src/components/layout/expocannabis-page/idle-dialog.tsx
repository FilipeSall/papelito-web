"use client";

import { BaseModal } from "@/components/ui/base-modal";

type IdleDialogProps = {
  open: boolean;
  onContinue: () => void;
};

/** Aviso "Ainda tá aí?" depois de 3 min sem toque; sem resposta em 20 s o atendimento é apagado. */
export function IdleDialog({ open, onContinue }: Readonly<IdleDialogProps>) {
  return (
    <BaseModal open={open} onClose={onContinue} ariaLabelledBy="expo-idle-title" contentClassName="max-w-md">
      <div className="rounded-xl bg-white p-8 text-[#231F20]">
        <h2 id="expo-idle-title" className="text-2xl font-extrabold">
          Ainda tá aí?
        </h2>
        <p className="mt-2 text-base font-medium text-[#52525B]">Sem resposta em 20 segundos, o atendimento é apagado.</p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 h-14 w-full rounded-md bg-brand-yellow text-lg font-extrabold text-[#231F20] shadow-[0_5px_0_#231F20]"
        >
          Continuar
        </button>
      </div>
    </BaseModal>
  );
}
