import "server-only";

type EnvKey = "NEXTAUTH_SECRET" | "NEXTAUTH_URL";

const requiredServerEnv: EnvKey[] = ["NEXTAUTH_SECRET", "NEXTAUTH_URL"];

export function getServerEnv() {
  const missing = requiredServerEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required server env vars: ${missing.join(", ")}`);
  }

  return {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET as string,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL as string,
  };
}
