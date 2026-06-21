import { normalizeUserCep } from "@/features/catalog/constants/user-cep";

type CustomerCepSource = {
  billing?: {
    postcode?: string | null;
  } | null;
  meta?: {
    cep?: string | null;
  } | null;
  shipping?: {
    postcode?: string | null;
  } | null;
};

export function resolveCustomerCep(customer?: CustomerCepSource | null) {
  const metaCep = normalizeUserCep(customer?.meta?.cep);

  if (metaCep) {
    return metaCep;
  }

  const shippingCep = normalizeUserCep(customer?.shipping?.postcode);

  if (shippingCep) {
    return shippingCep;
  }

  return normalizeUserCep(customer?.billing?.postcode);
}
