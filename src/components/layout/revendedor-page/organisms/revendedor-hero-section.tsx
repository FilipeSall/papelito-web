"use client";

import { RevendedorCtaButton } from "../atoms/revendedor-cta-button";
import { RevendedorHeroIllustration } from "../atoms/revendedor-hero-illustration";
import { RevendedorStep1Fields } from "./revendedor-step1-fields";
import { useRevendedorSignup } from "./use-revendedor-signup";

/**
 * Topo do `/revendedor` com o formulário que abre o cadastro da empresa compradora. "Avançar"
 * leva à etapa 2 do `/cadastro` (endereço e senha); a conta só nasce depois do e-mail confirmado.
 */
export function RevendedorHeroSection() {
  const { advance, errors, handleChange, isNavigating, values } = useRevendedorSignup();

  return (
    <section className="bg-brand-dark">
      <div className="mx-auto max-w-272 px-4 py-16 lg:px-0 lg:py-24">
        <div className="grid items-start gap-10 lg:grid-cols-[520px_520px] lg:gap-12">
          <RevendedorHeroIllustration />

          <div id="revendedor-form" className="mx-auto w-full max-w-130 scroll-mt-32 lg:max-w-none">
            <form
              className="rounded-2xl bg-white p-6 shadow-[0px_25px_25px_0px_rgba(0,0,0,0.25)] lg:px-8 lg:py-8"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                advance();
              }}
            >
              <div>
                <h2 className="text-xl font-black uppercase tracking-[-0.4492px] text-brand-dark">
                  Faça seu cadastro
                </h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  Compre Papelito para revender na sua loja. Na próxima etapa você informa o endereço e
                  cria a senha.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                <RevendedorStep1Fields errors={errors} onChange={handleChange} values={values} />

                <RevendedorCtaButton className="w-full rounded-3.5" disabled={isNavigating} type="submit">
                  {isNavigating ? "Carregando..." : "Avançar"}
                </RevendedorCtaButton>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="h-1 w-full bg-brand-yellow" />
    </section>
  );
}
