import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useVendorForm } from "@/features/vendor-registration/hooks/use-vendor-form";
import {
  buildVendorCreatePayload,
  createEmptyVendorFormValues,
  createVendorFormValuesFromSourceUser,
  validateVendorFormValues,
} from "@/features/vendor-registration/vendor-form-values";

import { createAdminVendor } from "../service";
import type { CreatedVendor, VendorCreateLauncherProps, VendorCreateSourceUser } from "../types";

export function useVendorCreateForm({
  initialOpen = false,
  sourceUser = null,
}: VendorCreateLauncherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdVendor, setCreatedVendor] = useState<CreatedVendor | null>(null);
  const [prefillSource, setPrefillSource] = useState(initialOpen ? sourceUser : null);
  const autoOpenedRef = useRef(false);
  const controller = useVendorForm({
    initialValues: createVendorFormValuesFromSourceUser(sourceUser),
    onDirty: () => setError(null),
  });
  const { resetValues, values } = controller;

  useEffect(() => {
    if (!initialOpen || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    setError(null);
    setCreatedVendor(null);
    resetValues(createVendorFormValuesFromSourceUser(sourceUser));
    setPrefillSource(sourceUser ?? null);
    setIsOpen(true);
    router.replace("/admin/vendors", { scroll: false });
  }, [initialOpen, resetValues, router, sourceUser]);

  function resetForm(source: VendorCreateSourceUser | null = null) {
    setError(null);
    setCreatedVendor(null);
    resetValues(
      source ? createVendorFormValuesFromSourceUser(source) : createEmptyVendorFormValues(),
    );
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setCreatedVendor(null);

    const validation = validateVendorFormValues(values, "admin-create");
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    try {
      const vendor = await createAdminVendor(buildVendorCreatePayload(values));
      resetValues(createEmptyVendorFormValues());
      setCreatedVendor(vendor);
      setIsOpen(false);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível criar o vendor.");
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

  return {
    closeModal,
    controller,
    createdVendor,
    error,
    handleSubmit,
    isOpen,
    openNewForm,
    prefillSource,
    submitting,
  };
}
