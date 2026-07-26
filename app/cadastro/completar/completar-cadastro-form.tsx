"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { startTransition, useState } from "react";

import { ArrowRightIcon, AuthSubmitButton } from "@/components/auth/atoms";
import { AuthSelectField, AuthTextField } from "@/components/auth/molecules";
import { signOutAndClearSession } from "@/features/auth/client/logout";
import { lookupCepDetailed } from "@/features/checkout/services/lookup-cep";
import {
  createCompany,
  requestCompanyAccess,
  saveCustomerProfile,
} from "@/features/company/client/company-client";
import { queueOnboardingSuccessToast } from "@/components/providers/onboarding-success-toast-host";
import { formatCpf } from "@/features/revendedor/utils/revendedor-registration";
import {
  formatCep,
  formatCnpj,
  isValidCep,
  isValidCnpj,
  isValidCpf,
} from "@/lib/validation/brazilian-documents";

import { BRAZILIAN_STATES, type CadastroIntent, type CadastroPrefill } from "../shared";
import { CancelOnboardingModal } from "./cancel-onboarding-modal";

const benefits = [
  "Descontos exclusivos para membros",
  "Frete grátis nas primeiras compras",
  "Acesso antecipado a novidades",
  "Programa de pontos e recompensas",
];

const ROLLOUT_DISABLED_MESSAGE =
  "O cadastro empresarial está temporariamente indisponível. Tente novamente em alguns minutos.";

function isRolloutDisabled(status: number) {
  return status === 503;
}

