import type { CepLookupResult } from "../types/checkout";

export async function lookupCep(digits: string): Promise<CepLookupResult> {
  const viaRes = await fetch(`https://viacep.com.br/ws/${digits}/json/`);

  if (viaRes.ok) {
    const data = await viaRes.json();

    if (!data.erro) {
      return {
        street: data.logradouro ?? "",
        neighborhood: data.bairro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      };
    }
  }

  const brRes = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);

  if (brRes.ok) {
    const data = await brRes.json();
    return {
      street: data.street ?? "",
      neighborhood: data.neighborhood ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
    };
  }

  throw new Error("CEP não encontrado.");
}
