import { useRef, useState, type Dispatch, type SetStateAction } from "react";

import { lookupCepDetailed } from "@/features/checkout/services/lookup-cep";
import { formatCep } from "@/features/revendedor/utils/revendedor-formatters";
import { createEmptyStep3Data } from "@/features/revendedor/utils/revendedor-registration";

import type { CepStatus, VendorCreateForm } from "../types";

type UseVendorCreateCepParams = {
  setForm: Dispatch<SetStateAction<VendorCreateForm>>;
};

export function useVendorCreateCep({ setForm }: UseVendorCreateCepParams) {
  const [cepStatus, setCepStatus] = useState<CepStatus | null>(null);
  const [isCepLookingUp, setIsCepLookingUp] = useState(false);
  const storeRequestIdRef = useRef(0);
  const partnerRequestIdRef = useRef(0);

  function resetCepLookup() {
    setCepStatus(null);
    setIsCepLookingUp(false);
  }

  async function handleStoreCepChange(rawValue: string) {
    const cep = formatCep(rawValue);
    setForm((form) => ({ ...form, cep }));
    setCepStatus(null);

    const digits = rawValue.replace(/\D/g, "");
    const requestId = ++storeRequestIdRef.current;
    if (digits.length !== 8) {
      setIsCepLookingUp(false);
      return;
    }

    setIsCepLookingUp(true);
    setCepStatus({ tone: "info", message: "Buscando endereço pelo CEP..." });
    try {
      const result = await lookupCepDetailed(digits);
      if (requestId !== storeRequestIdRef.current) return;
      if (result.status !== "ok") {
        setCepStatus({ tone: "error", message: result.message });
        return;
      }

      setForm((form) => ({
        ...form,
        cep,
        street: result.data.street || form.street,
        neighborhood: result.data.neighborhood || form.neighborhood,
        city: result.data.city || form.city,
        state: result.data.state || form.state,
      }));
      setCepStatus(result.partial ? {
        tone: "info",
        message: "CEP encontrado, mas alguns campos vieram incompletos e podem ser ajustados manualmente.",
      } : null);
    } catch {
      if (requestId === storeRequestIdRef.current) {
        setCepStatus({ tone: "error", message: "Não foi possível consultar o CEP agora." });
      }
    } finally {
      if (requestId === storeRequestIdRef.current) setIsCepLookingUp(false);
    }
  }

  async function handleManagingPartnerCepChange(rawValue: string) {
    const zipCode = formatCep(rawValue);
    setForm((form) => updatePartnerAddress(form, "zipCode", zipCode));

    const digits = rawValue.replace(/\D/g, "");
    const requestId = ++partnerRequestIdRef.current;
    if (digits.length !== 8) return;

    const result = await lookupCepDetailed(digits);
    if (requestId !== partnerRequestIdRef.current || result.status !== "ok") return;

    setForm((form) => {
      const partner = form.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];
      return {
        ...form,
        pagarmeDraft: {
          ...form.pagarmeDraft,
          managingPartners: [{
            ...partner,
            address: {
              ...partner.address,
              zipCode,
              street: result.data.street || partner.address.street,
              neighborhood: result.data.neighborhood || partner.address.neighborhood,
              city: result.data.city || partner.address.city,
              state: result.data.state || partner.address.state,
            },
          }],
        },
      };
    });
  }

  return { cepStatus, handleManagingPartnerCepChange, handleStoreCepChange, isCepLookingUp, resetCepLookup };
}

function updatePartnerAddress(
  form: VendorCreateForm,
  key: keyof VendorCreateForm["pagarmeDraft"]["managingPartners"][number]["address"],
  value: string,
): VendorCreateForm {
  const partner = form.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];
  return {
    ...form,
    pagarmeDraft: {
      ...form.pagarmeDraft,
      managingPartners: [{ ...partner, address: { ...partner.address, [key]: value } }],
    },
  };
}
