const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]";

const FIELD_BASE = `w-full rounded-none border-2 border-[#1a1a1a] bg-white text-sm text-[#1a1a1a] outline-none transition placeholder:text-[#1a1a1a]/40 ${FOCUS_RING} disabled:cursor-not-allowed disabled:border-dashed disabled:border-[#1a1a1a]/25 disabled:bg-[#1a1a1a]/5 disabled:text-[#1a1a1a]/40`;

export const INPUT_CLASS = `h-11 px-3 leading-5 ${FIELD_BASE}`;

export const TEXTAREA_CLASS = `min-h-24 px-3 py-3 leading-6 ${FIELD_BASE}`;

export const LABEL_CLASS =
  "mb-2 block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]";

export const EYEBROW_CLASS =
  "text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56";

export const HINT_CLASS =
  "text-[11px] font-black uppercase tracking-[0.12em] text-[#231f20]/56";

export const MUTED_TEXT_CLASS = "text-sm leading-6 text-[#231f20]/70";

export const DIAMOND_CLASS = "inline-block h-2.5 w-2.5 shrink-0 rotate-45 bg-brand-yellow";

const BUTTON_BASE = `inline-flex cursor-pointer items-center justify-center gap-2 rounded-none border-2 text-xs font-black uppercase tracking-widest transition ${FOCUS_RING} disabled:cursor-not-allowed disabled:opacity-60`;

export const BUTTON_CLASS = `${BUTTON_BASE} h-11 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-brand-yellow shadow-[3px_3px_0px_#ffe500] hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:shadow-none`;

export const SECONDARY_BUTTON_CLASS = `${BUTTON_BASE} h-11 border-[#1a1a1a]/20 bg-white px-4 text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-brand-yellow`;

export const COMPACT_BUTTON_CLASS = `${BUTTON_BASE} h-9 border-[#1a1a1a]/20 bg-white px-3 text-[10px] text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-brand-yellow`;

export const DESTRUCTIVE_BUTTON_CLASS = `${BUTTON_BASE} h-9 border-[#b91c1c]/35 bg-white px-3 text-[10px] text-[#b91c1c] hover:border-[#b91c1c] hover:bg-[#b91c1c] hover:text-white`;

export const ICON_BUTTON_CLASS = `${BUTTON_BASE} h-9 w-9 shrink-0 border-[#1a1a1a]/20 bg-white p-0 text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-brand-yellow`;

export const CARD_CLASS =
  "overflow-hidden rounded-[16px] border-2 border-[#231f20]/14 bg-white shadow-[4px_4px_0_rgba(35,31,32,0.06)]";

export const CARD_HEADER_CLASS = "border-b-2 border-[#231f20]/10 bg-[#faf8f2] px-4 py-3";

export const SUBPANEL_CLASS = "rounded-[16px] border-2 border-[#231f20]/14 bg-white p-4";

export const DASHED_BOX_CLASS =
  "rounded-none border-2 border-dashed border-[#1a1a1a]/25 bg-white px-4 py-6 text-sm leading-6 text-[#231f20]/70";

export const ALERT_SUCCESS_CLASS =
  "border-2 border-[#1a1a1a] bg-brand-yellow px-4 py-3 text-sm font-black uppercase leading-6 tracking-[0.06em] text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]";

export const ALERT_WARNING_CLASS =
  "border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm font-bold leading-6 text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]";

export const ALERT_ERROR_CLASS =
  "border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3 text-sm font-bold leading-6 text-[#c0392b]";
