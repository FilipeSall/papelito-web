"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { expocannabisClient } from "@/features/expocannabis/client/expocannabis-client";
import type { AttendanceState } from "@/features/expocannabis/hooks/attendance-reducer";
import type { EventQuote } from "@/features/expocannabis/types/quote";
import { formatCents } from "@/features/expocannabis/utils/cart";
import { formatPhone } from "@/features/expocannabis/utils/details-validation";
import { formatCep } from "@/lib/validation/brazilian-documents";

import { CheckoutStepper } from "./checkout-stepper";
import { Paper } from "./paper";

type ConfirmedScreenProps = {
  state: AttendanceState;
  onNewOrder: () => void;
};

type TimelineStep = { when: string; title: string; description: string };

function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

function useLead(orderId: number, wanted: boolean): [boolean, () => void] {
  const [sent, setSent] = useState(false);
  const started = useRef(false);

  const send = useCallback(() => {
    if (started.current || !orderId) return;
    started.current = true;
    void expocannabisClient.lead(orderId).then((result) => {
      setSent(result.ok);
      started.current = result.ok;
    });
  }, [orderId]);

  useEffect(() => {
    if (wanted) send();
  }, [wanted, send]);

  return [sent, send];
}

function savingsLabel(quote: EventQuote): string {
  const parts: string[] = [];
  if (quote.discountCents > 0) parts.push(`${String(quote.level.pctBp / 100).replace(".", ",")}% do nível`);
  if (quote.kitSavingsCents > 0) parts.push("kit");
  return parts.join(" + ");
}

function deliveryAddress(delivery: AttendanceState["delivery"]): string {
  const street = [delivery.street, delivery.number].filter(Boolean).join(", ");
  const cityState = [delivery.city, delivery.state].filter(Boolean).join("/");
  const cep = delivery.cep ? `CEP ${formatCep(delivery.cep)}` : "";
  const address = [street, delivery.complement, delivery.neighborhood, cityState, cep].filter(Boolean).join(" · ");
  return address ? `${address}.` : "No endereço escolhido.";
}

function buildSteps(state: AttendanceState, gift: boolean): TimelineStep[] {
  const steps: TimelineStep[] = [];
  if (gift) {
    steps.push({ when: "Agora", title: "Retira o brinde no balcão", description: "Bandeja chaveiro + merchandising pra loja." });
  }
  steps.push({
    when: "Hoje",
    title: "Nota fiscal e resumo do pedido",
    description: `No WhatsApp ${formatPhone(state.contact.phone)} e no e-mail ${state.contact.email}.`,
  });
  steps.push({ when: "Até 7 dias úteis", title: "Entrega na loja", description: deliveryAddress(state.delivery) });
  return steps;
}

function SavingsBox({ quote }: Readonly<{ quote: EventQuote }>) {
  const savings = quote.discountCents + quote.kitSavingsCents;
  if (savings <= 0) return null;

  return (
    <div className="expo-eco flex-none bg-expo-noite px-4 py-3.5 text-right text-white">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-yellow">Você economizou</p>
      <p className="num mt-1 text-[26px] font-extrabold">{formatCents(savings)}</p>
      <p className="mt-0.5 text-[13px] font-semibold">{savingsLabel(quote)}</p>
    </div>
  );
}

function ConfirmedHero({ orderNumber, line, quote }: Readonly<{ orderNumber: string; line: string; quote: EventQuote }>) {
  return (
    <section role="status" aria-label="Pedido confirmado" className="expo-carimbo em-claro relative text-expo-ink">
      <Paper src="/images/expocannabis/figma/papel-confirmacao.svg" />
      <Image
        src="/images/expocannabis/figma/pzinho-entrega.png"
        alt=""
        aria-hidden
        width={144}
        height={144}
        className="expo-pula absolute right-2.5 top-2 w-14.5 sm:right-[10%] sm:top-5.5 sm:w-36"
      />
      <div className="relative flex flex-wrap items-center gap-5 px-6 py-6">
      <div aria-hidden className="flex size-18 flex-none items-center justify-center bg-expo-noite">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFEA00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path className="expo-draw" d="m5 12 5 5 9-10" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.08em]">{`Pedido #${orderNumber}`}</p>
        <h1 className="ultra mt-1.5 text-[34px] leading-none">Pedido confirmado!</h1>
        <p className="num mt-2 text-base font-bold">{line}</p>
      </div>
      <SavingsBox quote={quote} />
      </div>
    </section>
  );
}

