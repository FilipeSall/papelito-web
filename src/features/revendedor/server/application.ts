import "server-only";

import { getWpGraphqlEndpoint } from "@/lib/server/env";
import type {
  RevendedorApplication,
  SubmitRevendedorApplicationInput,
} from "@/features/revendedor/types/revendedor-application";

const SELLER_APPLICATION_QUERY = `
  query RevendedorApplication {
    customer {
      sellerApplication {
        status
        submittedAt
        storeName
        firstName
        lastName
        email
        phoneNumber
        cnpj
        instagram
        state
        city
        discoveryChannel
        hasSoldPapelito
      }
    }
  }
`;

const SUBMIT_SELLER_APPLICATION_MUTATION = `
  mutation SubmitSellerApplication($input: SubmitSellerApplicationInput!) {
    submitSellerApplication(input: $input) {
      success
      message
      application {
        status
        submittedAt
        storeName
        firstName
        lastName
        email
        phoneNumber
        cnpj
        instagram
        state
        city
        discoveryChannel
        hasSoldPapelito
      }
    }
  }
`;

type GraphqlEnvelope<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type SellerApplicationPayload = Partial<RevendedorApplication> | null;

function createEmptyApplication(): RevendedorApplication {
  return {
    status: "none",
    submittedAt: "",
    storeName: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    cnpj: "",
    instagram: "",
    state: "",
    city: "",
    discoveryChannel: "",
    hasSoldPapelito: "",
  };
}

function normalizeApplication(payload: SellerApplicationPayload): RevendedorApplication {
  const empty = createEmptyApplication();

  if (!payload) {
    return empty;
  }

  return {
    status:
      payload.status === "pending" ||
      payload.status === "approved" ||
      payload.status === "rejected"
        ? payload.status
        : "none",
    submittedAt: payload.submittedAt ?? "",
    storeName: payload.storeName ?? "",
    firstName: payload.firstName ?? "",
    lastName: payload.lastName ?? "",
    email: payload.email ?? "",
    phoneNumber: payload.phoneNumber ?? "",
    cnpj: payload.cnpj ?? "",
    instagram: payload.instagram ?? "",
    state: payload.state ?? "",
    city: payload.city ?? "",
    discoveryChannel: payload.discoveryChannel ?? "",
    hasSoldPapelito: payload.hasSoldPapelito ?? "",
  };
}

async function executeRevendedorGraphql<TData>(
  accessToken: string,
  body: {
    query: string;
    variables?: Record<string, unknown>;
  },
): Promise<TData> {
  const response = await fetch(getWpGraphqlEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json()) as GraphqlEnvelope<TData>;

  if (!response.ok || payload.errors?.length) {
    const message =
      payload.errors?.map((error) => error.message).filter(Boolean).join(" ") ||
      "Nao foi possivel processar a triagem do revendedor.";
    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error("Resposta vazia ao processar a triagem do revendedor.");
  }

  return payload.data;
}

export async function fetchRevendedorApplication(
  accessToken?: string,
): Promise<RevendedorApplication> {
  if (!accessToken) {
    return createEmptyApplication();
  }

  try {
    const response = await executeRevendedorGraphql<{
      customer?: { sellerApplication?: SellerApplicationPayload } | null;
    }>(accessToken, {
      query: SELLER_APPLICATION_QUERY,
    });

    return normalizeApplication(response.customer?.sellerApplication ?? null);
  } catch {
    return createEmptyApplication();
  }
}

export async function submitRevendedorApplication(
  accessToken: string,
  input: SubmitRevendedorApplicationInput,
): Promise<{ message: string; application: RevendedorApplication }> {
  const response = await executeRevendedorGraphql<{
    submitSellerApplication?: {
      success?: boolean | null;
      message?: string | null;
      application?: SellerApplicationPayload;
    } | null;
  }>(accessToken, {
    query: SUBMIT_SELLER_APPLICATION_MUTATION,
    variables: {
      input,
    },
  });

  return {
    message:
      response.submitSellerApplication?.message ??
      "Triagem enviada com sucesso. Nosso time vai analisar seus dados.",
    application: normalizeApplication(response.submitSellerApplication?.application ?? null),
  };
}
