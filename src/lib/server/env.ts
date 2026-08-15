import "server-only";

import { resolveWpGraphqlEndpoint, resolveWpRestBase } from "@/lib/wp-endpoints";

type EnvKey =
  | "APP_URL"
  | "NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT"
  | "NEXT_PUBLIC_WP_REST_BASE"
  | "NEXTAUTH_SECRET"
  | "NEXTAUTH_URL"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET";

const requiredServerEnv: EnvKey[] = ["NEXTAUTH_SECRET", "NEXTAUTH_URL"];

export function getServerEnv() {
  const missing = requiredServerEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required server env vars: ${missing.join(", ")}`);
  }

  return {
    APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT: getWpGraphqlEndpoint(),
    NEXT_PUBLIC_WP_REST_BASE: getWpRestBase(),
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET as string,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL as string,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  };
}

export function getWpGraphqlEndpoint(): string {
  return resolveWpGraphqlEndpoint();
}

export function getWpRestBase(): string {
  return resolveWpRestBase();
}

export function isMockDataEnabled() {
  return process.env.USE_MOCK_DATA === "true";
}
