"use client";

import { useEffect, useState } from "react";

import { PasswordSettingsCard } from "@/components/layout/profile-page/password-settings-card";
import { PhoneInput } from "@/components/ui/phone-input";
import { AnchoredSection, AnchoredSectionNav } from "@/components/ui/anchored-sections";
import { DEFAULT_CONTACT_PHONE } from "@/features/site-contact/contact-phone";

import { IntegrationSecretsContent } from "./integration-secrets-content";

const SECTIONS = [
  { id: "atendimento", label: "Atendimento" },
  { id: "integracoes", label: "Integrações" },
  { id: "conta", label: "Conta" },
] as const;

function ContactPhoneSection() {
  const [phone, setPhone] = useState(DEFAULT_CONTACT_PHONE);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/contact-config")
      .then((response) => response.json())
      .then((data: { phone?: string }) => {
        if (data.phone) setPhone(data.phone);
      });
  }, []);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/contact-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      setFeedback(response.ok ? "Telefone salvo." : "Não foi possível salvar o telefone.");
    } catch {
      setFeedback("Não foi possível salvar o telefone.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnchoredSection
      description="Este número aparece no link “Fale Conosco” do rodapé do site, para qualquer visitante."
      id="atendimento"
      title="Atendimento"
    >
      <div className="max-w-2xl">
        <div className="flex flex-col gap-3 sm:flex-row">
          <PhoneInput
            countryTriggerClassName="!h-11 !rounded-none !border-2 !border-[#1a1a1a] !bg-white px-3 text-sm text-[#1a1a1a]"
            inputClassName="h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
            listClassName="z-[90] !rounded-none border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
            onChange={(value) => {
              setPhone(value);
              setFeedback("");
            }}
            searchInputClassName="h-9 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none"
            value={phone}
            wrapperClassName="flex flex-1 items-start gap-2"
          />
          <button
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!phone || saving}
            onClick={() => void save()}
            type="button"
          >
            {saving ? "Salvando..." : "Salvar telefone"}
          </button>
        </div>
        {feedback ? (
          <p className="mt-4 border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm font-semibold text-[#1a1a1a]" role="status">
            {feedback}
          </p>
        ) : null}
      </div>
    </AnchoredSection>
  );
}

export function ConfigContent() {
  return (
    <div className="space-y-5">
      <AnchoredSectionNav
        className="-mx-4 top-[9.5rem] px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:top-0 lg:px-8"
        sections={SECTIONS}
      />

      <ContactPhoneSection />

      <AnchoredSection
        description="Credenciais dos serviços externos. Os valores nunca são exibidos de novo — para trocar uma credencial, informe sua senha atual."
        id="integracoes"
        title="Integrações"
      >
        <IntegrationSecretsContent variant="plain" />
      </AnchoredSection>

      <AnchoredSection
        description="A senha da sua conta de administrador. Ao trocá-la, esta sessão é encerrada."
        id="conta"
        title="Conta"
      >
        <PasswordSettingsCard variant="plain" />
      </AnchoredSection>
    </div>
  );
}
