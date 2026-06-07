import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../../../../test/msw/server";
import { lookupCep } from "./lookup-cep";

describe("lookupCep", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("returns data from ViaCEP when available", async () => {
    await expect(lookupCep("01310930")).resolves.toEqual({
      street: "Rua das Flores",
      neighborhood: "Centro",
      city: "Sao Paulo",
      state: "SP",
    });
  });

  it("falls back to BrasilAPI when ViaCEP does not find the cep", async () => {
    server.use(
      http.get("https://viacep.com.br/ws/:digits/json/", () =>
        HttpResponse.json({ erro: true }),
      ),
    );

    await expect(lookupCep("01310930")).resolves.toEqual({
      street: "Rua da Fallback",
      neighborhood: "Bela Vista",
      city: "Sao Paulo",
      state: "SP",
    });
  });

  it("throws when both providers fail", async () => {
    await expect(lookupCep("99999999")).rejects.toThrow("CEP não encontrado.");
  });
});
