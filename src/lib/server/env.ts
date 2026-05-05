import "server-only";

type EnvKey =
  | "NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT"
  | "NEXT_PUBLIC_WP_REST_BASE"
  | "NEXTAUTH_SECRET"
  | "NEXTAUTH_URL"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET";

const requiredServerEnv: EnvKey[] = ["NEXTAUTH_SECRET", "NEXTAUTH_URL"];

const LOCAL_WP_GRAPHQL_ENDPOINT = "http://localhost:8080/graphql";
const LOCAL_WP_REST_BASE = "http://localhost:8080/wp-json";

function isPlaceholderValue(value: string | undefined) {
  if (!value) {
    return true;
  }

  return value.includes("seusite.com");
}

export function getServerEnv() {
  const missing = requiredServerEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required server env vars: ${missing.join(", ")}`);
  }

  return {
    NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT: getWpGraphqlEndpoint(),
    NEXT_PUBLIC_WP_REST_BASE: getWpRestBase(),
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET as string,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL as string,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  };
}

function ensureAbsoluteUrl(endpoint: string): string {
  if (endpoint.startsWith("//")) {
    return `https:${endpoint}`;
  }
  return endpoint;
}

export function getWpGraphqlEndpoint(): string {
  const endpoint = process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT;

  if (!endpoint || isPlaceholderValue(endpoint)) {
    return LOCAL_WP_GRAPHQL_ENDPOINT;
  }

  return ensureAbsoluteUrl(endpoint);
}

export function getWpRestBase(): string {
  const endpoint = process.env.NEXT_PUBLIC_WP_REST_BASE;

  if (!endpoint || isPlaceholderValue(endpoint)) {
    return LOCAL_WP_REST_BASE;
  }

  return ensureAbsoluteUrl(endpoint);
}

export function isMockDataEnabled() {
  return process.env.USE_MOCK_DATA === "true";
}