function GiftCard() {
  return (
    <section aria-label="Brinde" className="expo-gift em-claro relative flex flex-wrap items-center gap-4.5 px-5 py-4.5 text-expo-ink">
      <Paper src="/images/expocannabis/figma/papel-brinde.svg" />
      <div className="relative flex h-30 w-47.5 flex-none items-center justify-center">
        <Image
          src="/images/expocannabis/brinde-bandeja.webp"
          alt="Bandejas Papelito (foto ilustrativa)"
          width={170}
          height={100}
          className="expo-wobble h-[100px] w-[170px] object-contain"
        />
      </div>
      <div className="relative min-w-0 flex-1">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.08em]">Retire agora no balcão</p>
        <p className="ultra mt-1 text-[22px] leading-7">Bandeja chaveiro + merchandising</p>
        <p className="mt-1 text-[15px] font-medium text-expo-mute">Mostre esta tela pro vendedor. Foto ilustrativa.</p>
      </div>
    </section>
  );
}

const STEP_ANIMATION = ["expo-step-0", "expo-step-1", "expo-step-2", "expo-step-3"];

function TimelineRow({ step, index, last }: Readonly<{ step: TimelineStep; index: number; last: boolean }>) {
  const marker = index === 0 ? "bg-brand-yellow" : "bg-white/70";

  return (
    <li className={`${STEP_ANIMATION[index]} grid grid-cols-[132px_28px_minmax(0,1fr)] gap-x-3`}>
      <p className="pt-[3px] text-right text-sm font-extrabold">{step.when}</p>
      <div className="flex flex-col items-center">
        <i aria-hidden className={`mt-1 size-4 flex-none ${marker}`} />
        {last ? null : <b aria-hidden className="my-1 w-0.5 flex-1 bg-white/25" />}
      </div>
      <div className={last ? "" : "pb-[18px]"}>
        <p className="text-[17px] font-extrabold">{step.title}</p>
        <p className="mt-0.5 text-[15px] font-medium text-expo-cinza">{step.description}</p>
      </div>
    </li>
  );
}

function Timeline({ steps }: Readonly<{ steps: TimelineStep[] }>) {
  return (
    <section aria-labelledby="expo-next-title">
      <h2 id="expo-next-title" className="ultra mb-4 text-[26px] leading-8 text-brand-yellow">
        O que acontece agora
      </h2>
      <ol>
        {steps.map((step, index) => (
          <TimelineRow key={step.when} step={step} index={index} last={index === steps.length - 1} />
        ))}
      </ol>
    </section>
  );
}

function PdvCard({ leadSent, onJoin }: Readonly<{ leadSent: boolean; onJoin: () => void }>) {
  return (
    <section aria-label="PDV Perfeito" className="expo-step-4 relative text-expo-ink">
      <Paper src="/images/expocannabis/figma/papel-pdv.svg" />
      <div className="relative flex flex-wrap items-center gap-4 px-5 py-4.5">
      <div className="min-w-0 flex-1">
        <p className="text-[18px] font-extrabold">Quer esse desconto o ano todo?</p>
        <p className="mt-0.75 text-[15px] font-medium text-expo-mute">No PDV Perfeito a loja ganha brindes, prêmios e benefícios exclusivos.</p>
      </div>
      <button
        type="button"
        onClick={onJoin}
        className="min-h-12 flex-none bg-expo-noite px-4 text-[15px] font-extrabold text-brand-yellow"
      >
        {leadSent ? "Anotado ✓" : "Quero participar"}
      </button>
      </div>
    </section>
  );
}

/** Tela 05: pedido pago, economia, brinde, próximos passos, PDV Perfeito e rodapé com "Novo pedido". */
export function ConfirmedScreen({ state, onNewOrder }: Readonly<ConfirmedScreenProps>) {
  const { quote, order, contact } = state;
  const [leadSent, sendLead] = useLead(order?.orderId ?? 0, state.lead);

  if (!quote || !order) return null;

  const paidWith = order.method === "pix" ? "pago no Pix" : "pago no cartão";
  const gift = quote.level.pctBp > 0;
  const line = `${quote.units} unidades · ${formatCents(quote.totalCents)} · ${paidWith}`;
  const summary = `Pedido Papelito #${order.orderNumber} · ${line}. A nota fiscal e o rastreio chegam no WhatsApp e no e-mail.`;

  return (
    <div className="absolute inset-0 flex flex-col bg-expo-noite">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 px-6 pb-6 pt-5 sm:px-8">
        <CheckoutStepper current={3} dark />
        <ConfirmedHero orderNumber={order.orderNumber} line={line} quote={quote} />
        {gift ? <GiftCard /> : null}
        <Timeline steps={buildSteps(state, gift)} />
        <PdvCard leadSent={leadSent} onJoin={sendLead} />
        </div>
      </div>
      <footer className="grid flex-none grid-cols-2 gap-3 bg-expo-noite px-6 pb-5.5 pt-3.5 sm:px-8">
        <a
          href={whatsappLink(contact.phone, summary)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-15 items-center justify-center border border-brand-yellow bg-expo-noite text-[17px] font-extrabold text-brand-yellow"
        >
          Enviar resumo no WhatsApp
        </a>
        <button type="button" onClick={onNewOrder} className="min-h-15 bg-brand-yellow text-[18px] font-extrabold text-expo-ink">
          Novo pedido
        </button>
      </footer>
    </div>
  );
}
