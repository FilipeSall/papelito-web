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
      <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div className="h-2 w-full bg-brand-yellow" />

        <div className="flex items-start justify-between gap-4 border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-5">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rotate-45 bg-brand-yellow" />
              Cadastro incompleto
            </p>
            <h2
              className="mt-1 text-2xl font-black uppercase tracking-tight text-[#1a1a1a]"
              id={TITLE_ID}
            >
              Ops, precisamos do seu CEP
            </h2>
          </div>

          <button
            aria-label="Fechar modal"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-2 border-transparent text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-brand-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative h-28 w-full overflow-hidden border-2 border-[#1a1a1a] bg-white sm:h-32 sm:w-32 sm:shrink-0">
              <Image
                alt=""
                aria-hidden
                className="object-contain p-3"
                fill
                sizes="128px"
                src={PRODUCT_FALLBACK_IMAGE}
              />
            </div>

            <p
              className="text-sm leading-6 text-[#1a1a1a]/80 sm:text-[15px]"
              id={DESCRIPTION_ID}
            >
              Para mostrar informações corretas para a sua região, cadastre seu CEP.
              Você pode fazer isso agora ou continuar navegando e preencher depois.
            </p>
          </div>

          <div className="border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
            <p className="font-black uppercase tracking-[0.16em]">Por que pedimos o CEP</p>
            <p className="mt-2 leading-6">
              Com o CEP salvo, a plataforma consegue exibir disponibilidade regional com mais precisão.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-4">
          <button
            className="inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
            onClick={onClose}
            type="button"
          >
            Agora não
          </button>
          <button
            className="inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
            onClick={onConfirm}
            type="button"
          >
            Cadastrar CEP
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
