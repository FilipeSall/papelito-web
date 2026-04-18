import type { ProfileCouponsPayload } from "../types/profile-coupons";

/**
 * Busca os cupons do usuário autenticado na API da área privada.
 *
 * TODO(backend-coupons): substituir endpoint mock por integração real
 * com regras de elegibilidade e validade.
 */
export async function requestProfileCoupons(
  signal?: AbortSignal,
): Promise<ProfileCouponsPayload> {
  const response = await fetch("/api/profile/coupons", {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar os cupons.");
  }

  return (await response.json()) as ProfileCouponsPayload;
}
