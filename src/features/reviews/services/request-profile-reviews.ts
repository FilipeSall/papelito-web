import type { ProfileReviewsPayload } from "../types/profile-reviews";

/**
 * Consome a API da área privada com as avaliações do usuário autenticado.
 *
 * TODO(backend-reviews): quando a API real estiver disponível, incluir paginação,
 * filtros por período e autenticação via token/cookie.
 */
export async function requestProfileReviews(
  signal?: AbortSignal,
): Promise<ProfileReviewsPayload> {
  const response = await fetch("/api/profile/reviews", {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar as avaliações.");
  }

  const data = (await response.json()) as ProfileReviewsPayload;
  return data;
}
