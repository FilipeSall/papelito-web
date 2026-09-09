import type {
  UpdateVendorPendingRegistrationInput,
  VendorPendingRegistrationResponse,
} from "@/features/revendedor/types/revendedor-application";

type VendorRegistrationEnvelope = {
  message?: string;
  registration?: VendorPendingRegistrationResponse;
};

export async function fetchAdminVendorRegistration(
  vendorId: number,
): Promise<VendorPendingRegistrationResponse> {
  const response = await fetch(`/api/admin/vendors/${vendorId}/registration`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  const data = (await response.json().catch(() => null)) as VendorRegistrationEnvelope | null;

  if (!response.ok || !data?.registration) {
    throw new Error(data?.message ?? "Não foi possível carregar os dados do vendor.");
  }

  return data.registration;
}

export async function updateAdminVendorRegistration(
  vendorId: number,
  payload: UpdateVendorPendingRegistrationInput,
): Promise<VendorPendingRegistrationResponse | null> {
  const response = await fetch(`/api/admin/vendors/${vendorId}/registration`, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });

  const data = (await response.json().catch(() => null)) as VendorRegistrationEnvelope | null;

  if (!response.ok) {
    throw new Error(data?.message ?? "Não foi possível salvar os dados do vendor.");
  }

  return data?.registration ?? null;
}
