"use client";

import { useEffect, useRef, useState } from "react";

import { PasswordSettingsCard } from "@/components/layout/profile-page/password-settings-card";
import { SOCIAL_ICONS } from "@/components/ui/icons/social-icons";
import { PhoneInput } from "@/components/ui/phone-input";
import { AnchoredSection, AnchoredSectionNav } from "@/components/ui/anchored-sections";
import { DEFAULT_CONTACT_PHONE } from "@/features/site-contact/contact-phone";
import {
  DEFAULT_SOCIAL_PROFILES,
  SOCIAL_NETWORKS,
  SOCIAL_PROFILE_MAX_URL_LENGTH,
  type SocialNetworkId,
  isValidSocialProfileUrl,
} from "@/features/site-contact/social-profiles";

import { IntegrationSecretsContent } from "./integration-secrets-content";

const SECTIONS = [
  { id: "atendimento", label: "Atendimento" },
  { id: "integracoes", label: "Integrações" },
  { id: "conta", label: "Conta" },
] as const;

const ACTION_BUTTON_CLASSNAME =
  "inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60";

function SectionFeedback({ message }: Readonly<{ message: string }>) {
  if (!message) {
    return null;
  }

  return (
    <p
      className="mt-4 border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm font-semibold text-[#1a1a1a]"
      role="status"
    >
      {message}
    </p>
  );
}

type SocialProfilesState = Record<SocialNetworkId, string>;

/**
 * Campo de URL de uma rede social, com o mesmo ícone que o rodapé exibe.
 *
 * O ícone é decorativo: quem nomeia o campo é o texto ao lado, para leitores de tela e para o
 * `getByLabelText` dos testes.
 */
function SocialProfileField({
  invalid,
  network,
  onChange,
  value,
}: Readonly<{
  invalid: boolean;
  network: (typeof SOCIAL_NETWORKS)[number];
  onChange: (value: string) => void;
  value: string;
}>) {
  const fieldId = `social-${network.id}`;
  const Icon = SOCIAL_ICONS[network.id];

  return (
    <div className="flex flex-col gap-2">
      <label
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]"
        htmlFor={fieldId}
      >
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow"
        >
          <Icon className="size-3.5" />
        </span>
        {network.name}
      </label>
      <input
        aria-invalid={invalid ? true : undefined}
        className={`h-11 w-full rounded-none border-2 bg-white px-3 text-sm font-medium text-[#1a1a1a] outline-none transition-[border-color] placeholder:font-normal placeholder:text-[#1a1a1a]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow ${
          invalid ? "border-[#c0392b]" : "border-[#1a1a1a]"
        }`}
        id={fieldId}
        inputMode="url"
        maxLength={SOCIAL_PROFILE_MAX_URL_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        placeholder={network.defaultHref}
        type="url"
        value={value}
      />
    </div>
  );
}

/**
 * Links das redes sociais exibidas no rodape do site publico.
 *
 * Campo em branco oculta o icone da rede — e a unica forma de tirar uma rede do ar sem deploy.
 */
