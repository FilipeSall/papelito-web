import { LayoutGrid } from "lucide-react";

/**
 * Anúncio da configuração de layout do card de produto.
 *
 * Não é um controle desabilitado por falta de permissão: é uma área que ainda não existe. Por isso
 * não há botão, link nem campo — só a moldura tracejada, o mesmo desenho que a área usa para dizer
 * "aqui ainda não há conteúdo", e uma frase dizendo o que vai morar aqui.
 */
export function UpcomingCardLayout() {
  return (
    <section
      aria-labelledby="upcoming-card-layout-title"
      className="border-2 border-dashed border-[#1a1a1a]/45 bg-[#faf8f2] px-6 py-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span
          aria-hidden
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center border-2 border-dashed border-[#1a1a1a]/45 text-[#1a1a1a]/45"
        >
          <LayoutGrid className="h-5 w-5" strokeWidth={2.2} />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3
              className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/70"
              id="upcoming-card-layout-title"
            >
              Layout dos cards
            </h3>
            <span className="border-2 border-[#1a1a1a]/45 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/60">
              Em breve
            </span>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#231f20]/62">
            Escolher como o card do produto se apresenta na vitrine — o que aparece, em que ordem e
            com que destaque. Ainda não está disponível; por enquanto o card segue o layout padrão
            da loja.
          </p>
        </div>
      </div>
    </section>
  );
}
