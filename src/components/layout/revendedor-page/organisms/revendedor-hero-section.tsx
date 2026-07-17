"use client";

import { useState } from "react";

import type {
  RevendedorStep1Errors,
  VendorRegistrationStep1Data,
} from "@/features/revendedor";
import type { VendorInterest } from "@/features/revendedor/types/vendor-interest";
import {
  patchStep1Field,
  validateStep1,
} from "@/features/revendedor/utils/revendedor-registration";
import { RevendedorCtaButton } from "../atoms/revendedor-cta-button";
import { RevendedorHeroIllustration } from "../atoms/revendedor-hero-illustration";
import { RevendedorInterestConfirmation } from "./revendedor-interest-confirmation";
import { RevendedorStep1Fields } from "./revendedor-step1-fields";

type RevendedorHeroSectionProps = {
  interest: VendorInterest | null;
  initialValues: VendorRegistrationStep1Data;
  isAuthenticated: boolean;
  role?: string;
};

export function RevendedorHeroSection({
  interest,
  initialValues,
  isAuthenticated,
  role,
}: RevendedorHeroSectionProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<RevendedorStep1Errors>({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(Boolean(interest));

  function handleChange<Key extends keyof VendorRegistrationStep1Data>(
    key: Key,
    value: VendorRegistrationStep1Data[Key],
  ) {
    setValues((current) => patchStep1Field(current, key, String(value)));
    setErrors((current) => ({ ...current, [key]: "" }));
    setRequestError("");
  }

  async function submitInterest() {
    const nextErrors = validateStep1(values);
    setErrors(nextErrors);
    setRequestError("");

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/revendedor/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json().catch(() => null)) as
        | { code?: string; message?: string }
        | null;

      if (response.ok || response.status === 409) {
        setWasSubmitted(true);
        return;
      }

      setRequestError(payload?.message ?? "Não foi possível registrar seu interesse.");
    } catch {
      setRequestError("Não foi possível conectar ao serviço. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isCustomer = role === "customer";

  return (
    <section className="bg-brand-dark">
      <div className="mx-auto max-w-391 px-4 py-16 lg:px-12 lg:py-24 2xl:px-59.5">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,520px)_minmax(0,520px)] lg:justify-between">
          <RevendedorHeroIllustration />

          <div id="revendedor-form" className="mx-auto w-full max-w-130 scroll-mt-32 lg:max-w-none">
            <div className="rounded-2xl bg-white p-6 shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] lg:px-8 lg:py-8">
              <div>
                <h2 className="text-xl font-black uppercase tracking-[-0.4492px] text-brand-dark">
                  {wasSubmitted ? "Triagem recebida" : "Envie sua triagem"}
                </h2>
                {!wasSubmitted ? (
                  <p className="mt-0.5 text-xs text-text-muted">
                    Conte um pouco sobre sua loja para que nossa equipe possa entrar em contato.
                  </p>
                ) : null}
              </div>

              {wasSubmitted ? (
                <RevendedorInterestConfirmation />
              ) : !isAuthenticated ? (
                <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-[#FFFDF8] p-5">
                  <p className="text-sm leading-6 text-text-muted">
                    Entre na sua conta de customer para enviar o interesse da sua loja. Usaremos a
                    conta para garantir um único pedido por cliente.
                  </p>
                  <RevendedorCtaButton
                    className="mt-5 w-full rounded-3.5"
                    href="/entrar?callbackUrl=%2Frevendedor"
                  >
                    Entrar para enviar
                  </RevendedorCtaButton>
                </div>
              ) : !isCustomer ? (
                <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-[#FFFDF8] p-5">
                  <p className="text-sm leading-6 text-text-muted">
                    Esta manifestação está disponível somente para contas de customer.
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex flex-col gap-4">
                  <RevendedorStep1Fields errors={errors} onChange={handleChange} values={values} />

                  {requestError ? (
                    <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                      {requestError}
                    </p>
                  ) : null}

                  <RevendedorCtaButton
                    className="w-full rounded-3.5"
                    disabled={isSubmitting}
                    onClick={submitInterest}
                  >
                    {isSubmitting ? "Enviando..." : "Enviar interesse"}
                  </RevendedorCtaButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-1 w-full bg-brand-yellow" />
    </section>
  );
}

