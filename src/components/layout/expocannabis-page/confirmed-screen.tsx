"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { expocannabisClient } from "@/features/expocannabis/client/expocannabis-client";
import type { AttendanceState } from "@/features/expocannabis/hooks/attendance-reducer";
import type { BuyerLookup } from "@/features/expocannabis/types/order";
import type { EventQuote } from "@/features/expocannabis/types/quote";
import { formatCents } from "@/features/expocannabis/utils/cart";
import { formatPhone } from "@/features/expocannabis/utils/details-validation";

import { CheckoutStepper } from "./checkout-stepper";

type ConfirmedScreenProps = {
  state: AttendanceState;
  onNewOrder: () => void;
};

const GIFT_MIN_UNITS = 10;

const PRESS = "transition-transform duration-120 active:scale-97 motion-reduce:transition-none";

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

function deliveryAddress(state: AttendanceState, buyer: BuyerLookup | null): string {
  const delivery = state.delivery;
  const source = delivery.mode === "other" ? delivery : buyer?.address;
  if (!source) return "No endereço escolhido.";
  const address = [source.street, source.number, source.neighborhood, source.city, source.state].filter(Boolean).join(", ");
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
  steps.push({ when: "Até 7 dias úteis", title: "Entrega na loja", description: deliveryAddress(state, state.buyer) });
  return steps;
}

function SavingsBox({ quote }: Readonly<{ quote: EventQuote }>) {
  const savings = quote.discountCents + quote.kitSavingsCents;
  if (savings <= 0) return null;

  return (
    <div className="expo-eco flex-none rounded-[10px] bg-[#231F20] px-4 py-3.5 text-right text-white">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-yellow">Você economizou</p>
      <p className="mt-1 text-[26px] font-extrabold">{formatCents(savings)}</p>
      <p className="mt-0.5 text-[13px] font-semibold">{savingsLabel(quote)}</p>
    </div>
  );
}

function ConfirmedHero({ orderNumber, line, quote }: Readonly<{ orderNumber: string; line: string; quote: EventQuote }>) {
  return (
    <section role="status" aria-label="Pedido confirmado" className="expo-hero flex items-center gap-5 rounded-xl bg-brand-yellow px-[26px] py-6">
      <div aria-hidden className="flex size-[72px] flex-none items-center justify-center rounded-[10px] bg-[#231F20]">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFEA00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path className="expo-draw" d="m5 12 5 5 9-10" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.08em]">{`Pedido #${orderNumber}`}</p>
        <h1 className="mt-1.5 font-[family-name:var(--font-expo-display)] text-[34px] uppercase leading-none">Pedido confirmado!</h1>
        <p className="mt-2 text-base font-bold">{line}</p>
      </div>
      <SavingsBox quote={quote} />
    </section>
  );
}

function GiftCard() {
  return (
    <section aria-label="Brinde" className="expo-gift flex items-center gap-[18px] rounded-xl border-2 border-[#231F20] px-5 py-[18px]">
      <div className="flex h-[120px] w-[190px] flex-none items-center justify-center rounded-lg bg-[#F4F4F5]">
        <Image
          src="/images/expocannabis/brinde-bandeja.webp"
          alt="Bandejas Papelito (foto ilustrativa)"
          width={170}
          height={100}
          className="expo-wobble h-[100px] w-[170px] object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.08em]">Retire agora no balcão</p>
        <p className="mt-1 text-[21px] font-extrabold">Bandeja chaveiro + merchandising</p>
        <p className="mt-1 text-[15px] font-medium text-[#52525B]">Mostre esta tela pro vendedor. Foto ilustrativa.</p>
      </div>
    </section>
  );
}

const STEP_ANIMATION = ["expo-step-0", "expo-step-1", "expo-step-2", "expo-step-3"];

function TimelineRow({ step, index, last }: Readonly<{ step: TimelineStep; index: number; last: boolean }>) {
  const marker = index === 0 ? "bg-brand-yellow shadow-[inset_0_0_0_3px_#231F20]" : "bg-[#231F20]";

  return (
    <li className={`${STEP_ANIMATION[index]} grid grid-cols-[132px_28px_minmax(0,1fr)] gap-x-3`}>
      <p className="pt-[3px] text-right text-sm font-extrabold">{step.when}</p>
      <div className="flex flex-col items-center">
        <i aria-hidden className={`mt-1 size-4 flex-none rounded-sm ${marker}`} />
        {last ? null : <b aria-hidden className="my-1 w-0.5 flex-1 bg-[#E4E4E7]" />}
      </div>
      <div className={last ? "" : "pb-[18px]"}>
        <p className="text-[17px] font-extrabold">{step.title}</p>
        <p className="mt-0.5 text-[15px] font-medium text-[#52525B]">{step.description}</p>
      </div>
    </li>
  );
}

function Timeline({ steps }: Readonly<{ steps: TimelineStep[] }>) {
  return (
    <section aria-labelledby="expo-next-title">
      <h2 id="expo-next-title" className="mb-4 text-[22px] font-extrabold">
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
    <section aria-label="PDV Perfeito" className="expo-step-4 flex items-center gap-4 rounded-xl bg-[#231F20] px-5 py-[18px] text-white">
      <div className="min-w-0 flex-1">
        <p className="text-lg font-extrabold">Quer esse desconto o ano todo?</p>
        <p className="mt-[3px] text-[15px] font-medium text-[#E4E4E7]">No PDV Perfeito a loja ganha brindes, prêmios e benefícios exclusivos.</p>
      </div>
      <button
        type="button"
        onClick={onJoin}
        className="min-h-12 flex-none rounded-md bg-brand-yellow px-4 text-[15px] font-extrabold text-[#231F20] focus-visible:outline-brand-yellow"
      >
        {leadSent ? "Anotado ✓" : "Quero participar"}
      </button>
    </section>
  );
}

/** Tela 05: pedido pago, economia, brinde, próximos passos, PDV Perfeito e rodapé com "Novo pedido". */
export function ConfirmedScreen({ state, onNewOrder }: Readonly<ConfirmedScreenProps>) {
  const { quote, order, contact } = state;
  const [leadSent, sendLead] = useLead(order?.orderId ?? 0, state.lead);

  if (!quote || !order) return null;

  const paidWith = order.method === "pix" ? "pago no Pix" : "pago no cartão";
  const gift = quote.units >= GIFT_MIN_UNITS;
  const line = `${quote.units} unidades · ${formatCents(quote.totalCents)} · ${paidWith}`;
  const summary = `Pedido Papelito #${order.orderNumber} · ${line}. A nota fiscal e o rastreio chegam no WhatsApp e no e-mail.`;

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <div className="relative flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-8 pb-6 pt-5">
        <CheckoutStepper current={3} />
        <ConfirmedHero orderNumber={order.orderNumber} line={line} quote={quote} />
        {gift ? <GiftCard /> : null}
        <Timeline steps={buildSteps(state, gift)} />
        <PdvCard leadSent={leadSent} onJoin={sendLead} />
      </div>
      <footer className="grid flex-none grid-cols-2 gap-3 border-t border-[#E4E4E7] px-8 pb-[22px] pt-3.5">
        <a
          href={whatsappLink(contact.phone, summary)}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex min-h-[60px] items-center justify-center rounded-lg bg-[#F4F4F5] text-[17px] font-extrabold ${PRESS}`}
        >
          Enviar resumo no WhatsApp
        </a>
        <button type="button" onClick={onNewOrder} className={`min-h-[60px] rounded-lg bg-brand-yellow text-lg font-extrabold ${PRESS}`}>
          Novo pedido
        </button>
      </footer>
    </div>
  );
}
