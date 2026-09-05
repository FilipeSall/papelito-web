"use client";

import { useState } from "react";

import { BaseModal } from "@/components/ui/base-modal";
import { ArrowRightIcon } from "@/components/ui/icons";
import { formatCpf, isValidCpf } from "@/lib/validation/brazilian-documents";

import { ProfileFormField } from "./profile-form-field";

type ChangeCpfModalProps = {
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, cpf: string) => void;
  open: boolean;
};

export function ChangeCpfModal({
  errorMessage,
  isSubmitting = false,
  onClose,
  onSubmit,
  open,
}: Readonly<ChangeCpfModalProps>) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [cpfError, setCpfError] = useState("");

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword) {
      setPasswordError("Informe sua senha atual.");
      return;
    }

    if (!isValidCpf(cpf)) {
      setCpfError("Informe um CPF válido.");
      return;
    }

    onSubmit(currentPassword, cpf);
  }

  return (
    <BaseModal
      ariaDescribedBy="change-cpf-description"
      ariaLabelledBy="change-cpf-title"
      contentClassName="max-w-md"
      onClose={isSubmitting ? () => undefined : onClose}
      open={open}
    >
      <form
        className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
        onSubmit={handleSubmit}
      >
        <div className="h-2 w-full bg-brand-yellow" />
        <div className="space-y-5 p-6">
          <div>
            <h2
              className="text-lg font-black uppercase tracking-tight text-[#1a1a1a]"
              id="change-cpf-title"
            >
              Trocar CPF
            </h2>
            <p
              className="mt-3 text-sm leading-6 text-[#1a1a1a]/70"
              id="change-cpf-description"
            >
              Confirme sua senha atual para alterar o CPF protegido da conta.
            </p>
          </div>

          <ProfileFormField
            autoComplete="current-password"
            errorMessage={passwordError}
            label="Senha atual"
            onChange={(value) => {
              setPasswordError("");
              setCurrentPassword(value);
            }}
            type="password"
            value={currentPassword}
          />
          <ProfileFormField
            errorMessage={cpfError}
            inputMode="numeric"
            label="Novo CPF"
            maxLength={14}
            onChange={(value) => {
              setCpfError("");
              setCpf(formatCpf(value));
            }}
            placeholder="000.000.000-00"
            value={cpf}
          />

          {errorMessage ? (
            <p className="text-sm font-bold text-[#c0392b]" role="alert">
              ⚠ {errorMessage}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 border-t-2 border-[#1a1a1a] pt-5">
            <button
              className="cursor-pointer border-2 border-[#1a1a1a] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#1a1a1a] transition hover:bg-[#1a1a1a]/5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-3 text-xs font-black uppercase tracking-wide text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Validando..." : "Alterar CPF"}
              {!isSubmitting ? (
                <ArrowRightIcon className="h-4 w-4" size={18} />
              ) : null}
            </button>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
