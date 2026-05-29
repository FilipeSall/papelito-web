"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  RevendedorApplication,
  RevendedorStep1Errors,
  VendorRegistrationDraft,
} from "@/features/revendedor";
import {
  REVENDEDOR_HERO_CONTENT,
  useRevendedorRegistrationDraftStore,
} from "@/features/revendedor";
import {
  hasStep1Data,
  patchStep1Field,
  validateStep1,
} from "@/features/revendedor/utils/revendedor-registration";
import { RevendedorCtaButton } from "../atoms/revendedor-cta-button";
import { RevendedorHeroIllustration } from "../atoms/revendedor-hero-illustration";
import { RevendedorApplicationPendingSummary } from "./revendedor-application-pending-summary";
import { RevendedorStep1Fields } from "./revendedor-step1-fields";

type RevendedorHeroSectionProps = {
  application: RevendedorApplication;
  initialDraft: VendorRegistrationDraft;
  isAuthenticated: boolean;
};

export function RevendedorHeroSection({
  application,
  initialDraft,
  isAuthenticated,
}: RevendedorHeroSectionProps) {
  const router = useRouter();
  const { draft, hasHydrated, mergeDraft, replaceDraft, setCurrentStep, patchStep1 } =
    useRevendedorRegistrationDraftStore((state) => state);
  const bootstrappedRef = useRef(false);
  const [step1Errors, setStep1Errors] = useState<RevendedorStep1Errors>({});

  useEffect(() => {
    if (!hasHydrated || bootstrappedRef.current) {
      return;
    }

    if (draft.updatedAt || hasStep1Data(draft.step1)) {
      mergeDraft(initialDraft);
    } else {
      replaceDraft(initialDraft);
    }
    bootstrappedRef.current = true;
  }, [
    draft.step1,
    draft.updatedAt,
    hasHydrated,
    initialDraft,
    mergeDraft,
    replaceDraft,
  ]);

  function handleStep1Change<Key extends keyof VendorRegistrationDraft["step1"]>(
    key: Key,
    value: VendorRegistrationDraft["step1"][Key],
  ) {
    patchStep1({
      [key]: patchStep1Field(draft.step1, key, String(value))[key],
    });
    setStep1Errors((current) => ({ ...current, [key]: "" }));
  }

  function continueToWizard() {
    const nextErrors = validateStep1(draft.step1);
    setStep1Errors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setCurrentStep(2);

    if (isAuthenticated) {
      router.push("/revendedor/cadastro");
      return;
    }

    router.push("/entrar?callbackUrl=%2Frevendedor%2Fcadastro");
  }

  return (
    <section className="bg-brand-dark">
      <div className="mx-auto max-w-391 px-4 py-16 lg:px-12 lg:py-24 2xl:px-59.5">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,520px)_minmax(0,520px)] lg:justify-between">
          <RevendedorHeroIllustration />

          <div id="revendedor-form" className="mx-auto w-full max-w-130 scroll-mt-32 lg:max-w-none">
            <div className="rounded-2xl bg-white p-6 shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] lg:px-8 lg:py-8">
              <div>
                <h2 className="text-xl font-black uppercase tracking-[-0.4492px] text-brand-dark">
                  {application.status === "pending" || application.status === "approved"
                    ? "Triagem recebida"
                    : "Envie sua triagem"}
                </h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  {application.status === "pending" || application.status === "approved"
                    ? "Seu pedido de entrada no PDV Perfeito está em análise."
                    : "Preencha os dados iniciais para começar sua candidatura no programa."}
                </p>
              </div>

              {application.status === "pending" || application.status === "approved" ? (
                <RevendedorApplicationPendingSummary application={application} />
              ) : !hasHydrated ? (
                <div className="mt-6 rounded-3.5 border border-[#E5E7EB] bg-[#FFFDF8] p-5 text-brand-dark">
                  <p className="text-sm leading-6 text-text-muted">
                    Restaurando seu rascunho...
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex flex-col gap-4">
                  <RevendedorStep1Fields
                    errors={step1Errors}
                    onChange={handleStep1Change}
                    values={draft.step1}
                  />

                  <RevendedorCtaButton className="w-full rounded-3.5" onClick={continueToWizard}>
                    Continuar cadastro
                  </RevendedorCtaButton>

                  {!isAuthenticated ? (
                    <p className="text-sm leading-6 text-text-muted">
                      Você pode começar agora. Antes do envio final, vamos pedir login para concluir
                      a candidatura.
                    </p>
                  ) : null}

                  <p className="text-center text-[11px] leading-4.46875 tracking-[0.0645px] text-text-muted">
                    <span>{REVENDEDOR_HERO_CONTENT.termsPrefix}</span>
                    <span className="underline decoration-solid">
                      {REVENDEDOR_HERO_CONTENT.termsLinkLabel}
                    </span>
                    <span>{REVENDEDOR_HERO_CONTENT.termsSuffix}</span>
                  </p>
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
