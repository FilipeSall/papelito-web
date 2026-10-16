"use client";

import useSWR from "swr";

import type { PaymentContext } from "@/features/vendor-payment-gateways/types/payment-gateways";
import { useAuthSession } from "@/hooks/use-auth-session";

import { getPaymentContext, type PaymentContextInput, type PaymentContextResponse } from "../services/payment-context";
import { useCheckoutStore } from "../store/use-checkout-store";
import type { PlaceOrderInput } from "../types/checkout";

/** Estado do PaymentContext para a tela: carregando, resolvido ou erro com mensagem do catálogo. */
export type PaymentContextView =
  | { status: "loading" }
  | { status: "ready"; context: PaymentContext }
  | { status: "error"; code: string; message: string };

const NO_COMPANY: PaymentContextView = {
  status: "error",
  code: "papelito_b2b_purchase_not_allowed",
  message: "Sua empresa não está apta para finalizar a compra. Revise o cadastro empresarial.",
};

function fetchPaymentContext([, serialized]: readonly [string, string]): Promise<PaymentContextResponse> {
  return getPaymentContext(JSON.parse(serialized) as PaymentContextInput);
}

function toView(data: PaymentContextResponse | undefined): PaymentContextView {
  if (!data) return { status: "loading" };
  if (data.ok) return { status: "ready", context: data.context };

  return { status: "error", code: data.error.code, message: data.error.message };
}

/**
 * Lê o PaymentContext do carrinho e da empresa ativa antes de mostrar os meios de pagamento.
 * Re-busca quando itens ou empresa mudam e grava o gateway no store para a navegação. Erro nunca
 * vira gateway presumido: a tela bloqueia o pagamento e oferece `retry`.
 */
export function usePaymentContext(items: PlaceOrderInput["items"]) {
  const { b2b, isLoading: sessionLoading } = useAuthSession();
  const setPaymentProvider = useCheckoutStore((state) => state.setPaymentProvider);
  const companyId = typeof b2b?.companyId === "number" ? b2b.companyId : undefined;
  const enabled = items.length > 0 && companyId !== undefined;
  const serialized = JSON.stringify({ expectedCompanyId: companyId, items });

  const { data, mutate } = useSWR(enabled ? (["/api/checkout/payment-context", serialized] as const) : null, fetchPaymentContext, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
    shouldRetryOnError: false,
    onSuccess: (response) => setPaymentProvider(response.ok ? response.context.provider : null),
  });

  const noCompany = !sessionLoading && items.length > 0 && companyId === undefined;
  const view = noCompany ? NO_COMPANY : toView(data);

  return {
    view,
    retry: () => {
      void mutate();
    },
  };
}
