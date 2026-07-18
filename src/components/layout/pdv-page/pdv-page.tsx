import { RevendedorCtaButton } from "@/components/layout/revendedor-page/atoms/revendedor-cta-button";
import { PdvPerfeitoLogo } from "@/components/layout/partner-banner/pdv-perfeito-logo";

const MATERIALS = [
  {
    title: "DISPLAYS DE BALCÃO",
    description:
      "Expositores em papel cartão robusto para destacar a Papelito no ponto de venda.",
  },
  {
    title: "CARTAZES A3",
    description:
      "Peças de parede com a estética urbana da marca para dar volume à vitrine.",
  },
  {
    title: "ADESIVOS E SELOS",
    description:
      "Kit de adesivos para embalagem, vitrine e brinde — reforço de marca no dia a dia.",
  },
  {
    title: "MATERIAL DIGITAL",
    description:
      "Artes prontas para o Instagram e status do WhatsApp da sua loja.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "SEJA UM REVENDEDOR",
    description: "Cadastre sua loja e comece a vender os produtos Papelito.",
  },
  {
    number: "02",
    title: "SOLICITE O KIT",
    description: "Peça os materiais exclusivos de merchandising direto no seu painel.",
  },
  {
    number: "03",
    title: "MONTE SEU PDV",
    description: "Aplique os materiais no balcão e na vitrine e venda mais.",
  },
];

/**
 * Landing do programa PDV Perfeito.
 *
 * Página pública que apresenta os materiais exclusivos de merchandising
 * disponíveis para revendedores Papelito e conecta ao fluxo de `/revendedor`.
 */
export function PdvPage() {
  return (
    <main className="flex flex-col bg-white">
      <section className="relative overflow-hidden bg-brand-dark px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute -right-24 top-1/2 size-96 -translate-y-1/2 rounded-full bg-brand-yellow/5" />
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-8">
          <span className="text-xs font-black uppercase tracking-[1.2px] text-brand-yellow">
            Programa de merchandising
          </span>

          <h1 className="max-w-3xl text-4xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-6xl">
            Materiais exclusivos
            <br />
            para você ser um
            <br />
            <span className="text-brand-yellow">PDV Perfeito</span>
          </h1>

          <p className="max-w-xl text-base font-medium leading-relaxed text-white/70">
            Displays, cartazes, adesivos e artes digitais com a identidade da Papelito
            para transformar sua loja em ponto de venda de referência.
          </p>

          <RevendedorCtaButton href="/revendedor">Quero participar</RevendedorCtaButton>

          <PdvPerfeitoLogo className="mt-4 w-56 opacity-90" />
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-[1.2px] text-brand-dark/40">
              O que você recebe
            </span>
            <h2 className="text-3xl font-black uppercase tracking-tight text-brand-dark sm:text-4xl">
              O kit completo de PDV
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {MATERIALS.map((material) => (
              <article
                key={material.title}
                className="flex flex-col gap-3 border-2 border-brand-dark bg-[#faf8f2] p-8 shadow-[8px_8px_0px_#231f20]"
              >
                <span className="inline-block size-3 rotate-45 bg-brand-yellow" />
                <h3 className="text-lg font-black uppercase tracking-wide text-brand-dark">
                  {material.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-brand-dark/70">
                  {material.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#faf8f2] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-[1.2px] text-brand-dark/40">
              Como funciona
            </span>
            <h2 className="text-3xl font-black uppercase tracking-tight text-brand-dark sm:text-4xl">
              Três passos para começar
            </h2>
          </div>

          <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.number} className="flex flex-col gap-4">
                <span className="text-5xl font-black text-brand-yellow [-webkit-text-stroke:2px_#231f20]">
                  {step.number}
                </span>
                <h3 className="text-lg font-black uppercase tracking-wide text-brand-dark">
                  {step.title}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-brand-dark/70">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-brand-dark px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 text-center">
          <h2 className="max-w-2xl text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
            Pronto para deixar sua loja com a cara da Papelito?
          </h2>
          <p className="max-w-xl text-base font-medium text-white/70">
            Torne-se revendedor e solicite seu kit de merchandising.
          </p>
          <RevendedorCtaButton href="/revendedor">Seja PDV Perfeito</RevendedorCtaButton>
        </div>
      </section>
    </main>
  );
}
