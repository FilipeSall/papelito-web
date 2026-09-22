"use client";

import { useId, useRef, useState } from "react";

import { BaseModal } from "@/components/ui/base-modal";
import { hardPrimaryActionClass, hardQuietActionClass } from "@/components/ui/hard-actions";
import type { AdminVendorIntegration } from "@/lib/server/admin-vendor-integrations";

import { formatCnpj } from "../../accounts/accounts-config";

/** Campos que o formulário envia; nenhum deles é a senha de uma conta Papelito. */
export type BraspressCredentialForm = {
  originCep: string;
  password: string;
  username: string;
};

const FIELD_CLASS =
  "h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm font-semibold text-[#231f20] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:border-[#a8a29e] disabled:bg-[#eeece5] disabled:text-[#57534e]";

const LABEL_CLASS = "text-[10px] font-black tracking-[0.18em] text-[#1a1a1a]/52 uppercase";

const HELP_CLASS = "text-xs leading-5 font-semibold text-[#1a1a1a]/62";

/**
 * Formulário do contrato Braspress de um vendor, aberto pelo administrador.
 *
 * Pede exatamente o que o painel do vendor pede: CNPJ remetente (derivado do
 * cadastro e não editável aqui), CEP de origem, usuário e senha da API. A senha
 * já salva nunca é pré-preenchida — ela é write-only e o backend não a devolve —
 * então o formulário nasce vazio mesmo quando já existe credencial.
 */
export function BraspressCredentialModal({
  integration,
  onClose,
  onSubmit,
  open,
  submitting,
  vendorName,
}: Readonly<{
  integration: AdminVendorIntegration;
  onClose: () => void;
  onSubmit: (form: BraspressCredentialForm) => void;
  open: boolean;
  submitting: boolean;
  vendorName: string;
}>) {
  const titleId = useId();
  const descriptionId = useId();
  const usernameId = useId();
  const passwordId = useId();
  const originCepId = useId();
  const cnpjId = useId();
  const usernameRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BraspressCredentialForm>(() => ({
    originCep: integration.config.originCep,
    password: "",
    username: "",
  }));

  const replacing = integration.credentialsConfigured;
  const canSubmit = form.username.trim() !== "" && form.password !== "" && !submitting;

  function close() {
    if (submitting) return;
    onClose();
  }

  function setField(field: keyof BraspressCredentialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <BaseModal
      ariaDescribedBy={descriptionId}
      ariaLabelledBy={titleId}
      contentClassName="max-w-lg"
      initialFocusRef={usernameRef}
      onClose={close}
      open={open}
    >
      <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div className="h-2 w-full bg-brand-yellow" />
        <form
          className="space-y-5 px-6 py-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) onSubmit(form);
          }}
        >
          <div className="space-y-2">
            <h2
              className="text-lg font-black tracking-tight text-[#231f20] uppercase"
              id={titleId}
            >
              {replacing ? "Alterar credencial Braspress" : "Adicionar integração Braspress"}
            </h2>
            <p className={HELP_CLASS} id={descriptionId}>
              Contrato de {vendorName} com a transportadora. A senha é criptografada e não volta
              para esta tela depois de salva. Nada é enviado à Braspress ao salvar.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={LABEL_CLASS} htmlFor={cnpjId}>
                CNPJ remetente
              </label>
              <input
                className={FIELD_CLASS}
                disabled
                id={cnpjId}
                readOnly
                value={
                  integration.config.senderCnpj
                    ? formatCnpj(integration.config.senderCnpj)
                    : "Cadastro da loja sem CNPJ"
                }
              />
              <p className={HELP_CLASS}>Vem do cadastro da loja. Para alterar, edite o cadastro.</p>
            </div>

            <div className="space-y-1.5">
              <label className={LABEL_CLASS} htmlFor={originCepId}>
                CEP de origem
              </label>
              <input
                className={FIELD_CLASS}
                disabled={submitting}
                id={originCepId}
                inputMode="numeric"
                onChange={(event) => setField("originCep", event.target.value)}
                value={form.originCep}
              />
              <p className={HELP_CLASS}>Em branco, usamos o CEP do cadastro da loja.</p>
            </div>

            <div className="space-y-1.5">
              <label className={LABEL_CLASS} htmlFor={usernameId}>
                {replacing ? "Novo usuário Braspress" : "Usuário Braspress"}
              </label>
              <input
                autoComplete="off"
                className={FIELD_CLASS}
                disabled={submitting}
                id={usernameId}
                onChange={(event) => setField("username", event.target.value)}
                ref={usernameRef}
                value={form.username}
              />
            </div>

            <div className="space-y-1.5">
              <label className={LABEL_CLASS} htmlFor={passwordId}>
                {replacing ? "Nova senha Braspress" : "Senha Braspress"}
              </label>
              <input
                autoComplete="new-password"
                className={FIELD_CLASS}
                disabled={submitting}
                id={passwordId}
                onChange={(event) => setField("password", event.target.value)}
                type="password"
                value={form.password}
              />
            </div>
          </div>

          <p className={HELP_CLASS}>
            Usuário e senha são do contrato da loja com a Braspress, e precisam ser informados
            juntos.
          </p>

          <div className="flex flex-wrap justify-end gap-3">
            <button className={hardQuietActionClass} onClick={close} type="button">
              Cancelar
            </button>
            <button className={hardPrimaryActionClass} disabled={!canSubmit} type="submit">
              {submitting ? "Salvando..." : "Salvar credencial"}
            </button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
}
