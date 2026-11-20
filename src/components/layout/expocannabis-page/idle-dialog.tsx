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
      overlayClassName="bg-black/60"
      contentClassName="max-w-md"
    >
      <div className="em-claro sombra-dura border-2 border-expo-ink bg-white p-8 text-expo-ink">
        <h2 id="expo-idle-title" className="ultra text-[30px] leading-9">
          Ainda tá aí?
        </h2>
        <p className="mt-2 text-base font-medium text-expo-mute">Sem resposta em 20 segundos, o atendimento é apagado.</p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 min-h-15 w-full bg-brand-yellow text-[18px] font-extrabold text-expo-ink"
        >
          Continuar
        </button>
      </div>
    </BaseModal>
  );
}
