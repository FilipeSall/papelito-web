import { Check, CircleDashed, CircleDot } from "lucide-react";

import type {
  PackagingSetupStep,
  PackagingStepId,
  PackagingStepState,
} from "@/features/vendor-packaging/utils/packaging-readiness";

import {
  PackagingDispatchGlyph,
  PackagingMeasureGlyph,
  PackagingPickGlyph,
} from "./packaging-glyphs";

const STEP_GLYPH: Record<PackagingStepId, (props: { className?: string }) => React.ReactElement> = {
  despacho: PackagingDispatchGlyph,
  medidas: PackagingMeasureGlyph,
  modelos: PackagingPickGlyph,
};

const STATE_LABEL: Record<PackagingStepState, string> = {
  current: "Agora",
  done: "Feito",
  pending: "Depois",
};

const STATE_ICON = {
  current: CircleDot,
  done: Check,
  pending: CircleDashed,
};

const SURFACE_CLASS: Record<PackagingStepState, string> = {
  current: "bg-brand-yellow text-[#1a1a1a]",
  done: "bg-[#1a1a1a] text-[#f5f1e8]",
  pending: "bg-[#faf8f2] text-[#1a1a1a]",
};

const DETAIL_CLASS: Record<PackagingStepState, string> = {
  current: "text-[#1a1a1a]",
  done: "text-[#f5f1e8]",
  pending: "text-[#4a5565]",
};

function StepCell({ step }: Readonly<{ step: PackagingSetupStep }>) {
  const Glyph = STEP_GLYPH[step.id];
  const StateIcon = STATE_ICON[step.state];

  return (
    <li
      className={`flex items-start gap-4 px-5 py-4 md:px-6 ${SURFACE_CLASS[step.state]}`}
      data-state={step.state}
    >
      <Glyph className="mt-0.5 h-8 w-8 shrink-0" />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em]">
          {step.title}
          <span className="inline-flex items-center gap-1 border-2 border-current px-1.5 py-0.5 text-[9px] tracking-[0.14em]">
            <StateIcon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
            {STATE_LABEL[step.state]}
          </span>
        </p>
        <p className={`mt-1.5 text-xs leading-5 font-semibold ${DETAIL_CLASS[step.state]}`}>
          {step.detail}
        </p>
      </div>
    </li>
  );
}

function SettledBand() {
  return (
    <section className="border-2 border-[#1a1a1a] bg-[#1a1a1a] text-[#f5f1e8] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 md:px-6">
        <PackagingDispatchGlyph className="h-7 w-7 shrink-0" />
        <p className="text-[11px] font-black tracking-[0.18em] uppercase">Embalagem em dia</p>
        <span className="inline-flex items-center gap-1 border-2 border-current px-1.5 py-0.5 text-[9px] font-black tracking-[0.14em] uppercase">
          <Check aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
          Feito
        </span>
        <p className="w-full text-xs leading-5 font-semibold text-[#f5f1e8] md:w-auto">
          Caixas escolhidas, medidas conferidas e transportadoras com o que cotar.
        </p>
      </div>
    </section>
  );
}

/**
 * Faixa dos três marcos do setup de embalagem.
 *
 * Cada marco carrega o próprio estado por glifo, rótulo e superfície — nunca só por cor —, e o
 * estado vem dos perfis reais, não de um progresso guardado: o vendor que desativa a última caixa
 * vê a faixa voltar sozinha. Com os três fechados a faixa encolhe para uma linha: a página guia na
 * primeira visita e sai da frente depois dela.
 */
export function PackagingSetupSteps({ steps }: Readonly<{ steps: PackagingSetupStep[] }>) {
  if (steps.every((step) => step.state === "done")) {
    return <SettledBand />;
  }

  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <ol className="grid divide-y-2 divide-[#1a1a1a] md:grid-cols-3 md:divide-x-2 md:divide-y-0">
        {steps.map((step) => (
          <StepCell key={step.id} step={step} />
        ))}
      </ol>
    </section>
  );
}
