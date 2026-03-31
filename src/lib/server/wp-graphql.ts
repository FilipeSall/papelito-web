import "server-only";

export async function wpGraphqlRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const endpoint = process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT;

  if (!endpoint) {
    throw new Error("NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT is not configured.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
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
