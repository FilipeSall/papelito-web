import { http, HttpResponse } from "msw";

let storedPhone = "+556198364920";

export function setContactConfigPhone(phone: string) {
  storedPhone = phone;
}

export function getContactConfigPhone() {
  return storedPhone;
}

export const contactConfigHandlers = [
  http.get("*/api/admin/contact-config", () => HttpResponse.json({ phone: storedPhone })),
  http.put("*/api/admin/contact-config", async ({ request }) => {
    const body = (await request.json()) as { phone?: string };
    storedPhone = body.phone ?? storedPhone;

    return HttpResponse.json({ phone: storedPhone });
  }),
];
