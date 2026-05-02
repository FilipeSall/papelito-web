import "server-only";

import { getWpGraphqlEndpoint } from "./env";

export async function wpGraphqlRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
  options?: {
    token?: string;
    headers?: Record<string, string>;
    cache?: RequestCache;
  },
): Promise<TData> {
  const endpoint = getWpGraphqlEndpoint();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options?.headers,
    },
    body: JSON.stringify({ query, variables }),
    cache: options?.cache ?? "no-store",
  });

  if (!response.ok) {
    throw new Error(`WPGraphQL request failed with status ${response.status}`);
  }

  const result = (await response.json()) as {
    data?: TData;
    errors?: Array<{ message: string }>;
  };

  if (result.errors?.length) {
    throw new Error(result.errors.map((err) => err.message).join("; "));
  }

  if (!result.data) {
    throw new Error("WPGraphQL response did not include data.");
  }

  return result.data;
}
