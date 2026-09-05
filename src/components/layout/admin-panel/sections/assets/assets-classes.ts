import { FOCUS_RING } from "@/components/layout/admin-panel/primitives";

const ACTION_BASE = `inline-flex cursor-pointer items-center justify-center gap-2 rounded-none border-2 font-black uppercase transition ${FOCUS_RING} disabled:cursor-not-allowed disabled:opacity-45`;

export const COMPACT_PRIMARY_CLASS = `${ACTION_BASE} h-9 border-[#1a1a1a] bg-[#1a1a1a] px-3.5 text-[10px] tracking-[0.16em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:shadow-none`;

export const COMPACT_SECONDARY_CLASS = `${ACTION_BASE} h-9 border-[#1a1a1a] bg-white px-3.5 text-[10px] tracking-[0.16em] text-[#1a1a1a] hover:bg-brand-yellow`;

export const COMPACT_DESTRUCTIVE_CLASS = `${ACTION_BASE} h-9 border-[#c0392b] bg-white px-3.5 text-[10px] tracking-[0.16em] text-[#8b1f16] hover:bg-[#c0392b] hover:text-white`;

export const SECONDARY_ACTION_CLASS = `${ACTION_BASE} h-11 border-[#1a1a1a] bg-white px-4 text-[11px] tracking-[0.18em] text-[#1a1a1a] hover:bg-brand-yellow`;

export const ROW_ICON_BUTTON_CLASS = `${ACTION_BASE} h-8 w-8 shrink-0 border-[#1a1a1a] bg-white p-0 text-[#1a1a1a] hover:bg-brand-yellow`;

export const MODAL_CLOSE_CLASS = `${ACTION_BASE} h-9 w-9 shrink-0 border-transparent bg-transparent p-0 text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-brand-yellow`;

export const HARD_BOX_CLASS = "rounded-none border-2 border-[#1a1a1a] bg-white p-4";

export const HARD_DASHED_BOX_CLASS =
  "rounded-none border-2 border-dashed border-[#1a1a1a] bg-[#faf8f2] px-4 py-6 text-sm leading-6 text-[#231f20]/64";

export const SUMMARY_TEXT_CLASS =
  "text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55";

export const EYEBROW_TEXT_CLASS =
  "text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50";
