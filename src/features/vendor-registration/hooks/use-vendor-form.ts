import { useCallback, useEffect, useRef, useState } from "react";

import { lookupCepDetailed } from "@/features/checkout/services/lookup-cep";
import {
  bankHasBranchCheckDigit,
  findBankOptionByCode,
  OTHER_BANK_OPTION_VALUE,
} from "@/features/revendedor/constants/bank-codes";
import type {
  VendorCoverageRange,
  VendorManagingPartner,
  VendorRegistrationAddress,
  VendorRegistrationStep3Data,
} from "@/features/revendedor/types/revendedor-application";
import { formatCep } from "@/features/revendedor/utils/revendedor-formatters";
import { createEmptyStep3Data } from "@/features/revendedor/utils/revendedor-registration";

import type { VendorFormBankAccount, VendorFormCepStatus, VendorFormValues } from "../types";
import { createEmptyVendorFormValues } from "../vendor-form-values";

const CEP_PARTIAL_MESSAGE =
  "CEP encontrado, mas alguns campos vieram incompletos e podem ser ajustados manualmente.";
const CEP_LOOKUP_MESSAGE = "Buscando endereço pelo CEP...";
const CEP_FAILURE_MESSAGE = "Não foi possível consultar o CEP agora.";

export type VendorFormController = {
  bankSelectValue: string;
  branchHasCheckDigit: boolean;
  cepStatus: VendorFormCepStatus | null;
  handleManagingPartnerCepChange: (rawValue: string) => Promise<void>;
  handleStoreCepChange: (rawValue: string) => Promise<void>;
  isCepLookingUp: boolean;
  partner: VendorManagingPartner;
  resetValues: (next: VendorFormValues) => void;
  setUseCustomBankCode: (value: boolean) => void;
  update: <K extends keyof VendorFormValues>(key: K, value: VendorFormValues[K]) => void;
  updateBank: <K extends keyof VendorFormBankAccount>(key: K, value: VendorFormBankAccount[K]) => void;
  updateCoverageRanges: (ranges: VendorCoverageRange[]) => void;
  updateManagingPartnerAddressField: (key: keyof VendorRegistrationAddress, value: string) => void;
  updateManagingPartnerField: (
    key: keyof Omit<VendorManagingPartner, "address">,
    value: boolean | string,
  ) => void;
  updatePagarmeDraft: <
    K extends keyof Omit<VendorRegistrationStep3Data, "bankAccount" | "managingPartners" | "transfer">,
  >(
    key: K,
    value: VendorRegistrationStep3Data[K],
  ) => void;
  useCustomBankCode: boolean;
  values: VendorFormValues;
};

