import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { bankHasBranchCheckDigit, findBankOptionByCode, OTHER_BANK_OPTION_VALUE } from "@/features/revendedor/constants/bank-codes";
import type { VendorRegistrationStep3Data } from "@/features/revendedor/types/revendedor-application";
import { createEmptyStep3Data } from "@/features/revendedor/utils/revendedor-registration";

import { buildVendorCreatePayload, createInitialVendorCreateForm, createVendorCreateFormFromSourceUser, validateVendorCreateForm } from "../form";
import { createAdminVendor } from "../service";
import type { VendorCreateForm, VendorCreateLauncherProps, VendorCreateSourceUser } from "../types";
import { useVendorCreateCep } from "./use-vendor-create-cep";

export function useVendorCreateForm({ initialOpen = false, sourceUser = null }: VendorCreateLauncherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<VendorCreateForm>(() => createVendorCreateFormFromSourceUser(sourceUser));
  const [useCustomBankCode, setUseCustomBankCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdVendor, setCreatedVendor] = useState<Awaited<ReturnType<typeof createAdminVendor>>>(null);
  const [prefillSource, setPrefillSource] = useState(initialOpen ? sourceUser : null);
  const autoOpenedRef = useRef(false);
  const cep = useVendorCreateCep({ setForm });
  const bankCode = form.bankAccount.bankCode.trim();
  const selectedBankOption = findBankOptionByCode(bankCode);
  const branchHasCheckDigit = bankHasBranchCheckDigit(bankCode);
  const bankSelectValue = useCustomBankCode ? OTHER_BANK_OPTION_VALUE : selectedBankOption?.value ?? "";

  useEffect(() => {
    if (bankCode && !selectedBankOption) setUseCustomBankCode(true);
  }, [bankCode, selectedBankOption]);

  useEffect(() => {
    if (branchHasCheckDigit || !form.bankAccount.branchCheckDigit) return;
    setForm((form) => ({ ...form, bankAccount: { ...form.bankAccount, branchCheckDigit: "" } }));
  }, [branchHasCheckDigit, form.bankAccount.branchCheckDigit]);

  useEffect(() => {
    if (!initialOpen || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    resetForm(sourceUser);
    setPrefillSource(sourceUser ?? null);
    setIsOpen(true);
    router.replace("/admin/vendors", { scroll: false });
  }, [initialOpen, router, sourceUser]);

  function resetForm(source: VendorCreateSourceUser | null = null) {
    setError(null);
    setCreatedVendor(null);
    cep.resetCepLookup();
    setUseCustomBankCode(false);
    setForm(source ? createVendorCreateFormFromSourceUser(source) : createInitialVendorCreateForm());
  }

  function update<K extends keyof VendorCreateForm>(key: K, value: VendorCreateForm[K]) {
    setForm((form) => ({ ...form, [key]: value }));
  }

  function updateBank<K extends keyof VendorCreateForm["bankAccount"]>(key: K, value: VendorCreateForm["bankAccount"][K]) {
    setForm((form) => ({ ...form, bankAccount: { ...form.bankAccount, [key]: value } }));
  }

  function updatePagarmeDraft<K extends keyof VendorRegistrationStep3Data>(key: K, value: VendorRegistrationStep3Data[K]) {
    setForm((form) => ({ ...form, pagarmeDraft: { ...form.pagarmeDraft, [key]: value } }));
  }

  function updateManagingPartnerField(key: keyof VendorRegistrationStep3Data["managingPartners"][number], value: string | boolean) {
    setForm((form) => {
      const partner = form.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];
      return { ...form, pagarmeDraft: { ...form.pagarmeDraft, managingPartners: [{ ...partner, [key]: value }] } };
    });
  }

  function updateManagingPartnerAddressField(key: keyof VendorRegistrationStep3Data["managingPartners"][number]["address"], value: string) {
    setForm((form) => {
      const partner = form.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];
      return { ...form, pagarmeDraft: { ...form.pagarmeDraft, managingPartners: [{ ...partner, address: { ...partner.address, [key]: value } }] } };
    });
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreatedVendor(null);
    const validation = validateVendorCreateForm(form);
    if (validation) return setError(validation);

    setSubmitting(true);
    try {
      const vendor = await createAdminVendor(buildVendorCreatePayload(form));
      setForm(createInitialVendorCreateForm());
      setUseCustomBankCode(false);
      setCreatedVendor(vendor);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível criar o vendor.");
    } finally {
      setSubmitting(false);
    }
  }

  function openNewForm() {
    resetForm();
    setPrefillSource(null);
    setIsOpen(true);
  }

  function closeModal() {
    if (!submitting) setIsOpen(false);
  }

  return { ...cep, bankSelectValue, branchHasCheckDigit, closeModal, createdVendor, error, form, handleSubmit, isOpen, openNewForm, prefillSource, setUseCustomBankCode, submitting, update, updateBank, updateManagingPartnerAddressField, updateManagingPartnerField, updatePagarmeDraft, useCustomBankCode };
}
