import { getTokenDefinition } from "@/features/rich-text";

import { TOKEN_ATTRIBUTE, TOKEN_PARAMS_ATTRIBUTE } from "./serialize";

const CHIP_CLASS =
  "mx-0.5 inline-flex select-none items-center gap-1 rounded-none border-2 border-[#1a1a1a] bg-brand-yellow px-1.5 py-0.5 align-baseline text-[11px] font-black uppercase tracking-[0.06em] text-[#1a1a1a]";

export function chipLabel(token: string, params?: Record<string, string>, productName?: string) {
  const definition = getTokenDefinition(token);

  if (!definition) {
    return token;
  }

  if (definition.paramKind === "promotion-product") {
    return `${productName ?? `Produto #${params?.productId ?? "?"}`} → ${definition.label}`;
  }

  return definition.label;
}

export function createChipElement(
  document: Document,
  token: string,
  params: Record<string, string> | undefined,
  productName?: string,
) {
  const chip = document.createElement("span");
  chip.setAttribute(TOKEN_ATTRIBUTE, token);
  chip.setAttribute("contenteditable", "false");
  chip.className = CHIP_CLASS;
  chip.textContent = chipLabel(token, params, productName);

  if (params) {
    chip.setAttribute(TOKEN_PARAMS_ATTRIBUTE, JSON.stringify(params));
  }

  return chip;
}
