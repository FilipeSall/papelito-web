import { CheckCircle2 } from "lucide-react";

export function RevendedorInterestConfirmation() {
  return (
    <div className="mt-6 rounded-2xl border border-brand-yellow/70 bg-[#FFFDF8] p-5 text-brand-dark sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-yellow">
          <CheckCircle2 aria-hidden="true" className="size-6" strokeWidth={2.2} />
        </span>

        <div>
          <span className="inline-flex rounded-full bg-brand-yellow px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em]">
            Interesse registrado
          </span>
          <h3 className="mt-4 text-xl font-black uppercase tracking-[-0.03em]">
            Recebemos seus dados
          </h3>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            Obrigado pelo interesse em fazer parte da rede de vendors Papelito. Sua manifestação
            foi registrada e encaminhada à nossa equipe. Entraremos em contato pelos canais
            informados assim que possível para conversar sobre a sua loja e orientar os próximos
            passos.
          </p>
          <p className="mt-4 text-sm font-bold leading-6 text-brand-dark">
            Não é necessário realizar nenhuma outra etapa neste momento.
          </p>
        </div>
      </div>
    </div>
  );
}

