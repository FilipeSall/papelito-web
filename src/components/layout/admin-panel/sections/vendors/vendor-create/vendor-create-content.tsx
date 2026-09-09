"use client";

import { Loader2, Plus, X } from "lucide-react";
import Link from "next/link";

import { VendorFormSections } from "@/components/shared/vendor-form/vendor-form-sections";
import { BaseModal } from "@/components/ui/base-modal";
import { validateVendorFormValues } from "@/features/vendor-registration/vendor-form-values";

import { useVendorCreateForm } from "./hooks/use-vendor-create-form";
import type { VendorCreateLauncherProps } from "./types";

export function VendorCreateContent(props: VendorCreateLauncherProps) {
  const {
    closeModal,
    controller,
    createdVendor,
    error,
    handleSubmit,
    isOpen,
    openNewForm,
    prefillSource,
    submitting,
  } = useVendorCreateForm(props);

  const pendingRequirement = validateVendorFormValues(controller.values, "admin-create");

  const trigger = (
    <button
      className="inline-flex h-11 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none"
      onClick={openNewForm}
      type="button"
    >
      <Plus aria-hidden className="h-4 w-4" strokeWidth={2.4} />
      Novo vendor
    </button>
  );

  return (
    <>
      {props.hideHeading ? (
        trigger
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">
              Operação
            </p>
            <h2 className="text-xl font-black uppercase tracking-tight text-[#1a1a1a]">Vendors</h2>
          </div>
          {trigger}
        </div>
      )}

      {createdVendor?.id ? (
        <div className="flex w-full flex-wrap items-center justify-between gap-3 border-2 border-[#1a1a1a] bg-brand-yellow px-4 py-3 text-sm shadow-[4px_4px_0px_#1a1a1a]">
          <span className="font-black uppercase tracking-wide text-[#1a1a1a]">
            ✓ Vendor criado: {createdVendor.storeName || createdVendor.email || `#${createdVendor.id}`}
          </span>
          <Link
            className="border-b-2 border-[#1a1a1a] px-2 font-black uppercase tracking-widest text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-brand-yellow"
            href={`/admin/vendors/${createdVendor.id}`}
          >
            Abrir cadastro →
          </Link>
        </div>
      ) : null}

      <BaseModal
        ariaLabelledBy="vendor-create-title"
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
                Painel admin · criação direta
              </p>
              <h3
                className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]"
                id="vendor-create-title"
              >
                Adicionar vendor
              </h3>
            </div>
            <button
              aria-label="Fechar"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-transparent text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
              disabled={submitting}
              onClick={closeModal}
              type="button"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-6 px-6 py-5">
            {prefillSource ? (
              <div className="border-2 border-[#1a1a1a] bg-brand-yellow/40 px-4 py-3 text-sm text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
                <p className="font-black uppercase tracking-[0.16em]">
                  Dados importados do usuário #{prefillSource.id}
                </p>
                <p className="mt-2 leading-6">
                  Nome, email, contato e endereço vieram da conta selecionada no painel de usuários.
                  Ajuste o que faltar antes de criar o vendor.
                </p>
              </div>
            ) : null}

            <div className="border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
              <p className="font-black uppercase tracking-[0.16em]">Preenchimento mínimo do admin</p>
              <p className="mt-2 leading-6">
                Os únicos blocos obrigatórios para o admin preencher agora são <strong>Conta</strong>,{" "}
                <strong>Dados comerciais</strong> e <strong>Endereço e cobertura</strong>.{" "}
                <strong>KYC da empresa</strong>, <strong>Responsável legal / socio administrador</strong> e{" "}
                <strong>Dados bancários</strong> podem ficar incompletos e depois serão exigidos do vendor.
              </p>
            </div>

            <VendorFormSections
              accountNotice={
                prefillSource ? (
                  <div className="border-2 border-dashed border-[#1a1a1a]/25 bg-white/60 px-3 py-2 text-xs leading-5 text-[#1a1a1a]/62">
                    A senha atual do customer será preservada. Nenhuma credencial nova será gerada
                    durante a promoção.
                  </div>
                ) : null
              }
              controller={controller}
              mode="admin-create"
            />

            {error ? (
              <div className="border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3" role="alert">
                <p className="text-sm font-bold text-[#c0392b]">⚠ {error}</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-4">
            {pendingRequirement && !submitting ? (
              <p className="mr-auto text-[11px] font-semibold text-[#1a1a1a]/62">
                Falta preencher: {pendingRequirement}
              </p>
            ) : null}
            <button
              className="inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              onClick={closeModal}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting || pendingRequirement !== null}
              title={pendingRequirement ?? undefined}
              type="submit"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Criando...
                </>
              ) : (
                "Criar vendor"
              )}
            </button>
          </div>
        </form>
      </BaseModal>
    </>
  );
}
