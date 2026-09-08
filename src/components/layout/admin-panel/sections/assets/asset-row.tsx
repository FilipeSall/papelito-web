"use client";

import Image from "next/image";
import { ImageOff, type LucideIcon } from "lucide-react";

import { StatusChip } from "@/components/layout/admin-panel/primitives";

import { ROW_EDIT_BUTTON_CLASS } from "./assets-classes";
import { ASSET_STATUS, type AssetStatus } from "./assets-status";

const THUMB_TONE_CLASS = {
  dark: "bg-brand-dark",
  light: "bg-white",
  yellow: "bg-brand-yellow",
} as const;

export type AssetThumbTone = keyof typeof THUMB_TONE_CLASS;

export function AssetThumb({
  imageUrl,
  label,
  tone = "light",
}: {
  imageUrl: string;
  label: string;
  tone?: AssetThumbTone;
}) {
  return (
    <div
      className={`flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden border-2 border-[#1a1a1a] ${THUMB_TONE_CLASS[tone]}`}
    >
      {imageUrl ? (
        <Image
          alt=""
          aria-hidden
          className="h-full w-full object-contain p-1"
          height={52}
          src={imageUrl}
          unoptimized
          width={52}
        />
      ) : (
        <>
          <ImageOff aria-hidden className="h-5 w-5 text-[#1a1a1a]/35" strokeWidth={2.2} />
          <span className="sr-only">{label} sem imagem</span>
        </>
      )}
    </div>
  );
}

export function AssetIconThumb({
  icon: Icon,
  label,
  tone = "light",
}: {
  icon: LucideIcon;
  label: string;
  tone?: AssetThumbTone;
}) {
  return (
    <div
      className={`flex h-13 w-13 shrink-0 items-center justify-center border-2 border-[#1a1a1a] ${THUMB_TONE_CLASS[tone]}`}
    >
      <Icon aria-hidden className="h-5 w-5 text-[#1a1a1a]" strokeWidth={2.2} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Uma linha por asset, sempre na mesma gramática: identidade à esquerda, onde ele aparece no meio,
 * estado e ações à direita.
 *
 * O `EDITAR` é um botão de verdade, e a linha inteira não é mais clicável. Antes o clicável era um
 * overlay `absolute inset-0`, mas o contêiner das ações é `relative z-10` e fica por cima dele:
 * clicar no próprio `EDITAR` não abria nada, só clicar no vazio da linha abria. Um alvo que parece
 * botão precisa ser o botão.
 */
export function AssetRow({
  actions,
  isUnsaved = false,
  onOpen,
  status,
  title,
  where,
  thumbnail,
}: {
  actions?: React.ReactNode;
  isUnsaved?: boolean;
  onOpen: () => void;
  status: AssetStatus;
  title: string;
  where: string;
  thumbnail: React.ReactNode;
}) {
  return (
    <li className="bg-[#faf8f2] transition hover:bg-white">
      <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-3">
            {thumbnail}
            <div className="min-w-0">
              <p className="truncate font-black uppercase tracking-tight text-[#1a1a1a]">{title}</p>
              <p className="mt-0.5 truncate text-xs text-[#231f20]/60 lg:hidden">{where}</p>
            </div>
          </div>
        </div>

        <div className="min-w-0 lg:w-[30%]">
          <p className="hidden text-[10px] font-black uppercase leading-4 tracking-[0.14em] text-[#231f20]/55 lg:block">
            {where}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <span className="flex flex-wrap items-center gap-3">
            {isUnsaved ? (
              <StatusChip
                compact
                icon={ASSET_STATUS.unsaved.icon}
                label={ASSET_STATUS.unsaved.label}
                tone={ASSET_STATUS.unsaved.tone}
              />
            ) : null}
            <StatusChip icon={status.icon} label={status.label} tone={status.tone} />
          </span>
          {actions}
          <button
            aria-label={`Editar ${title}`}
            className={ROW_EDIT_BUTTON_CLASS}
            onClick={onOpen}
            type="button"
          >
            Editar
          </button>
        </div>
      </div>
    </li>
  );
}

export function AssetEmptyRow({ body, title }: { body: string; title: string }) {
  return (
    <li className="px-5 py-10 text-center">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#231f20]/64">{body}</p>
    </li>
  );
}
