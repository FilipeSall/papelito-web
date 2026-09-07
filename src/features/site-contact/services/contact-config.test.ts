import { beforeEach, describe, expect, it, vi } from "vitest";

const wpRestMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/wp-rest", () => ({ wpRest: wpRestMock }));

import {
  CONTACT_CONFIG_LAYOUT_TIMEOUT_MS,
  getContactConfig,
} from "./contact-config";

describe("getContactConfig", () => {
  beforeEach(() => {
    wpRestMock.mockReset();
  });

  it("aplica timeout na leitura usada pelo layout raiz", async () => {
    wpRestMock.mockResolvedValue({
      ok: true,
      data: { phone: "+5561999999999", social: { instagram: "" } },
    });

    const result = await getContactConfig(undefined, {
      timeoutMs: CONTACT_CONFIG_LAYOUT_TIMEOUT_MS,
    });

    expect(wpRestMock).toHaveBeenCalledWith(
      "/papelito/v1/home/contact-config",
      expect.objectContaining({
        revalidate: 60,
        tags: ["wp:contact-config"],
        timeoutMs: CONTACT_CONFIG_LAYOUT_TIMEOUT_MS,
      }),
    );
    expect(result.phone).toBe("+5561999999999");
    expect(result.social.instagram).toBe("");
  });

  it("retorna defaults quando a leitura pública falha", async () => {
    wpRestMock.mockResolvedValue({ ok: false, status: 504 });

    const result = await getContactConfig(undefined, { timeoutMs: 2_000 });

    expect(result.phone).toBe("+556198364920");
    expect(result.social.instagram).toBe("https://www.instagram.com/papelitobrasil/");
  });
});
