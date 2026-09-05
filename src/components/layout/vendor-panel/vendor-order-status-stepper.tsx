"use client";

import {
  Ban,
  Check,
  Hourglass,
  PackageCheck,
  PackageSearch,
  TriangleAlert,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";

type StepState = "active" | "completed" | "upcoming";

const steps: Array<{ icon: LucideIcon; label: string; status: VendorOrderStatus }> = [
  { status: "aguardando_pagamento", label: "Pagamento", icon: Wallet },
  { status: "aguardando_envio", label: "Aguardando envio", icon: Hourglass },
  { status: "em_separacao", label: "Separação", icon: PackageSearch },
  { status: "enviado", label: "Enviado", icon: Truck },
  { status: "entregue", label: "Entregue", icon: PackageCheck },
];

function stepIndex(status: VendorOrderStatus): number {
  return steps.findIndex((step) => step.status === status);
}

/**
 * Índice do conector que acabou de ser percorrido, ou `null`.
 *
 * A animação só existe quando o pedido **avança de verdade**. Recarregar a
 * página monta o componente com o estado atual e nada anima — animar no mount
 * faria uma releitura parecer uma mudança que não houve.
 */
function useAdvancedConnector(currentIndex: number): number | null {
  // Ajuste de estado durante o render, o padrão do React para "derivar de uma
  // prop que mudou". Detectar isso num efeito faria a animação começar um
  // frame depois da tela já ter pintado o estado novo.
  const [seenIndex, setSeenIndex] = useState(currentIndex);
  const [advanced, setAdvanced] = useState<number | null>(null);

  if (seenIndex !== currentIndex) {
    setSeenIndex(currentIndex);
    setAdvanced(currentIndex > seenIndex ? currentIndex - 1 : null);
  }

  // Limpa depois que a animação termina: a exigência é a interface ficar
  // estável, e não seguir marcada como "acabou de mudar".
  useEffect(() => {
    if (advanced === null) return;

    const timer = window.setTimeout(() => setAdvanced(null), 900);

    return () => window.clearTimeout(timer);
  }, [advanced]);

  return advanced;
}

function CancelledState({ reason }: { reason?: string }) {
  return (
    <div className="flex items-start gap-3 border-2 border-[#c0392b] bg-white px-5 py-4">
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center border-2 border-[#c0392b] bg-[#c0392b] text-white">
        <Ban aria-hidden className="size-4" strokeWidth={2.6} />
      </span>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.14em] text-[#c0392b]">
          Pedido cancelado
        </p>
        <p className="mt-1 text-sm leading-6 text-[#231f20]/74">
          {reason || "Este pedido foi cancelado e não avança na esteira de envio."}
        </p>
      </div>
    </div>
  );
}

function StockReviewState() {
  return (
    <div className="flex items-start gap-3 border-2 border-[#1a1a1a] bg-brand-yellow/25 px-5 py-4">
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow">
        <TriangleAlert aria-hidden className="size-4" strokeWidth={2.6} />
      </span>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
          Análise de estoque necessária
        </p>
        <p className="mt-1 text-sm leading-6 text-[#231f20]/74">
          O pagamento foi confirmado, mas não há estoque reservado para este pedido. A equipe
          Papelito vai orientar a próxima etapa.
        </p>
      </div>
    </div>
  );
}

/**
 * Esteira do pedido.
 *
 * Timeline vertical no mobile e trilho horizontal a partir de `md`: comprimir
 * cinco rótulos numa linha de 390px deixaria todos ilegíveis, e o padrão de
 * rastreamento resolve isso invertendo a orientação, não encolhendo o texto.
 *
 * O conector concluído é uma linha preenchida por cima da trilha neutra — a
 * animação é `scaleX`/`scaleY` da camada preenchida, que o compositor resolve
 * sozinho. O estado nunca depende só de cor: concluído tem check, o atual tem
 * anel sólido e o rótulo "Atual", e o futuro tem o número.
 */
export function VendorOrderStatusStepper({
  cancelReason,
  status,
}: {
  cancelReason?: string;
  status: VendorOrderStatus;
}) {
  const currentIndex = stepIndex(status);
  const advanced = useAdvancedConnector(currentIndex);

  if (status === "cancelado") return <CancelledState reason={cancelReason} />;
  if (status === "aguardando_estoque") return <StockReviewState />;

  return (
    <ol
      aria-label={`Etapa ${currentIndex + 1} de ${steps.length}: ${steps[currentIndex]?.label ?? ""}`}
      className="flex flex-col md:flex-row"
    >
      {steps.map((step, index) => {
        const state: StepState =
          index < currentIndex ? "completed" : index === currentIndex ? "active" : "upcoming";
        const isLast = index === steps.length - 1;
        const filled = index < currentIndex;
        const justFilled = advanced === index;
        const StepIcon = step.icon;

        return (
          <li
            aria-current={state === "active" ? "step" : undefined}
            className="relative flex min-w-0 flex-1 gap-3 pb-7 last:pb-0 md:block md:pb-0"
            key={step.status}
          >
            {/*
              O conector liga o centro deste nó ao centro do próximo, e por isso
              vive numa camada própria: desenhá-lo dentro da coluna faria a
              linha atravessar o rótulo, que fica centrado logo abaixo do nó.
            */}
            {!isLast ? (
              <span
                aria-hidden
                className="absolute left-5 top-10 h-[calc(100%-2.5rem)] w-0.5 -translate-x-1/2 bg-[#1a1a1a]/14 md:left-1/2 md:top-5 md:h-0.5 md:w-full md:translate-x-0 md:-translate-y-1/2"
              >
                <span
                  className={[
                    "block h-full w-full origin-top bg-[#1a1a1a] md:origin-left",
                    filled ? "" : "hidden",
                    justFilled ? "animate-stepper-fill-vertical md:animate-stepper-fill" : "",
                  ].join(" ")}
                />
              </span>
            ) : null}

            <span
              className={[
                "relative z-10 inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 md:mx-auto md:flex",
                state === "completed"
                  ? "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow"
                  : state === "active"
                    ? "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a] shadow-[0_0_0_4px_rgba(26,26,26,0.12)]"
                    : "border-[#1a1a1a]/22 bg-white text-[#1a1a1a]/45",
                justFilled || (state === "active" && advanced !== null) ? "animate-stepper-node" : "",
              ].join(" ")}
            >
              {state === "completed" ? (
                <Check
                  aria-hidden
                  className={justFilled ? "size-4.5 animate-stepper-check" : "size-4.5"}
                  strokeWidth={3}
                />
              ) : (
                <StepIcon aria-hidden className="size-4.5" strokeWidth={2.4} />
              )}
            </span>

            <div className="min-w-0 pt-1.5 md:mt-3 md:px-2 md:pt-0 md:text-center">
              <p
                className={[
                  "text-sm leading-tight transition-colors duration-200",
                  state === "upcoming"
                    ? "font-semibold text-[#231f20]/62"
                    : "font-bold text-[#1a1a1a]",
                ].join(" ")}
              >
                {step.label}
              </p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/55">
                {state === "completed" ? "Concluído" : state === "active" ? "Atual" : "A seguir"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
