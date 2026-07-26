"use client";

import { BaseModal } from "@/components/ui/base-modal";

type CancelOnboardingModalProps = {
  open: boolean;
  isLeaving?: boolean;
  onKeepEditing: () => void;
  onConfirm: () => void;
};

export function CancelOnboardingModal({
  open,
  isLeaving = false,
  onKeepEditing,
  onConfirm,
}: CancelOnboardingModalProps) {
  return (
    <BaseModal
      open={open}
      onClose={onKeepEditing}
      ariaLabelledBy="cancel-onboarding-title"
      ariaDescribedBy="cancel-onboarding-description"
      contentClassName="max-w-md border-2 border-[#1a1a1a] bg-white p-6 shadow-[6px_6px_0px_#1a1a1a]"
    >
      <h2
        id="cancel-onboarding-title"
        className="text-lg font-black uppercase tracking-tight text-[#1a1a1a]"
      >
        Sair do cadastro?
      </h2>
      <p id="cancel-onboarding-description" className="mt-3 text-sm leading-5 text-[#231f20]/80">
        Você sairá da sua conta e voltará a navegar como visitante. O que já foi preenchido fica
        salvo — é só entrar com o Google de novo para continuar de onde parou.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onKeepEditing}
          disabled={isLeaving}
          className="cursor-pointer rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide text-[#1a1a1a] transition hover:bg-[#1a1a1a]/5 disabled:opacity-50"
        >
          Continuar cadastro
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLeaving}
          className="cursor-pointer rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-black uppercase tracking-wide text-brand-yellow transition hover:opacity-90 disabled:opacity-60"
        >
          {isLeaving ? "Saindo..." : "Sair mesmo assim"}
        </button>
      </div>
    </BaseModal>
  );
}
