"use client";

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
export function RevendedorHeroSection() {
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
  } = useRevendedorForm();

  return (
    <section className="bg-brand-dark">
      <div className="mx-auto max-w-[1564px] px-4 py-16 lg:px-12 lg:py-24 2xl:px-[238px]">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,520px)_minmax(0,520px)] lg:justify-between">
          <RevendedorHeroIllustration />

          <div id="revendedor-form" className="mx-auto w-full max-w-[520px] scroll-mt-32 lg:max-w-none">
            <div className="rounded-2xl bg-white p-6 shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] lg:px-8 lg:py-8">
              <div>
                <h2 className="text-xl font-black uppercase tracking-[-0.4492px] text-brand-dark">
                  Faça seu cadastro
                </h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  {REVENDEDOR_HERO_CONTENT.subtitle}
                </p>
              </div>

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
                  className="w-full rounded-[14px]"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Enviando..." : REVENDEDOR_HERO_CONTENT.submitLabel}
                </RevendedorCtaButton>

                <p className="text-center text-[11px] leading-[17.875px] tracking-[0.0645px] text-text-muted">
                  <span>{REVENDEDOR_HERO_CONTENT.termsPrefix}</span>
                  <span className="underline decoration-solid">
                    {REVENDEDOR_HERO_CONTENT.termsLinkLabel}
                  </span>
                  <span>{REVENDEDOR_HERO_CONTENT.termsSuffix}</span>
                </p>

                <div
                  aria-live="polite"
                  className={`rounded-[14px] px-4 py-3 text-sm leading-5 transition ${
                    isSubmitted
                      ? "border border-green-200 bg-green-50 text-green-700"
                      : "hidden"
                  }`}
                >
                  Cadastro recebido. Nosso time comercial vai analisar seus dados e entrar em contato.
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="h-1 w-full bg-brand-yellow" />
    </section>
  );
}
