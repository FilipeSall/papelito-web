import type { Address } from "@/components/layout/profile-page";
import type {
  ProfileAccountFormValues,
  ProfileAddressFormValues,
  ProfileCustomer,
  ProfileCustomerAddress,
} from "@/features/profile/types/profile-customer";
import { formatZipCode } from "@/features/checkout/utils/format-checkout-fields";

export function createEmptyProfileCustomer(): ProfileCustomer {
  return {
    firstName: "",
    lastName: "",
    email: "",
    displayName: "",
    role: "customer",
    meta: {
      storeName: "",
      phoneNumber: "",
      cnpj: "",
      cpf: "",
      instagram: "",
      state: "",
      city: "",
      cep: "",
    },
    preferences: {
      favoritePromotionEmailEnabled: false,
    },
    billing: createEmptyProfileCustomerAddress(),
    shipping: createEmptyProfileCustomerAddress(),
  };
}

export function buildProfileAccountFormValues(
  customer: ProfileCustomer,
  fallback?: {
    email?: string | null;
    name?: string | null;
  },
): ProfileAccountFormValues {
  const fallbackName = fallback?.name?.trim() ?? "";
  const { firstName: fallbackFirstName, lastName: fallbackLastName } = splitFullName(fallbackName);

  return {
    firstName: customer.firstName || fallbackFirstName,
    lastName: customer.lastName || fallbackLastName,
    displayName:
      customer.displayName ||
      `${customer.firstName || fallbackFirstName} ${customer.lastName || fallbackLastName}`.trim() ||
      fallbackName,
    email: customer.email || fallback?.email || "",
    phoneNumber: customer.meta.phoneNumber || customer.billing.phone,
    storeName: customer.meta.storeName,
    cnpj: customer.meta.cnpj,
    cpf: customer.meta.cpf,
    instagram: customer.meta.instagram,
    role: customer.role || "customer",
  };
}

export function buildProfileAddressFormValues(
  customer: ProfileCustomer,
): ProfileAddressFormValues {
  const source = hasAddress(customer.shipping)
    ? customer.shipping
    : hasAddress(customer.billing)
      ? customer.billing
      : createEmptyProfileCustomerAddress();

  const { street, number } = splitStreetAndNumber(source.address1);
  const { neighborhood, complement } = splitAddressNotes(source.address2);

  return {
    zipCode: formatZipCode(source.postcode || customer.meta.cep),
    street,
    number,
    complement,
    neighborhood,
    city: source.city || customer.meta.city,
    state: source.state || customer.meta.state,
  };
}

export function buildProfileAddresses(customer: ProfileCustomer): Address[] {
  const source = hasAddress(customer.shipping)
    ? customer.shipping
    : hasAddress(customer.billing)
      ? customer.billing
      : null;

  if (!source) {
    return [];
  }

  const location = [source.address2, [source.city, source.state].filter(Boolean).join(" - ")]
    .filter(Boolean)
    .join(", ");

  return [
    {
      id: "primary-address",
      name: "Endereço principal",
      street: source.address1,
      neighborhood: location,
      zipCode: formatZipCode(source.postcode),
      isDefault: true,
    },
  ];
}

export function buildProfileName(customer: ProfileCustomer, fallback?: string | null) {
  const fullName = `${customer.firstName} ${customer.lastName}`.trim();

  return fullName || customer.displayName || fallback || "";
}

export function buildProfileEmail(customer: ProfileCustomer, fallback?: string | null) {
  return customer.email || fallback || "";
}

function createEmptyProfileCustomerAddress(): ProfileCustomerAddress {
  return {
    firstName: "",
    lastName: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    country: "BR",
    email: "",
    phone: "",
  };
}

function hasAddress(address: ProfileCustomerAddress) {
  return Boolean(address.address1 || address.postcode || address.city || address.state);
}

function splitStreetAndNumber(address1: string) {
  const value = address1.trim();

  if (!value) {
    return { street: "", number: "" };
  }

  const separatorIndex = value.lastIndexOf(",");

  if (separatorIndex === -1) {
    return { street: value, number: "" };
  }

  return {
    street: value.slice(0, separatorIndex).trim(),
    number: value.slice(separatorIndex + 1).trim(),
  };
}

function splitAddressNotes(address2: string) {
  const value = address2.trim();

  if (!value) {
    return { neighborhood: "", complement: "" };
  }

  if (value.includes(" • ")) {
    const [neighborhood, complement] = value.split(" • ");
    return {
      neighborhood: neighborhood?.trim() ?? "",
      complement: complement?.trim() ?? "",
    };
  }

  return { neighborhood: value, complement: "" };
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}
