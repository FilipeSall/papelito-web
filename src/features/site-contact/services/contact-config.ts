import "server-only";
import { wpRest } from "@/lib/server/wp-rest";
import { DEFAULT_CONTACT_PHONE } from "../contact-phone";
export type ContactConfig = { phone: string };
export async function getContactConfig(token?: string) {
  const result = await wpRest<ContactConfig>(token ? "/papelito/v1/admin/contact-config" : "/papelito/v1/home/contact-config", token ? { headers: { Authorization: `Bearer ${token}` } } : { revalidate: 60, tags: ["wp:contact-config"] });
  return result.ok ? result.data : { phone: DEFAULT_CONTACT_PHONE };
}
export async function saveContactConfig(token: string, config: ContactConfig) {
  const result = await wpRest<ContactConfig>("/papelito/v1/admin/contact-config", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, json: config });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
