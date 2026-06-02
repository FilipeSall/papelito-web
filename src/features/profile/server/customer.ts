import "server-only";

import { getWpGraphqlEndpoint } from "@/lib/server/env";
import { fetchCurrentUserRole } from "@/lib/server/current-user-role";
import type {
  ProfileCustomer,
  ProfileCustomerAddress,
  ProfileCustomerMeta,
  ProfileMetaDataKey,
} from "@/features/profile/types/profile-customer";
import { createEmptyProfileCustomer } from "@/features/profile/utils/profile-customer-mappers";

const PROFILE_META_KEYS: ProfileMetaDataKey[] = [
  "store_name",
  "phone_number",
  "cnpj",
  "instagram",
  "state",
  "city",
  "cep",
];

const CUSTOMER_PROFILE_BASE_QUERY = `
  query CustomerProfileBase {
    customer {
      firstName
      lastName
      email
      billing {
        firstName
        lastName
        city
        state
        postcode
        email
        phone
      }
      shipping {
        city
        state
        postcode
      }
    }
  }
`;

const CUSTOMER_PROFILE_IDENTITY_QUERY = `
  query CustomerProfileIdentity {
    customer {
      displayName
      role
    }
  }
`;

const CUSTOMER_PROFILE_META_QUERY = `
  query CustomerProfileMeta($metaKeys: [String]) {
    customer {
      metaData(keysIn: $metaKeys) {
        key
        value
      }
    }
  }
`;

const UPDATE_CUSTOMER_MUTATION = `
  mutation UpdateProfileCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      customer {
        firstName
        lastName
        email
        displayName
        role
        billing {
          firstName
          lastName
          company
          address1
          address2
          city
          state
          postcode
          country
          email
          phone
        }
        shipping {
          firstName
          lastName
          company
          address1
          address2
          city
          state
          postcode
          country
          phone
        }
        metaData(keysIn: ["store_name", "phone_number", "cnpj", "instagram", "state", "city", "cep"]) {
          key
          value
        }
      }
    }
  }
`;

type CustomerAddressPayload = Partial<ProfileCustomerAddress> & {
  email?: string | null;
  phone?: string | null;
};

type CustomerPayload = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  displayName?: string | null;
  role?: string | null;
  billing?: CustomerAddressPayload | null;
  shipping?: CustomerAddressPayload | null;
  metaData?: Array<{ key?: string | null; value?: unknown }> | null;
} | null;

type GraphqlEnvelope<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

export async function fetchProfileCustomer(accessToken?: string): Promise<ProfileCustomer> {
  if (!accessToken) {
    return createEmptyProfileCustomer();
  }

  try {
    const response = await executeProfileGraphql<{ customer: CustomerPayload }>(accessToken, {
      query: CUSTOMER_PROFILE_BASE_QUERY,
    });

    const customer = normalizeCustomer(response.customer);

    const [identityResult, metaResult] = await Promise.all([
      executeProfileGraphql<{ customer: CustomerPayload }>(accessToken, {
        query: CUSTOMER_PROFILE_IDENTITY_QUERY,
      }).catch(() => null),
      executeProfileGraphql<{ customer: CustomerPayload }>(accessToken, {
        query: CUSTOMER_PROFILE_META_QUERY,
        variables: {
          metaKeys: PROFILE_META_KEYS,
        },
      }).catch(() => null),
    ]);

    if (identityResult?.customer) {
      customer.displayName = identityResult.customer.displayName ?? customer.displayName;
      customer.role =
        typeof identityResult.customer.role === "string"
          ? identityResult.customer.role.toLowerCase()
          : customer.role;
    }

    customer.role = (await fetchCurrentUserRole(accessToken).catch(() => undefined)) ?? customer.role;

    if (metaResult?.customer?.metaData) {
      customer.meta = normalizeMeta(metaResult.customer.metaData);
    }

    return customer;
  } catch {
    return createEmptyProfileCustomer();
  }
}

export async function updateProfileCustomer(
  accessToken: string,
  input: Record<string, unknown>,
): Promise<ProfileCustomer> {
  const response = await executeProfileGraphql<{
    updateCustomer?: { customer?: CustomerPayload | null } | null;
  }>(accessToken, {
    query: UPDATE_CUSTOMER_MUTATION,
    variables: {
      input,
    },
  });

  return normalizeCustomer(response.updateCustomer?.customer ?? null);
}

async function executeProfileGraphql<TData>(
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
      "Nao foi possivel processar os dados do perfil.";
    throw new Error(message);
  }

  if (!payload.data) {
    throw new Error("Resposta vazia ao consultar o perfil.");
  }

  return payload.data;
}

function normalizeCustomer(customer: CustomerPayload): ProfileCustomer {
  const empty = createEmptyProfileCustomer();

  if (!customer) {
    return empty;
  }

  return {
    firstName: customer.firstName ?? "",
    lastName: customer.lastName ?? "",
    email: customer.email ?? "",
    displayName: customer.displayName ?? "",
    role: typeof customer.role === "string" ? customer.role.toLowerCase() : "customer",
    meta: normalizeMeta(customer.metaData),
    billing: normalizeAddress(customer.billing, empty.billing),
    shipping: normalizeAddress(customer.shipping, empty.shipping),
  };
}

function normalizeAddress(
  address: CustomerAddressPayload | null | undefined,
  fallback: ProfileCustomerAddress,
): ProfileCustomerAddress {
  return {
    firstName: address?.firstName ?? fallback.firstName,
    lastName: address?.lastName ?? fallback.lastName,
    company: address?.company ?? fallback.company,
    address1: address?.address1 ?? fallback.address1,
    address2: address?.address2 ?? fallback.address2,
    city: address?.city ?? fallback.city,
    state: address?.state ?? fallback.state,
    postcode: address?.postcode ?? fallback.postcode,
    country: address?.country ?? fallback.country,
    email: address?.email ?? fallback.email,
    phone: address?.phone ?? fallback.phone,
  };
}

function normalizeMeta(
  metaData: Array<{ key?: string | null; value?: unknown }> | null | undefined,
): ProfileCustomerMeta {
  const map = new Map<string, string>();

  for (const item of metaData ?? []) {
    if (!item.key) {
      continue;
    }

    map.set(item.key, normalizeMetaValue(item.value));
  }

  return {
    storeName: map.get("store_name") ?? "",
    phoneNumber: map.get("phone_number") ?? "",
    cnpj: map.get("cnpj") ?? "",
    instagram: map.get("instagram") ?? "",
    state: map.get("state") ?? "",
    city: map.get("city") ?? "",
    cep: map.get("cep") ?? "",
  };
}

function normalizeMetaValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}
