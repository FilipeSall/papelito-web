"use client";

import { BaseModal } from "@/components/ui/base-modal";
import { EXPO_SCOPE_CLASS } from "@/features/expocannabis/fonts";

type IdleDialogProps = {
  open: boolean;
  onContinue: () => void;
};

/** Aviso "Ainda tá aí?" depois de 3 min sem toque; sem resposta em 20 s o atendimento é apagado. */
export function IdleDialog({ open, onContinue }: Readonly<IdleDialogProps>) {
  return (
    <BaseModal
      open={open}
      onClose={onContinue}
      ariaLabelledBy="expo-idle-title"
      containerClassName={`${EXPO_SCOPE_CLASS} items-center justify-center px-4 py-6`}
      overlayClassName="bg-black/45 expo-dim"
      contentClassName="max-w-md"
    >
      <div className="rounded-xl bg-white p-8 text-[#231F20]">
        <h2 id="expo-idle-title" className="text-2xl font-extrabold">
          Ainda tá aí?
        </h2>
        <p className="mt-2 text-base font-medium text-[#52525B]">Sem resposta em 20 segundos, o atendimento é apagado.</p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 min-h-[60px] w-full rounded-lg bg-brand-yellow text-lg font-extrabold text-[#231F20] transition-transform duration-120 active:scale-97 motion-reduce:transition-none"
        >
          Continuar
        </button>
      </div>
    </BaseModal>
  );
}
