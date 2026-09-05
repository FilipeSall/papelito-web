import "server-only";

import { cache } from "react";
import { getServerSession } from "next-auth";
import { unstable_cache } from "next/cache";

import { authOptions } from "@/lib/auth";
import { getWpGraphqlEndpoint } from "@/lib/server/env";
import { getAccountCoverageCepTag } from "@/lib/server/account-cache-tags";
import { fetchCompanyContext } from "@/lib/server/company-api";
import { resolveCustomerCep } from "@/features/profile/utils/resolve-customer-cep";

export interface AccountCoverageCepContext {
  isAuthenticated: boolean;
  cep: string | null;
}

type GraphqlEnvelope<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type CoverageCepQueryResponse = {
  customer?: {
    billing?: {
      postcode?: string | null;
    } | null;
    metaData?: Array<{ key?: string | null; value?: unknown }> | null;
    shipping?: {
      postcode?: string | null;
    } | null;
  } | null;
};

const CUSTOMER_COVERAGE_CEP_QUERY = `
  query CustomerCoverageCep {
    customer {
      billing {
        postcode
      }
      metaData(keysIn: ["cep"]) {
        key
        value
      }
      shipping {
        postcode
      }
    }
  }
`;

function resolveAccountId(
  session: {
    user?: {
      id?: string;
      email?: string | null;
    };
  } | null,
) {
  return session?.user?.id ?? session?.user?.email ?? "anonymous";
}

async function fetchCustomerCoverageCep(accessToken: string) {
  const [response, companyContext] = await Promise.all([
    fetch(getWpGraphqlEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: CUSTOMER_COVERAGE_CEP_QUERY,
      }),
      cache: "no-store",
    }),
    fetchCompanyContext(accessToken),
  ]);

  const payload =
    (await response.json()) as GraphqlEnvelope<CoverageCepQueryResponse>;

  if (!response.ok || payload.errors?.length) {
    const message =
      payload.errors
        ?.map((error) => error.message)
        .filter(Boolean)
        .join(" ") || "Não foi possível consultar o CEP da conta.";
    throw new Error(message);
  }

  const metaData = payload.data?.customer?.metaData ?? [];
  const cepValue = metaData.find((item) => item?.key === "cep")?.value;

  return resolveCustomerCep(
    {
      billing: {
        postcode: payload.data?.customer?.billing?.postcode,
      },
      meta: {
        cep: typeof cepValue === "string" ? cepValue : null,
      },
      shipping: {
        postcode: payload.data?.customer?.shipping?.postcode,
      },
    },
    companyContext.ok ? companyContext.data.company : null,
  );
}

function getCachedCustomerCoverageCep(accountId: string, accessToken: string) {
  return unstable_cache(
    async () => fetchCustomerCoverageCep(accessToken),
    ["account-coverage-cep", accountId],
    {
      revalidate: 300,
      tags: [getAccountCoverageCepTag(accountId)],
    },
  )();
}

export const getAccountCoverageCepContext = cache(
  async (): Promise<AccountCoverageCepContext> => {
    const session = await getServerSession(authOptions);

    if (!session?.user || !session.accessToken) {
      return {
        isAuthenticated: false,
        cep: null,
      };
    }

    const accountId = resolveAccountId(session);

    try {
      const cep = await getCachedCustomerCoverageCep(
        accountId,
        session.accessToken,
      );

      return {
        isAuthenticated: true,
        cep,
      };
    } catch {
      return {
        isAuthenticated: true,
        cep: null,
      };
    }
  },
);
