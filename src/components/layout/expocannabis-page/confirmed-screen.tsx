"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { expocannabisClient } from "@/features/expocannabis/client/expocannabis-client";
import type { AttendanceState } from "@/features/expocannabis/hooks/attendance-reducer";
import { formatCents } from "@/features/expocannabis/utils/cart";

type ConfirmedScreenProps = {
  state: AttendanceState;
  onNewOrder: () => void;
};

const GIFT_MIN_UNITS = 10;

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

/** Tela 05: pedido pago, economia, brinde, próximos passos, PDV Perfeito e "Novo pedido". */
export function ConfirmedScreen({ state, onNewOrder }: Readonly<ConfirmedScreenProps>) {
  const { quote, order, contact } = state;
  const [leadSent, sendLead] = useLead(order?.orderId ?? 0, state.lead);

  if (!quote || !order) return null;

  const paidWith = order.method === "pix" ? "pago no Pix" : "pago no cartão";
  const savings = quote.discountCents + quote.kitSavingsCents;
  const gift = quote.units >= GIFT_MIN_UNITS;
  const line = `${quote.units} unidades · ${formatCents(quote.totalCents)} · ${paidWith}`;
  const summary = `Pedido Papelito #${order.orderNumber} · ${line}. A nota fiscal e o rastreio chegam no WhatsApp e no e-mail.`;

  return (
    <div className="mx-auto grid max-w-[720px] gap-6 px-8 py-8">
      <section className="expo-rise rounded-xl border-[3px] border-[#231F20] bg-brand-yellow p-8 shadow-[10px_10px_0_#231F20]">
        <h1 className="font-[family-name:var(--font-expo-display)] text-[36px] uppercase leading-none">Pedido confirmado!</h1>
        <p className="mt-3 text-lg font-bold">{line}</p>
        <p className="text-base">{`Pedido #${order.orderNumber}`}</p>
        {savings > 0 ? <p className="mt-3 text-xl font-extrabold">{`Você economizou ${formatCents(savings)}`}</p> : null}
      </section>
      {gift ? (
        <section className="flex items-center gap-4 rounded-lg border-2 border-[#231F20] p-4">
          <Image src="/images/expocannabis/brinde-bandeja.webp" alt="" width={96} height={72} />
          <p className="text-base font-bold">Bandeja chaveiro + merch: retire no balcão.</p>
        </section>
      ) : null}
      <section aria-labelledby="expo-next-title">
        <h2 id="expo-next-title" className="text-xs font-extrabold uppercase tracking-[0.08em]">
          Próximos passos
        </h2>
        <ol className="mt-2 grid gap-2 text-base">
          {gift ? <li>Agora: retire o brinde no balcão.</li> : null}
          <li>Hoje: nota e resumo no WhatsApp e no e-mail.</li>
          <li>Até 7 dias úteis: entrega no endereço escolhido.</li>
        </ol>
      </section>
      <section className="flex items-center justify-between gap-4 rounded-lg bg-[#231F20] p-5 text-white">
        <p className="text-base font-bold">PDV Perfeito: quer conhecer o programa?</p>
        {leadSent ? (
          <span className="font-extrabold text-brand-yellow">Anotado ✓</span>
        ) : (
          <button type="button" onClick={sendLead} className="h-12 rounded-md bg-brand-yellow px-4 font-extrabold text-[#231F20]">
            Quero participar
          </button>
        )}
      </section>
      <a href={whatsappLink(contact.phone, summary)} target="_blank" rel="noopener noreferrer" className="grid h-14 place-items-center rounded-md border-2 border-[#231F20] text-base font-extrabold">
        Enviar resumo no WhatsApp
      </a>
      <button type="button" onClick={onNewOrder} className="h-[68px] rounded-md bg-brand-yellow text-xl font-extrabold shadow-[0_5px_0_#231F20]">
        Novo pedido
      </button>
    </div>
  );
}