function SocialProfilesFields() {
  const [profiles, setProfiles] = useState<SocialProfilesState>(DEFAULT_SOCIAL_PROFILES);
  const [invalidNetwork, setInvalidNetwork] = useState<SocialNetworkId | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const dirtyNetworksRef = useRef(new Set<SocialNetworkId>());

  useEffect(() => {
    let active = true;
    setLoadStatus("loading");

    void fetch("/api/admin/contact-config")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Não foi possível carregar as redes sociais.");
        }

        return response.json();
      })
      .then((data: { social?: Partial<SocialProfilesState> }) => {
        if (!active) return;
        if (!data.social || typeof data.social !== "object" || Array.isArray(data.social)) {
          throw new Error("Não foi possível carregar as redes sociais.");
        }
        const social = data.social;

        setProfiles((current) => {
          return SOCIAL_NETWORKS.reduce<SocialProfilesState>((next, network) => {
            const value = social[network.id];

            if (!dirtyNetworksRef.current.has(network.id) && typeof value === "string") {
              next[network.id] = value;
            }

            return next;
          }, { ...current });
        });
        setLoadStatus("ready");
      })
      .catch(() => {
        if (active) {
          setLoadStatus("error");
          setFeedback("Não foi possível carregar as redes sociais.");
        }
      });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  async function save() {
    if (loadStatus !== "ready") return;

    const invalid = SOCIAL_NETWORKS.find((network) => !isValidSocialProfileUrl(profiles[network.id]));

    if (invalid) {
      setInvalidNetwork(invalid.id);
      setFeedback(`Informe uma URL http ou https para ${invalid.name}, ou deixe em branco para ocultar o ícone.`);
      return;
    }

    setInvalidNetwork(null);
    setSaving(true);
    try {
      const social = Object.fromEntries(
        SOCIAL_NETWORKS.map((network) => [network.id, profiles[network.id].trim()]),
      );
      const response = await fetch("/api/admin/contact-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ social }),
      });
      setFeedback(response.ok ? "Redes sociais salvas." : "Não foi possível salvar as redes sociais.");
    } catch {
      setFeedback("Não foi possível salvar as redes sociais.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 border-t-2 border-dashed border-[#1a1a1a]/20 pt-6">
      <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
        Redes sociais do rodapé
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#1a1a1a]/70">
        Cada ícone do rodapé aponta para o endereço informado aqui. Deixe um campo em branco para
        ocultar o ícone daquela rede.
      </p>
      <div className="mt-5 grid max-w-4xl gap-4 sm:grid-cols-2">
        {SOCIAL_NETWORKS.map((network) => (
          <SocialProfileField
            invalid={invalidNetwork === network.id}
            key={network.id}
            network={network}
            onChange={(value) => {
              dirtyNetworksRef.current.add(network.id);
              setProfiles((current) => ({ ...current, [network.id]: value }));
              setInvalidNetwork(null);
              setFeedback("");
            }}
            value={profiles[network.id]}
          />
        ))}
      </div>
      <button
        className={`${ACTION_BUTTON_CLASSNAME} mt-5`}
        disabled={saving || loadStatus !== "ready"}
        onClick={() => void save()}
        type="button"
      >
        {saving ? "Salvando..." : loadStatus === "loading" ? "Carregando..." : "Salvar redes sociais"}
      </button>
      {loadStatus === "error" ? (
        <button
          className={`${ACTION_BUTTON_CLASSNAME} mt-3 !bg-white !text-[#1a1a1a] !shadow-none`}
          onClick={() => {
            setFeedback("");
            setReloadToken((current) => current + 1);
          }}
          type="button"
        >
          Tentar novamente
        </button>
      ) : null}
      <SectionFeedback message={feedback} />
    </div>
  );
}

function ContactSection() {
  const [phone, setPhone] = useState(DEFAULT_CONTACT_PHONE);
  const [feedback, setFeedback] = useState("");
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const isPhoneDirtyRef = useRef(false);

  /**
   * Falha de leitura precisa travar o salvamento, não cair no número padrão.
   *
   * Sem isso o campo continua com `DEFAULT_CONTACT_PHONE` e o botão habilitado: um GET com erro
   * seguido de "Salvar telefone" publica o padrão por cima do número real que está no ar.
   */
  useEffect(() => {
    let active = true;
    setLoadStatus("loading");

    void fetch("/api/admin/contact-config")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Não foi possível carregar o telefone.");
        }

        return response.json();
      })
      .then((data: { phone?: string }) => {
        if (!active) return;
        if (typeof data.phone !== "string") {
          throw new Error("Não foi possível carregar o telefone.");
        }
        if (!isPhoneDirtyRef.current && data.phone) {
          setPhone(data.phone);
        }
        setLoadStatus("ready");
      })
      .catch(() => {
        if (active) {
          setLoadStatus("error");
          setFeedback("Não foi possível carregar o telefone.");
        }
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  async function save() {
    if (loadStatus !== "ready") return;

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
      description="O que o rodapé do site mostra a qualquer visitante: o número do link “Fale Conosco” e o destino de cada ícone de rede social."
      id="atendimento"
      title="Atendimento"
    >
      <div className="max-w-2xl">
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
          Telefone do “Fale Conosco”
        </h3>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <PhoneInput
            countryTriggerClassName="!h-11 !rounded-none !border-2 !border-[#1a1a1a] !bg-white px-3 text-sm text-[#1a1a1a]"
            inputClassName="h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
            listClassName="z-[90] !rounded-none border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
            onChange={(value) => {
              isPhoneDirtyRef.current = true;
              setPhone(value);
              setFeedback("");
            }}
            searchInputClassName="h-9 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none"
            value={phone}
            wrapperClassName="flex flex-1 items-start gap-2"
          />
          <button
            className={ACTION_BUTTON_CLASSNAME}
            disabled={!phone || saving || loadStatus !== "ready"}
            onClick={() => void save()}
            type="button"
          >
            {saving ? "Salvando..." : loadStatus === "loading" ? "Carregando..." : "Salvar telefone"}
          </button>
        </div>
        {loadStatus === "error" ? (
          <button
            className={`${ACTION_BUTTON_CLASSNAME} mt-3 !bg-white !text-[#1a1a1a] !shadow-none`}
            onClick={() => {
              setFeedback("");
              setReloadToken((current) => current + 1);
            }}
            type="button"
          >
            Tentar novamente
          </button>
        ) : null}
        <SectionFeedback message={feedback} />
      </div>

      <SocialProfilesFields />
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

      <ContactSection />

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
