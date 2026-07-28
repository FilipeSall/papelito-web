import type { CepLookupResult } from "../types/checkout";

export type CepLookupDetailedResult =
  | {
      status: "ok";
      data: CepLookupResult;
      partial: boolean;
      missingFields: Array<keyof CepLookupResult>;
    }
  | {
      status: "invalid";
      message: string;
    }
  | {
      status: "not_found";
      message: string;
    }
  | {
      status: "error";
      message: string;
    };

export async function lookupCep(digits: string): Promise<CepLookupResult> {
  const result = await lookupCepDetailed(digits);

  if (result.status === "ok") {
    return result.data;
  }

  throw new Error("CEP não encontrado.");
}

export async function lookupCepDetailed(digits: string): Promise<CepLookupDetailedResult> {
  const normalizedDigits = digits.replace(/\D/g, "");

  if (normalizedDigits.length !== 8) {
    return {
      status: "invalid",
      message: "CEP inválido. Informe 8 dígitos.",
    };
  }

  const viaCepResult = await fetchViaCep(normalizedDigits);
  if (viaCepResult.status === "ok") {
    return viaCepResult;
  }

  const brasilApiResult = await fetchBrasilApi(normalizedDigits);
  if (brasilApiResult.status === "ok") {
    return brasilApiResult;
  }

  if (
    viaCepResult.status === "not_found" &&
    brasilApiResult.status === "not_found"
  ) {
    return {
      status: "not_found",
      message: "CEP não encontrado.",
    };
  }

  return {
    status: "error",
    message:
      viaCepResult.status === "error"
        ? viaCepResult.message
        : brasilApiResult.message,
  };
}

async function fetchViaCep(digits: string): Promise<CepLookupDetailedResult> {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        return {
          status: "not_found",
          message: "CEP não encontrado.",
        };
      }

      return {
        status: "error",
        message: "Não foi possível consultar o CEP agora.",
      };
    }

    const data = (await response.json().catch(() => null)) as
      | {
          bairro?: string;
          erro?: boolean;
          localidade?: string;
          logradouro?: string;
          uf?: string;
        }
      | null;

    if (!data) {
      return {
        status: "error",
        message: "Não foi possível consultar o CEP agora.",
      };
    }

    const normalizedData = data as {
      bairro?: string;
      erro?: boolean;
      localidade?: string;
      logradouro?: string;
      uf?: string;
    };

    if (normalizedData.erro) {
      return {
        status: "not_found",
        message: "CEP não encontrado.",
      };
    }

    return buildSuccessResult({
      street: normalizedData.logradouro ?? "",
      neighborhood: normalizedData.bairro ?? "",
      city: normalizedData.localidade ?? "",
      state: normalizedData.uf ?? "",
    });
  } catch {
    return {
      status: "error",
      message: "Não foi possível consultar o CEP agora.",
    };
  }
}

async function fetchBrasilApi(digits: string): Promise<CepLookupDetailedResult> {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        return {
          status: "not_found",
          message: "CEP não encontrado.",
        };
      }

      return {
        status: "error",
        message: "Não foi possível consultar o CEP agora.",
      };
    }

    const data = (await response.json().catch(() => null)) as {
      city?: string;
      neighborhood?: string;
      state?: string;
      street?: string;
    } | null;

    if (!data) {
      return {
        status: "error",
        message: "Não foi possível consultar o CEP agora.",
      };
    }

    return buildSuccessResult({
      street: data.street ?? "",
      neighborhood: data.neighborhood ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
    });
  } catch {
    return {
      status: "error",
      message: "Não foi possível consultar o CEP agora.",
    };
  }
}

function buildSuccessResult(data: CepLookupResult): CepLookupDetailedResult {
  const missingFields = Object.entries(data)
    .filter(([, value]) => !String(value ?? "").trim())
    .map(([key]) => key as keyof CepLookupResult);

  return {
    status: "ok",
    data,
    partial: missingFields.length > 0,
    missingFields,
  };
}
