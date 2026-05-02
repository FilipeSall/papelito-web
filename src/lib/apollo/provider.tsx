"use client";

import { ApolloProvider } from "@apollo/client/react";
import type { ReactNode } from "react";

import { apolloClient } from "./client";

export function ApolloAppProvider({ children }: { children: ReactNode }) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
