"use client";

import { useRouter } from "next/navigation";

import type { RevendedorApplication, RevendedorFormValues } from "@/features/revendedor";
import { REVENDEDOR_HERO_CONTENT, useRevendedorForm } from "@/features/revendedor";
import { RevendedorCtaButton } from "../atoms/revendedor-cta-button";
import { RevendedorFormLabel } from "../atoms/revendedor-form-label";
import { RevendedorHeroIllustration } from "../atoms/revendedor-hero-illustration";
import { RevendedorRadioPill } from "../atoms/revendedor-radio-pill";
import { RevendedorFormField } from "../molecules/revendedor-form-field";
import { RevendedorFormRow } from "../molecules/revendedor-form-row";
import { RevendedorFormSelectField } from "../molecules/revendedor-form-select-field";

/**
 * Hero principal da landing com formulario mock e copy do programa.
 */
type RevendedorHeroSectionProps = {
  application: RevendedorApplication;
  initialValues?: Partial<RevendedorFormValues>;
  isAuthenticated: boolean;
};

export function RevendedorHeroSection({
  application,
  initialValues,
  isAuthenticated,
}: RevendedorHeroSectionProps) {
  const router = useRouter();
  const {
    values,
    errors,
    isSubmitted,
    isSubmitting,
    stateOptions,
    discoveryOptions,
    soldOptions,
    setFieldValue,
    setHasSoldPapelito,
    handleSubmit,
  } = useRevendedorForm({
    initialValues,
    onValidSubmit: async (formValues) => {
      if (!isAuthenticated) {
        return { ok: false, error: "Entre na sua conta para iniciar a triagem do PDV Perfeito." };
      }

      const response = await fetch("/api/revendedor/application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeName: formValues.storeName,
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          email: formValues.email,
          phoneNumber: formValues.phone,
          cnpj: formValues.cnpj,
          instagram: formValues.instagram,
          city: formValues.city,
          state: formValues.state,
          cep: formValues.cep,
          minCep: formValues.minCep,
          maxCep: formValues.maxCep,
          discoveryChannel: formValues.discoveryChannel,
          hasSoldPapelito: formValues.hasSoldPapelito,
        }),
      });

      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        return {
          ok: false,
          error: body?.message ?? "Nao foi possivel enviar sua triagem agora.",
        };
      }

      router.refresh();
      return { ok: true };
    },
  });

  const isLockedApplication = application.status === "pending" || application.status === "approved";

  return (
    <section className="bg-brand-dark">
      <div className="mx-auto max-w-391 px-4 py-16 lg:px-12 lg:py-24 2xl:px-59.5">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,520px)_minmax(0,520px)] lg:justify-between">
          <RevendedorHeroIllustration />

          <div id="revendedor-form" className="mx-auto w-full max-w-130 scroll-mt-32 lg:max-w-none">
            <div className="rounded-2xl bg-white p-6 shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] lg:px-8 lg:py-8">
              <div>
                <h2 className="text-xl font-black uppercase tracking-[-0.4492px] text-brand-dark">
                  {isLockedApplication
                    ? "Triagem recebida"
                    : isAuthenticated
                      ? "Envie sua triagem"
                      : "Faça login para se candidatar"}
                </h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  {isLockedApplication
                    ? "Seu pedido de entrada no PDV Perfeito está em análise."
                    : isAuthenticated
                      ? "Preencha os dados para nosso time comercial avaliar sua entrada no programa."
                      : "Para solicitar o PDV Perfeito, entre ou crie primeiro sua conta de customer."}
                </p>
              </div>

              {isLockedApplication ? (
                <RevendedorApplicationPendingSummary application={application} />
              ) : !isAuthenticated ? (
                <div className="mt-6 rounded-3.5 border border-[#E5E7EB] bg-[#FFFDF8] p-5 text-brand-dark">
                  <p className="text-sm leading-6 text-text-muted">
                    O envio da triagem agora acontece a partir de uma conta de customer já autenticada. Assim que você entrar, o formulário fica disponível aqui mesmo.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <RevendedorCtaButton className="w-full sm:w-auto" href="/entrar?callbackUrl=%2Frevendedor">
                      Entrar
                    </RevendedorCtaButton>
                    <RevendedorCtaButton
                      className="w-full sm:w-auto"
                      href="/cadastro?callbackUrl=%2Frevendedor"
                      variant="outline"
                    >
                      Criar conta
                    </RevendedorCtaButton>
                  </div>
                </div>
              ) : (
                <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
                  <RevendedorFormField
                    autoComplete="organization"
                    error={errors.storeName}
                    id="storeName"
                    label="Nome da Loja *"
                    name="storeName"
                    onChange={(event) => setFieldValue("storeName", event.target.value)}
                    placeholder="Nome do seu estabelecimento"
                    value={values.storeName}
                  />

                  <RevendedorFormRow>
                    <RevendedorFormField
                      autoComplete="given-name"
                      error={errors.firstName}
                      id="firstName"
                      label="Nome do Responsável *"
                      name="firstName"
                      onChange={(event) => setFieldValue("firstName", event.target.value)}
                      placeholder="Nome"
                      value={values.firstName}
                    />
                    <RevendedorFormField
                      autoComplete="family-name"
                      error={errors.lastName}
                      id="lastName"
                      label="Sobrenome *"
                      name="lastName"
                      onChange={(event) => setFieldValue("lastName", event.target.value)}
                      placeholder="Sobrenome"
                      value={values.lastName}
                    />
                  </RevendedorFormRow>

                  <RevendedorFormField
                    error={errors.cnpj}
                    id="cnpj"
                    label="CNPJ *"
                    name="cnpj"
                    onChange={(event) => setFieldValue("cnpj", event.target.value)}
                    placeholder="00.000.000/0001-00"
                    value={values.cnpj}
                  />

                  <RevendedorFormRow>
                    <RevendedorFormField
                      autoComplete="tel"
                      error={errors.phone}
                      id="phone"
                      label="Telefone *"
                      name="phone"
                      onChange={(event) => setFieldValue("phone", event.target.value)}
                      placeholder="(11) 99999-9999"
                      type="tel"
                      value={values.phone}
                    />
                    <RevendedorFormField
                      autoComplete="email"
                      error={errors.email}
                      id="email"
                      label="E-mail *"
                      name="email"
                      onChange={(event) => setFieldValue("email", event.target.value)}
                      placeholder="seu@email.com"
                      type="email"
                      value={values.email}
                    />
                  </RevendedorFormRow>

                  <RevendedorFormField
                    error={errors.instagram}
                    id="instagram"
                    label="Instagram *"
                    name="instagram"
                    onChange={(event) => setFieldValue("instagram", event.target.value)}
                    placeholder="suaLoja"
                    prefixContent="@"
                    value={values.instagram}
                  />

                  <RevendedorFormRow>
                    <RevendedorFormField
                      autoComplete="address-level2"
                      error={errors.city}
                      id="city"
                      label="Cidade *"
                      name="city"
                      onChange={(event) => setFieldValue("city", event.target.value)}
                      placeholder="São Paulo"
                      value={values.city}
                    />
                    <RevendedorFormSelectField
                      error={errors.state}
                      label="Estado *"
                      onChange={(value) => setFieldValue("state", value)}
                      options={stateOptions}
                      value={values.state}
                    />
                  </RevendedorFormRow>

                  <RevendedorFormField
                    autoComplete="postal-code"
                    error={errors.cep}
                    id="cep"
                    inputMode="numeric"
                    label="CEP de operação *"
                    maxLength={9}
                    name="cep"
                    onChange={(event) => setFieldValue("cep", event.target.value)}
                    placeholder="00000-000"
                    value={values.cep}
                  />

                  <RevendedorFormRow>
                    <RevendedorFormField
                      error={errors.minCep}
                      id="minCep"
                      inputMode="numeric"
                      label="CEP inicial da região atendida *"
                      maxLength={9}
                      name="minCep"
                      onChange={(event) => setFieldValue("minCep", event.target.value)}
                      placeholder="00000-000"
                      value={values.minCep}
                    />
                    <RevendedorFormField
                      error={errors.maxCep}
                      id="maxCep"
                      inputMode="numeric"
                      label="CEP final da região atendida *"
                      maxLength={9}
                      name="maxCep"
                      onChange={(event) => setFieldValue("maxCep", event.target.value)}
                      placeholder="99999-999"
                      value={values.maxCep}
                    />
                  </RevendedorFormRow>

                  <RevendedorFormSelectField
                    label="Como você conheceu a Papelito?"
                    onChange={(value) => setFieldValue("discoveryChannel", value)}
                    options={discoveryOptions}
                    value={values.discoveryChannel}
                  />

                  <div className="flex flex-col gap-2">
                    <RevendedorFormLabel htmlFor="hasSoldPapelito">
                      Já vende produtos Papelito? *
                    </RevendedorFormLabel>
                    <div
                      id="hasSoldPapelito"
                      className="grid grid-cols-1 gap-3 md:grid-cols-2"
                    >
                      {soldOptions.map((option) => (
                        <RevendedorRadioPill
                          checked={values.hasSoldPapelito === option.value}
                          key={option.value}
                          label={option.label}
                          name="hasSoldPapelito"
                          onChange={() =>
                            setHasSoldPapelito(option.value as "sim" | "nao")
                          }
                          value={option.value}
                        />
                      ))}
                    </div>
                    <span className="min-h-5 text-[11px] tracking-[0.05px] text-red-500">
                      {errors.hasSoldPapelito ?? ""}
                    </span>
                  </div>

                  <RevendedorCtaButton
                    className="w-full rounded-3.5"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Enviando..." : "Enviar para triagem"}
                  </RevendedorCtaButton>

                  <p className="text-center text-[11px] leading-4.46875 tracking-[0.0645px] text-text-muted">
                    <span>{REVENDEDOR_HERO_CONTENT.termsPrefix}</span>
                    <span className="underline decoration-solid">
                      {REVENDEDOR_HERO_CONTENT.termsLinkLabel}
                    </span>
                    <span>{REVENDEDOR_HERO_CONTENT.termsSuffix}</span>
                  </p>

                  <div
                    aria-live="polite"
                    className={`rounded-3.5 px-4 py-3 text-sm leading-5 transition ${
                      errors.form
                        ? "border border-red-200 bg-red-50 text-red-700"
                        : isSubmitted
                          ? "border border-green-200 bg-green-50 text-green-700"
                          : "hidden"
                    }`}
                  >
                    {errors.form ?? "Triagem enviada com sucesso. Atualizando seu status."}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-1 w-full bg-brand-yellow" />
    </section>
  );
}

