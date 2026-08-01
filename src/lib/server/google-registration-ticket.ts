import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getServerEnv } from "@/lib/server/env";

const TICKET_VERSION = "v1";
const TICKET_TTL_SECONDS = 15 * 60;

export const GOOGLE_REGISTRATION_EMAIL_COOKIE = "__Host-papelito_google_registration_email";

type TicketPayload = { email: string; expiresAt: number };

function encryptionKey() {
  return createHash("sha256").update(getServerEnv().NEXTAUTH_SECRET).digest();
}

function decodePart(value: string) {
  return Buffer.from(value, "base64url");
}

export function createGoogleRegistrationTicket(email: string) {
  const payload: TicketPayload = {
    email: email.trim().toLowerCase(),
    expiresAt: Math.floor(Date.now() / 1000) + TICKET_TTL_SECONDS,
  };
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);

  return [TICKET_VERSION, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function readGoogleRegistrationTicket(ticket: string): string | null {
  const [version, ivPart, tagPart, encryptedPart, ...extra] = ticket.split(".");
  if (version !== TICKET_VERSION || !ivPart || !tagPart || !encryptedPart || extra.length > 0) {
    return null;
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), decodePart(ivPart));
    decipher.setAuthTag(decodePart(tagPart));
    const payload = JSON.parse(
      Buffer.concat([decipher.update(decodePart(encryptedPart)), decipher.final()]).toString("utf8"),
    ) as Partial<TicketPayload>;
    if (
      typeof payload.email !== "string" ||
      !payload.email ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload.email;
  } catch {
    return null;
  }
}
