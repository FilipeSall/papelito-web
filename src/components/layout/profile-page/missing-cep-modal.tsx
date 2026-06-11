"use client";

import Image from "next/image";
import { X } from "lucide-react";

import { PRODUCT_FALLBACK_IMAGE } from "@/features/catalog/utils/resolve-product-image";
import { BaseModal } from "@/components/ui";

type MissingCepModalProps = {
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
};

const TITLE_ID = "missing-cep-modal-title";
const DESCRIPTION_ID = "missing-cep-modal-description";

export function MissingCepModal({
  onClose,
  onConfirm,
  open,
}: MissingCepModalProps) {
  return (
    <BaseModal
      ariaDescribedBy={DESCRIPTION_ID}
      ariaLabelledBy={TITLE_ID}
      contentClassName="max-w-[32rem]"
      onClose={onClose}
      open={open}
    >
      <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(35,31,32,0.28)]">
        <div className="h-1.5 bg-brand-yellow" />

        <div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-dark/55">
                Cadastro incompleto
              </p>
              <h2
                className="text-2xl font-black tracking-[-0.03em] text-brand-dark sm:text-[2rem]"
                id={TITLE_ID}
              >
                Ops, precisamos do seu CEP
              </h2>
            </div>

            <button
              aria-label="Fechar modal"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-dark/10 text-brand-dark/60 transition hover:bg-brand-dark/5 hover:text-brand-dark"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-5 rounded-[28px] border border-[#E9E1D0] bg-[linear-gradient(180deg,#FFFDF8_0%,#FBF8F0_100%)] p-5 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative h-28 w-full overflow-hidden rounded-[24px] bg-[#F6F1E6] sm:h-32 sm:w-32 sm:shrink-0">
              <Image
                alt=""
                aria-hidden
                className="object-contain p-3"
                fill
                sizes="128px"
                src={PRODUCT_FALLBACK_IMAGE}
              />
            </div>

            <div className="space-y-3">
              <p
                className="text-sm leading-6 text-text-tertiary sm:text-[15px]"
                id={DESCRIPTION_ID}
              >
                Para mostrar informações corretas para a sua região, cadastre seu CEP.
                Você pode fazer isso agora ou continuar navegando e preencher depois.
              </p>
              <div className="rounded-2xl border border-[#E7DFA9] bg-[#FFF7CC] px-4 py-3 text-sm leading-5 text-brand-dark/80">
                Com o CEP salvo, a plataforma consegue exibir disponibilidade regional com mais precisão.
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              className="inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-black uppercase tracking-[0.18em] text-brand-dark/65 transition hover:bg-brand-dark/5 hover:text-brand-dark"
              onClick={onClose}
              type="button"
            >
              Agora não
            </button>
            <button
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand-dark px-6 text-sm font-black uppercase tracking-[0.18em] text-brand-yellow transition hover:opacity-90"
              onClick={onConfirm}
              type="button"
            >
              Cadastrar CEP
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
