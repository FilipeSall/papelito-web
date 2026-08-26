import { parsePhoneValue, toE164 } from "@/utils/phone";

export const DEFAULT_CONTACT_PHONE = "+556198364920";

/**
 * Monta o href `tel:` sempre em E.164, aceitando valores legados sem codigo internacional.
 */
export function contactPhoneHref(phone: string) {
  const parsed = parsePhoneValue(phone);
  const normalized = toE164(parsed.nationalNumber, parsed.country);

  return normalized === "" ? "" : `tel:${normalized}`;
}
