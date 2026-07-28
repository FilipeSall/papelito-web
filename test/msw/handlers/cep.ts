import { http, HttpResponse } from "msw";

export const cepHandlers = [
  http.get("https://viacep.com.br/ws/:digits/json/", ({ params }) => {
    if (params.digits === "99999999") {
      return HttpResponse.json({ erro: true }, { status: 200 });
    }

    return HttpResponse.json({
      logradouro: "Rua das Flores",
      bairro: "Centro",
      localidade: "Sao Paulo",
      uf: "SP",
    });
  }),
  http.get("https://brasilapi.com.br/api/cep/v2/:digits", ({ params }) => {
    if (params.digits === "99999999") {
      return HttpResponse.json(
        {
          message: "CEP não encontrado.",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      street: "Rua da Fallback",
      neighborhood: "Bela Vista",
      city: "Sao Paulo",
      state: "SP",
    });
  }),
];