export function CompletarCadastroForm({
  prefill,
  callbackUrl,
}: {
  prefill: CadastroPrefill;
  callbackUrl: string;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [intent, setIntent] = useState<CadastroIntent>(prefill.intent);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [address, setAddress] = useState({
    street: prefill.street,
    neighborhood: prefill.neighborhood,
    city: prefill.city,
    state: prefill.state,
  });
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "error">("idle");
  const joining = intent === "join_company";

  async function handleCepChange(event: React.ChangeEvent<HTMLInputElement>) {
    // currentTarget é anulado após o await, então o valor é lido antes de qualquer suspensão.
    event.currentTarget.value = formatCep(event.currentTarget.value);
    const digits = event.currentTarget.value.replace(/\D/g, "");

    if (digits.length !== 8) {
      setCepStatus("idle");
      return;
    }

    setCepStatus("loading");
    const result = await lookupCepDetailed(digits);

    if (result.status !== "ok") {
      // CEP não encontrado não bloqueia: os campos ficam editáveis para preenchimento manual.
      setCepStatus("error");
      return;
    }

    setCepStatus("idle");
    setAddress((current) => ({
      street: result.data.street || current.street,
      neighborhood: result.data.neighborhood || current.neighborhood,
      city: result.data.city || current.city,
      state: result.data.state || current.state,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const cpf = formatCpf(String(formData.get("cpf") ?? "")).trim();
    const birthDate = String(formData.get("birthDate") ?? "");
    const cep = String(formData.get("cep") ?? "").trim();
    const cnpj = formatCnpj(String(formData.get("cnpj") ?? "")).trim();
    const street = String(formData.get("street") ?? "").trim();
    const number = String(formData.get("number") ?? "").trim();
    const complement = String(formData.get("complement") ?? "").trim();
    const neighborhood = String(formData.get("neighborhood") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const state = String(formData.get("state") ?? "").trim().toUpperCase();

    if (!name || !phone || !birthDate) {
      setErrorMessage("Preencha todos os campos para continuar.");
      return;
    }

    if (!isValidCpf(cpf)) {
      setErrorMessage("Informe um CPF válido.");
      return;
    }

    if (!isValidCep(cep)) {
      setErrorMessage("Informe um CEP válido.");
      return;
    }

    if (!street || !number || !neighborhood || !city || !state) {
      setErrorMessage(
        "Preencha logradouro, número, bairro, cidade e estado para salvar o endereço.",
      );
      return;
    }

    if (!isValidCnpj(cnpj)) {
      setErrorMessage("Informe um CNPJ válido.");
      return;
    }

    setIsSubmitting(true);

    startTransition(async () => {
      const profile = await saveCustomerProfile({
        cpf,
        birth_date: birthDate,
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      });
      if (!profile.ok) {
        setErrorMessage(
          isRolloutDisabled(profile.status) ? ROLLOUT_DISABLED_MESSAGE : profile.message,
        );
        setIsSubmitting(false);
        return;
      }

      const result = joining
        ? await requestCompanyAccess(cnpj)
        : await createCompany({
            cpf,
            birth_date: birthDate,
            cnpj,
            full_name: name,
            phone,
            cep,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
          });

      if (!result.ok) {
        setErrorMessage(
          isRolloutDisabled(result.status) ? ROLLOUT_DISABLED_MESSAGE : result.message,
        );
        setIsSubmitting(false);
        return;
      }

      // Sem isto o token guarda onboardingStatus "incomplete" e o gate devolveria o usuário
      // para cá logo após concluir.
      await update({ refreshB2b: true });
      if (!joining) {
        queueOnboardingSuccessToast(name);
      }
      router.replace(callbackUrl);
      router.refresh();
    });
  }

  async function handleConfirmCancel() {
    setIsLeaving(true);
    await signOutAndClearSession({ callbackUrl: "/", redirect: true });
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden items-center justify-center bg-brand-yellow lg:flex lg:h-screen lg:w-1/2 lg:sticky lg:top-0">
        <div className="flex flex-col items-center px-12 text-center">
          <Link
            href="/"
            aria-label="Ir para a página inicial"
            className="mb-8 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-dark"
          >
            <Image
              src="/images/auth/logo-with-flag.svg"
              alt="Marketplace Papelito"
              width={304}
              height={182}
              priority
            />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-dark">
            SEJA NOSSO CLIENTE
          </h1>
          <p className="mt-2 text-lg leading-7 text-brand-dark/70">
            Junte-se a mais de 100 mil Pontos de Venda
          </p>

          <ul className="mt-10 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark">
                  <CheckIcon className="h-3 w-3 text-brand-yellow" />
                </span>
                <span className="text-sm font-medium text-brand-dark">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow">
              <CheckIcon className="h-3.5 w-3.5 text-brand-dark" />
            </span>
            <div className="h-px w-6 bg-brand-yellow" />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow text-xs font-black text-brand-dark">
              2
            </span>
            <span className="ml-2 text-xs text-white/40">Conclusão do cadastro</span>
          </div>

          <h2 className="text-3xl font-black uppercase tracking-wide text-white">
            Complete seu cadastro
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Sua conta já está autenticada. Faltam os dados da empresa para você comprar no
            marketplace.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-2" role="group" aria-label="Tipo de cadastro B2B">
            <button
              type="button"
              aria-pressed={!joining}
              onClick={() => setIntent("create_company")}
              className={`px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-colors ${
                !joining
                  ? "bg-brand-yellow text-brand-dark"
                  : "border border-white/20 bg-transparent text-white/60 hover:text-white"
              }`}
            >
              Cadastrar minha empresa
            </button>
            <button
              type="button"
              aria-pressed={joining}
              onClick={() => setIntent("join_company")}
              className={`px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-colors ${
                joining
                  ? "bg-brand-yellow text-brand-dark"
                  : "border border-white/20 bg-transparent text-white/60 hover:text-white"
              }`}
            >
              Entrar em uma empresa
            </button>
          </div>
          <p className="mt-3 text-xs text-white/50">
            {joining
              ? "Solicite acesso a uma empresa já cadastrada pelo CNPJ. Um responsável precisa aprovar."
              : "Você será o titular da empresa cadastrada e poderá convidar sua equipe."}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <fieldset className="space-y-5" disabled={isSubmitting}>
              <AuthTextField
                id="email"
                name="email"
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                defaultValue={prefill.email}
                readOnly
                hint="Confirmado pela sua conta Google."
              />

              <AuthTextField
                id="name"
                name="name"
                label="Nome Completo"
                placeholder="Seu nome completo"
                autoComplete="name"
                defaultValue={prefill.name}
                required
              />

              <AuthTextField
                id="phone"
                name="phone"
                label="Telefone"
                type="tel"
                placeholder="(11) 99999-9999"
                autoComplete="tel"
                required
              />

              <AuthTextField
                id="cpf"
                name="cpf"
                label="CPF do responsável"
                inputMode="numeric"
                placeholder="123.456.789-00"
                autoComplete="off"
                maxLength={14}
                onChange={(event) => {
                  event.currentTarget.value = formatCpf(event.currentTarget.value);
                }}
                hint={
                  prefill.cpfLast4
                    ? `Já temos um CPF salvo terminando em ${prefill.cpfLast4}. Digite novamente para confirmar.`
                    : undefined
                }
                required
              />

              <AuthTextField
                id="birthDate"
                name="birthDate"
                label="Data de nascimento"
                type="date"
                placeholder="AAAA-MM-DD"
                hint={prefill.hasBirthDate ? "Já preenchida. Digite novamente para confirmar." : undefined}
                required
              />

              <AuthTextField
                id="cep"
                name="cep"
                label="CEP"
                inputMode="numeric"
                placeholder="01310-000"
                autoComplete="postal-code"
                defaultValue={prefill.cep}
                maxLength={9}
                onChange={(event) => {
                  void handleCepChange(event);
                }}
                hint={
                  cepStatus === "loading"
                    ? "Buscando endereço..."
                    : cepStatus === "error"
                      ? "Não encontramos esse CEP. Preencha o endereço manualmente."
                      : "Preenchemos o endereço automaticamente."
                }
                required
              />

              <AuthTextField
                id="street"
                name="street"
                label="Logradouro"
                placeholder="Avenida Paulista"
                autoComplete="address-line1"
                value={address.street}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setAddress((current) => ({ ...current, street: nextValue }));
                }}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <AuthTextField
                  id="number"
                  name="number"
                  label="Número"
                  placeholder="1000"
                  autoComplete="address-line2"
                  required
                />
                <AuthTextField
                  id="complement"
                  name="complement"
                  label="Complemento"
                  placeholder="Sala 2 (opcional)"
                  autoComplete="address-line3"
                />
              </div>

              <AuthTextField
                id="neighborhood"
                name="neighborhood"
                label="Bairro"
                placeholder="Bela Vista"
                value={address.neighborhood}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setAddress((current) => ({ ...current, neighborhood: nextValue }));
                }}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <AuthTextField
                  id="city"
                  name="city"
                  label="Cidade"
                  placeholder="São Paulo"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setAddress((current) => ({ ...current, city: nextValue }));
                  }}
                  required
                />
                <AuthSelectField
                  id="state"
                  name="state"
                  label="Estado"
                  value={address.state}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setAddress((current) => ({ ...current, state: nextValue }));
                  }}
                  required
                >
                  <option value="">UF</option>
                  {BRAZILIAN_STATES.map((uf) => (
                    <option key={uf.value} value={uf.value}>
                      {uf.value}
                    </option>
                  ))}
                </AuthSelectField>
              </div>

              <AuthTextField
                id="cnpj"
                name="cnpj"
                label="CNPJ da empresa"
                placeholder="00.000.000/0000-00"
                autoComplete="off"
                defaultValue={prefill.cnpj}
                onChange={(event) => {
                  event.currentTarget.value = formatCnpj(event.currentTarget.value);
                }}
                required
              />

              {errorMessage ? (
                <p
                  className="rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-300"
                  role="alert"
                >
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="flex h-14 flex-1 cursor-pointer items-center justify-center rounded-full border border-white/20 font-black uppercase tracking-wide text-white transition hover:bg-white/5"
                >
                  Cancelar
                </button>
                <div className="flex-1">
                  <AuthSubmitButton
                    icon={!isSubmitting ? <ArrowRightIcon className="h-4 w-4" /> : undefined}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Concluir"}
                  </AuthSubmitButton>
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>

      <CancelOnboardingModal
        open={cancelOpen}
        isLeaving={isLeaving}
        onKeepEditing={() => setCancelOpen(false)}
        onConfirm={() => {
          void handleConfirmCancel();
        }}
      />
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 6L5 9L10 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
