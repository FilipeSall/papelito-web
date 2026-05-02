import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getSession } from "next-auth/react";

const endpoint =
  process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT ?? "http://localhost:8080/graphql";

const httpLink = new HttpLink({ uri: endpoint });

const authLink = setContext(async (_, { headers }) => {
  if (typeof window === "undefined") {
    return { headers };
  }

  const session = await getSession();

  return {
    headers: {
      ...headers,
      ...(session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: { fetchPolicy: "cache-first" },
    watchQuery: { fetchPolicy: "cache-and-network" },
  },
});
