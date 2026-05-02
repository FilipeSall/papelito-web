import "server-only";

import { getWpGraphqlEndpoint } from "./env";

type WpGraphqlOptions = {
  token?: string;
  headers?: Record<string, string>;
  cache?: RequestCache;
  revalidate?: number | false;
  tags?: string[];
};

export async function wpGraphqlRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
  options?: WpGraphqlOptions,
): Promise<TData> {
  const endpoint = getWpGraphqlEndpoint();

  const fetchInit: RequestInit & {
    next?: { revalidate?: number | false; tags?: string[] };
  } = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options?.headers,
    },
    body: JSON.stringify({ query, variables }),
  };

  const isAuthRequest = Boolean(options?.token);

  if (isAuthRequest || options?.cache === "no-store") {
    fetchInit.cache = "no-store";
  } else if (options?.cache) {
    fetchInit.cache = options.cache;
  } else {
    fetchInit.next = {
      revalidate: options?.revalidate ?? 60,
      ...(options?.tags?.length ? { tags: options.tags } : {}),
    };
  }

  const response = await fetch(endpoint, fetchInit);

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
