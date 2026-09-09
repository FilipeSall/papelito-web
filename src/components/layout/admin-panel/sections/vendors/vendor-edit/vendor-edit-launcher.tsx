"use client";

import { Loader2, PencilLine, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { VendorFormSections } from "@/components/shared/vendor-form/vendor-form-sections";
import { BaseModal } from "@/components/ui/base-modal";
import {
  VENDOR_PENDING_FIELD_LABELS,
  isVendorPendingFieldKey,
  type VendorPendingFieldKey,
} from "@/features/revendedor/constants/pending-registration";
import type { VendorPendingRegistrationResponse } from "@/features/revendedor/types/revendedor-application";
import { useVendorForm } from "@/features/vendor-registration/hooks/use-vendor-form";
import {
  buildVendorRegistrationPayload,
  createVendorFormValuesFromRegistration,
  validateVendorFormValues,
} from "@/features/vendor-registration/vendor-form-values";

import { fetchAdminVendorRegistration, updateAdminVendorRegistration } from "./service";

export type VendorEditLauncherProps = Readonly<{
  vendorId: number;
  vendorName: string;
}>;

function toPendingFieldKeyList(value: unknown): VendorPendingFieldKey[] {
  return Array.isArray(value)
    ? value.filter(
        (field): field is VendorPendingFieldKey =>
          typeof field === "string" && isVendorPendingFieldKey(field),
      )
    : [];
}

export function VendorEditLauncher({ vendorId, vendorName }: VendorEditLauncherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pendingFields, setPendingFields] = useState<VendorPendingFieldKey[]>([]);

  const controller = useVendorForm({
    onDirty: useCallback(() => {
      setError(null);
      setSavedAt(null);
    }, []),
  });
  const { resetValues, values } = controller;

  const blockingRequirement = validateVendorFormValues(values, "admin-edit");
  const isReady = !loading && !loadError;

  function applyRegistration(registration: VendorPendingRegistrationResponse) {
    resetValues(createVendorFormValuesFromRegistration(registration));
    setPendingFields(toPendingFieldKeyList(registration.pendingFields));
  }

  async function openModal() {
    if (loading) return;

    setError(null);
    setSavedAt(null);
    setLoadError(null);
    setLoading(true);
    setIsOpen(true);

    try {
      applyRegistration(await fetchAdminVendorRegistration(vendorId));
    } catch (fetchError) {
      setLoadError(
        fetchError instanceof Error
          ? fetchError.message
          : "Não foi possível carregar os dados do vendor.",
      );
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    if (!saving) setIsOpen(false);
  }

  function pendingFieldError(field: VendorPendingFieldKey) {
    return pendingFields.includes(field) ? VENDOR_PENDING_FIELD_LABELS[field] : undefined;
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !isReady) return;

    const validation = validateVendorFormValues(values, "admin-edit");

    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateAdminVendorRegistration(
        vendorId,
        buildVendorRegistrationPayload(values),
      );

      if (updated) {
        applyRegistration(updated);
      }

      setSavedAt(new Date().toISOString());
      setIsOpen(false);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível salvar os dados do vendor.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        className="inline-flex h-11 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        onClick={() => {
          void openModal();
        }}
        type="button"
      >
        <PencilLine aria-hidden className="h-4 w-4" strokeWidth={2.4} />
        Editar dados
      </button>

      {savedAt && !isOpen ? (
        <p
          aria-live="polite"
          className="basis-full text-[11px] font-black uppercase tracking-[0.16em] text-[#1a7a4a]"
          role="status"
        >
          ✓ Dados do vendor atualizados.
        </p>
      ) : null}

      <BaseModal
        ariaLabelledBy="vendor-edit-title"
        contentClassName="max-h-[calc(100vh-3rem)] max-w-5xl overflow-y-auto"
        onClose={closeModal}
        open={isOpen}
      >
        <form
          className="relative w-full max-w-5xl border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
          onSubmit={handleSubmit}
        >
          <div className="h-2 w-full bg-brand-yellow" />

          <div className="flex items-start justify-between gap-4 border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">
                Painel admin · vendor #{vendorId}
              </p>
              <h3
                className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]"
                id="vendor-edit-title"
              >
                Editar dados do vendor
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#1a1a1a]/70">
                {vendorName} · os campos já vêm preenchidos com o cadastro atual. Ajuste o que
                precisar; o que você não alterar continua como está.
              </p>
            </div>
            <button
              aria-label="Fechar"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-transparent text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving}
              onClick={closeModal}
              type="button"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-6 px-6 py-5">
            {loading ? (
              <div
                aria-live="polite"
                className="flex items-center gap-3 border-2 border-[#1a1a1a] bg-white px-4 py-4 text-sm font-semibold text-[#1a1a1a]"
                role="status"
              >
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={2} />
                Carregando o cadastro atual do vendor...
              </div>
            ) : null}

            {loadError ? (
              <div className="border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3" role="alert">
                <p className="text-sm font-bold text-[#c0392b]">⚠ {loadError}</p>
                <button
                  className="mt-3 inline-flex h-9 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-3 text-[11px] font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white"
                  onClick={() => {
                    void openModal();
                  }}
                  type="button"
                >
                  Tentar novamente
                </button>
              </div>
            ) : null}

            {isReady && pendingFields.length > 0 ? (
              <div className="border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
                <p className="font-black uppercase tracking-[0.16em]">
                  Pendências que bloqueiam as vendas
                </p>
                <p className="mt-2 leading-6 text-[#1a1a1a]/80">
                  Enquanto estes campos ficarem vazios, o recebedor Pagar.me não é concluído e o
                  vendor segue bloqueado para receber pedidos.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pendingFields.map((field) => (
                    <span
                      className="border-2 border-[#1a1a1a] bg-white px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1a1a1a]"
                      key={field}
                    >
                      {VENDOR_PENDING_FIELD_LABELS[field]}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {isReady ? (
              <VendorFormSections
                controller={controller}
                fieldError={pendingFieldError}
                mode="admin-edit"
              />
            ) : null}

            {error ? (
              <div className="border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3" role="alert">
                <p className="text-sm font-bold text-[#c0392b]">⚠ {error}</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-4">
            {isReady && blockingRequirement && !saving ? (
              <p className="mr-auto text-[11px] font-semibold text-[#1a1a1a]/62">
                Falta preencher: {blockingRequirement}
              </p>
            ) : null}
            <button
              className="inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              onClick={closeModal}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || !isReady || blockingRequirement !== null}
              title={blockingRequirement ?? undefined}
              type="submit"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </button>
          </div>
        </form>
      </BaseModal>
    </>
  );
}
