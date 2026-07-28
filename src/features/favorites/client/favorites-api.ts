import type { FavoriteMutationResult, FavoritesPayload } from "../types/favorites";

export class FavoritesAuthError extends Error {
  status: number;

  constructor(message = "Não autenticado.", status = 401) {
    super(message);
    this.name = "FavoritesAuthError";
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function fetchFavoritesClient(): Promise<FavoritesPayload> {
  const response = await fetch("/api/profile/favorites", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = await parseResponse<FavoritesPayload & { message?: string }>(response);

  if (response.status === 401) {
    throw new FavoritesAuthError(payload.message);
  }

  if (!response.ok) {
    throw new Error(payload.message || "Não foi possível carregar os favoritos.");
  }

  return payload;
}

export async function addFavoriteClient(productId: string | number): Promise<FavoriteMutationResult> {
  const response = await fetch("/api/profile/favorites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ productId }),
  });

  const payload = await parseResponse<FavoriteMutationResult & { message?: string }>(response);

  if (response.status === 401) {
    throw new FavoritesAuthError(payload.message);
  }

  if (!response.ok) {
    throw new Error(payload.message || "Não foi possível favoritar o produto.");
  }

  return payload;
}

export async function removeFavoriteClient(
  productId: string | number,
): Promise<FavoriteMutationResult> {
  const response = await fetch(`/api/profile/favorites/${productId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await parseResponse<FavoriteMutationResult & { message?: string }>(response);

  if (response.status === 401) {
    throw new FavoritesAuthError(payload.message);
  }

  if (!response.ok) {
    throw new Error(payload.message || "Não foi possível remover o produto dos favoritos.");
  }

  return payload;
}
