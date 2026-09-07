import { http, HttpResponse } from "msw";

import {
  DEFAULT_SOCIAL_PROFILES,
  type SocialNetworkId,
} from "@/features/site-contact/social-profiles";

let storedPhone = "+556198364920";
let storedSocial: Record<SocialNetworkId, string> = { ...DEFAULT_SOCIAL_PROFILES };

export function setContactConfigPhone(phone: string) {
  storedPhone = phone;
}

export function getContactConfigPhone() {
  return storedPhone;
}

export function setContactConfigSocial(social: Partial<Record<SocialNetworkId, string>>) {
  storedSocial = { ...DEFAULT_SOCIAL_PROFILES, ...social };
}

export function getContactConfigSocial() {
  return storedSocial;
}

export const contactConfigHandlers = [
  http.get("*/api/admin/contact-config", () =>
    HttpResponse.json({ phone: storedPhone, social: storedSocial }),
  ),
  http.put("*/api/admin/contact-config", async ({ request }) => {
    const body = (await request.json()) as {
      phone?: string;
      social?: Partial<Record<SocialNetworkId, string>>;
    };
    storedPhone = body.phone ?? storedPhone;
    storedSocial = body.social ? { ...storedSocial, ...body.social } : storedSocial;

    return HttpResponse.json({ phone: storedPhone, social: storedSocial });
  }),
];
