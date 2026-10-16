import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type { FinancialProfile, VendorPaymentSummary } from "../types/payment-gateways";
import { parseFinancialProfile, parseVendorPaymentSummary } from "../utils/parse-payment-gateways";

/**
 * Resumo de saúde dos gateways, preferência e conta Mercado Pago do vendor autenticado.
 *
 * O WordPress é a autoridade; o cache é curto e marcado com `vendor-payment-gateways`, que as
 * rotas de mutação invalidam. Sem sessão, falha ou resposta malformada devolve `null` — quem
 * chama mantém o painel legado em vez de desenhar um estado inventado.
 */
export async function getVendorPaymentGateways(): Promise<VendorPaymentSummary | null> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) return null;

  const result = await wpRest<unknown>("/papelito/v1/vendor/payment-gateways", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 60,
    tags: ["vendor-payment-gateways"],
  });

  return result.ok ? parseVendorPaymentSummary(result.data) : null;
}

/**
 * Perfil financeiro comum do vendor, com CPF e nascimento só como indicadores.
 *
 * Sem cache: a `version` lida aqui é a que o PATCH apresenta, e uma cópia velha viraria 409.
 * Falha devolve `null` e o formulário mostra que não leu, sem campos vazios que pareçam salvos.
 */
export async function getVendorFinancialProfile(): Promise<FinancialProfile | null> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) return null;

  const result = await wpRest<unknown>("/papelito/v1/vendor/financial-profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  return result.ok ? parseFinancialProfile(result.data) : null;
}