export function useVendorForm({
  initialValues,
  onDirty,
}: {
  initialValues?: VendorFormValues;
  onDirty?: () => void;
} = {}): VendorFormController {
  const [values, setValues] = useState<VendorFormValues>(
    () => initialValues ?? createEmptyVendorFormValues(),
  );
  const [useCustomBankCode, setUseCustomBankCode] = useState(false);
  const [cepStatus, setCepStatus] = useState<VendorFormCepStatus | null>(null);
  const [isCepLookingUp, setIsCepLookingUp] = useState(false);
  const storeRequestIdRef = useRef(0);
  const partnerRequestIdRef = useRef(0);
  const onDirtyRef = useRef(onDirty);

  onDirtyRef.current = onDirty;

  const bankCode = values.bankAccount.bankCode.trim();
  const selectedBankOption = findBankOptionByCode(bankCode);
  const branchHasCheckDigit = bankHasBranchCheckDigit(bankCode);
  const bankSelectValue = useCustomBankCode
    ? OTHER_BANK_OPTION_VALUE
    : (selectedBankOption?.value ?? "");
  const partner =
    values.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];

  useEffect(() => {
    if (bankCode && !selectedBankOption) setUseCustomBankCode(true);
  }, [bankCode, selectedBankOption]);

  useEffect(() => {
    if (branchHasCheckDigit || !values.bankAccount.branchCheckDigit) return;

    setValues((current) => withBankAccount(current, { branchCheckDigit: "" }));
  }, [branchHasCheckDigit, values.bankAccount.branchCheckDigit]);

  const mutate = useCallback((updater: (current: VendorFormValues) => VendorFormValues) => {
    setValues(updater);
    onDirtyRef.current?.();
  }, []);

  const resetValues = useCallback((next: VendorFormValues) => {
    setCepStatus(null);
    setIsCepLookingUp(false);
    setValues(next);
    setUseCustomBankCode(
      Boolean(next.bankAccount.bankCode.trim()) && !findBankOptionByCode(next.bankAccount.bankCode.trim()),
    );
  }, []);

  const update = useCallback<VendorFormController["update"]>(
    (key, value) => mutate((current) => ({ ...current, [key]: value })),
    [mutate],
  );

  const updateCoverageRanges = useCallback<VendorFormController["updateCoverageRanges"]>(
    (ranges) => mutate((current) => ({ ...current, coverageRanges: ranges })),
    [mutate],
  );

  const updateBank = useCallback<VendorFormController["updateBank"]>(
    (key, value) => mutate((current) => withBankAccount(current, { [key]: value })),
    [mutate],
  );

  const updatePagarmeDraft = useCallback<VendorFormController["updatePagarmeDraft"]>(
    (key, value) =>
      mutate((current) => ({
        ...current,
        pagarmeDraft: { ...current.pagarmeDraft, [key]: value },
      })),
    [mutate],
  );

  const updateManagingPartnerField = useCallback<VendorFormController["updateManagingPartnerField"]>(
    (key, value) => mutate((current) => withPartner(current, { [key]: value })),
    [mutate],
  );

  const updateManagingPartnerAddressField = useCallback<
    VendorFormController["updateManagingPartnerAddressField"]
  >(
    (key, value) =>
      mutate((current) =>
        withPartner(current, {
          address: { ...currentPartner(current).address, [key]: value },
        }),
      ),
    [mutate],
  );

  const handleStoreCepChange = useCallback<VendorFormController["handleStoreCepChange"]>(
    async (rawValue) => {
      const cep = formatCep(rawValue);
      mutate((current) => ({ ...current, cep }));
      setCepStatus(null);

      const rawDigits = rawValue.replace(/\D/g, "");
      const requestId = ++storeRequestIdRef.current;

      if (rawDigits.length !== 8) {
        setIsCepLookingUp(false);
        return;
      }

      setIsCepLookingUp(true);
      setCepStatus({ message: CEP_LOOKUP_MESSAGE, tone: "info" });

      try {
        const result = await lookupCepDetailed(rawDigits);
        if (requestId !== storeRequestIdRef.current) return;

        if (result.status !== "ok") {
          setCepStatus({ message: result.message, tone: "error" });
          return;
        }

        setValues((current) => ({
          ...current,
          cep,
          city: result.data.city || current.city,
          neighborhood: result.data.neighborhood || current.neighborhood,
          state: result.data.state || current.state,
          street: result.data.street || current.street,
        }));
        setCepStatus(result.partial ? { message: CEP_PARTIAL_MESSAGE, tone: "info" } : null);
      } catch {
        if (requestId === storeRequestIdRef.current) {
          setCepStatus({ message: CEP_FAILURE_MESSAGE, tone: "error" });
        }
      } finally {
        if (requestId === storeRequestIdRef.current) setIsCepLookingUp(false);
      }
    },
    [mutate],
  );

  const handleManagingPartnerCepChange = useCallback<
    VendorFormController["handleManagingPartnerCepChange"]
  >(
    async (rawValue) => {
      const zipCode = formatCep(rawValue);
      mutate((current) => withPartner(current, { address: { ...currentPartner(current).address, zipCode } }));

      const rawDigits = rawValue.replace(/\D/g, "");
      const requestId = ++partnerRequestIdRef.current;

      if (rawDigits.length !== 8) return;

      const result = await lookupCepDetailed(rawDigits);
      if (requestId !== partnerRequestIdRef.current || result.status !== "ok") return;

      setValues((current) => {
        const address = currentPartner(current).address;

        return withPartner(current, {
          address: {
            ...address,
            city: result.data.city || address.city,
            neighborhood: result.data.neighborhood || address.neighborhood,
            state: result.data.state || address.state,
            street: result.data.street || address.street,
            zipCode,
          },
        });
      });
    },
    [mutate],
  );

  return {
    bankSelectValue,
    branchHasCheckDigit,
    cepStatus,
    handleManagingPartnerCepChange,
    handleStoreCepChange,
    isCepLookingUp,
    partner,
    resetValues,
    setUseCustomBankCode,
    update,
    updateBank,
    updateCoverageRanges,
    updateManagingPartnerAddressField,
    updateManagingPartnerField,
    updatePagarmeDraft,
    useCustomBankCode,
    values,
  };
}

function currentPartner(values: VendorFormValues): VendorManagingPartner {
  return values.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];
}

function withPartner(
  values: VendorFormValues,
  patch: Partial<VendorManagingPartner>,
): VendorFormValues {
  return {
    ...values,
    pagarmeDraft: {
      ...values.pagarmeDraft,
      managingPartners: [{ ...currentPartner(values), ...patch }],
    },
  };
}

function withBankAccount(
  values: VendorFormValues,
  patch: Partial<VendorFormBankAccount>,
): VendorFormValues {
  const bankAccount = { ...values.bankAccount, ...patch };

  return {
    ...values,
    bankAccount,
    pagarmeDraft: { ...values.pagarmeDraft, bankAccount },
  };
}
