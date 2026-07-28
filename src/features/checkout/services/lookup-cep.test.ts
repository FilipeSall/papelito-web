import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../../../../test/msw/server";
import { lookupCep, lookupCepDetailed } from "./lookup-cep";

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

  it("returns a detailed invalid result when the cep has fewer than 8 digits", async () => {
    await expect(lookupCepDetailed("01310")).resolves.toEqual({
      status: "invalid",
      message: "CEP inválido. Informe 8 dígitos.",
    });
  });

  it("marks partially filled CEP responses as partial", async () => {
    server.use(
      http.get("https://viacep.com.br/ws/:digits/json/", () =>
        HttpResponse.json({
          bairro: "",
          localidade: "Sao Paulo",
          logradouro: "",
          uf: "SP",
        }),
      ),
    );

    await expect(lookupCepDetailed("01310930")).resolves.toEqual({
      status: "ok",
      partial: true,
      missingFields: ["street", "neighborhood"],
      data: {
        street: "",
        neighborhood: "",
        city: "Sao Paulo",
        state: "SP",
      },
    });
  });

  it("returns a technical error when both providers fail", async () => {
    server.use(
      http.get("https://viacep.com.br/ws/:digits/json/", () =>
        HttpResponse.json({}, { status: 503 }),
      ),
      http.get("https://brasilapi.com.br/api/cep/v2/:digits", () =>
        HttpResponse.json({}, { status: 503 }),
      ),
    );

    await expect(lookupCepDetailed("01310930")).resolves.toEqual({
      status: "error",
      message: "Não foi possível consultar o CEP agora.",
    });
  });
});