function RevendedorApplicationPendingSummary({
  application,
}: {
  application: RevendedorApplication;
}) {
  return (
    <div className="mt-6 rounded-3.5 border border-[#E5E7EB] bg-[#FFFDF8] p-5 text-brand-dark">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
            Status atual
          </p>
          <h3 className="mt-2 text-lg font-black uppercase">
            {application.status === "approved" ? "Aprovado" : "Em análise"}
          </h3>
        </div>
        <span className="rounded-full bg-brand-yellow px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-brand-dark">
          {application.status === "approved" ? "Liberado" : "Pendente"}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-text-muted">
        {application.status === "approved"
          ? "Seu cadastro no programa já foi aprovado pelo nosso time."
          : "Recebemos sua triagem. O time comercial da Papelito vai revisar seus dados e retornar por e-mail."}
      </p>

      <div className="mt-5 rounded-3xl bg-brand-yellow/25 p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-dark/70">
          Dados enviados na triagem
        </p>
        <dl className="mt-4 grid gap-3 text-sm text-brand-dark">
          <div>
            <dt className="font-black">Loja</dt>
            <dd>{application.storeName || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Responsável</dt>
            <dd>{`${application.firstName} ${application.lastName}`.trim() || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">E-mail</dt>
            <dd>{application.email || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Telefone</dt>
            <dd>{application.phoneNumber || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">CNPJ</dt>
            <dd>{application.cnpj || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Instagram</dt>
            <dd>{application.instagram ? `@${application.instagram}` : "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Cidade / Estado</dt>
            <dd>{[application.city, application.state].filter(Boolean).join(", ") || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">CEP de operação</dt>
            <dd>{application.cep || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Faixa atendida</dt>
            <dd>
              {application.minCep || application.maxCep
                ? `${application.minCep || "-"} a ${application.maxCep || "-"}`
                : "-"}
            </dd>
          </div>
          <div>
            <dt className="font-black">Origem do contato</dt>
            <dd>{application.discoveryChannel || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Já vende Papelito?</dt>
            <dd>{application.hasSoldPapelito || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Enviado em</dt>
            <dd>{application.submittedAt || "-"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
