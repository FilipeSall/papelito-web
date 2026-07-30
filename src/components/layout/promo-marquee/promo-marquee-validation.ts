import type { PromoMarqueeItem } from "@/types/home-assets";

import {
  PROMO_MARQUEE_MAX_LENGTH,
  PROMO_MARQUEE_MIN_ACTIVE_MESSAGES,
} from "./constants";

export type PromoMarqueeValidation = {
  activeCount: number;
  isValid: boolean;
  message: string;
  missingActiveMessages: number;
};

export function getPromoMarqueeValidation(messages: PromoMarqueeItem[]): PromoMarqueeValidation {
  const activeCount = messages.filter((message) => message.isActive).length;
  const missingActiveMessages = Math.max(0, PROMO_MARQUEE_MIN_ACTIVE_MESSAGES - activeCount);

  if (missingActiveMessages > 0) {
    return {
      activeCount,
      isValid: false,
      message: `Selecione pelo menos ${PROMO_MARQUEE_MIN_ACTIVE_MESSAGES} frases para manter a faixa de avisos ativa. Ative mais ${missingActiveMessages} frase${missingActiveMessages === 1 ? "" : "s"}.`,
      missingActiveMessages,
    };
  }

  if (
    messages.some(
      (message) =>
        message.text.trim() === "" || message.text.trim().length > PROMO_MARQUEE_MAX_LENGTH,
    )
  ) {
    return {
      activeCount,
      isValid: false,
      message: `Preencha todas as mensagens com até ${PROMO_MARQUEE_MAX_LENGTH} caracteres antes de salvar.`,
      missingActiveMessages: 0,
    };
  }

  return {
    activeCount,
    isValid: true,
    message: "",
    missingActiveMessages: 0,
  };
}
