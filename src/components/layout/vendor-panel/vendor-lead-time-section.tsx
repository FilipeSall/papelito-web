"use client";

import { useState, useTransition } from "react";

import { ProfileFormField } from "@/components/layout/profile-page/profile-form-field";
import { formatLeadTime } from "@/features/active-vendor/utils/format-vendor-region";

import { AnchoredSection } from "@/components/ui/anchored-sections";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";

const MIN_DAYS = 1;
const MAX_DAYS = 30;

export function VendorLeadTimeSection({
  configured,
  initialLeadTimeDays,
  loadFailed,
}: Readonly<{
  configured: boolean;
  initialLeadTimeDays: number;
  loadFailed: boolean;
}>) {
  const [days, setDays] = useState(String(initialLeadTimeDays));
  const [savedDays, setSavedDays] = useState(configured ? initialLeadTimeDays : 0);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pending, startTransition] = useTransition();

  const numberOfDays = Number(days);
  const error =
    !Number.isInteger(numberOfDays) || numberOfDays < MIN_DAYS || numberOfDays > MAX_DAYS
      ? `Informe um número inteiro entre ${MIN_DAYS} e ${MAX_DAYS}.`
      : "";
  const previewDays = error ? initialLeadTimeDays : numberOfDays;
  const isUnset = !configured && savedDays === 0;

  function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (error) {
      setFeedback({ error: true, message: error });
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/vendor/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping_lead_time_days: numberOfDays }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setFeedback({
          error: true,
          message: body?.message ?? "Não foi possível atualizar o prazo.",
        });
        return;
      }

      setSavedDays(numberOfDays);
      setFeedback({ error: false, message: "Prazo atualizado. Seus clientes já veem o novo prazo." });
    });
  }

  return (
    <AnchoredSection
      description="Quantos dias úteis sua loja leva para preparar um pedido antes de postá-lo. É o prazo que o comprador vê ao escolher a sua loja."
      id="entrega"
      title="Entrega"
    >
      <form className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]" onSubmit={submit}>
        <div>
          <div className="border-2 border-[#1a1a1a] bg-white p-5 shadow-[4px_4px_0px_#1a1a1a]">
            <ProfileFormField
              disabled={loadFailed}
              errorMessage={days ? error : ""}
              inputMode="numeric"
              label="Dias úteis de preparo"
              onChange={setDays}
              type="number"
              value={days}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending || loadFailed || Boolean(error)}
              type="submit"
            >
              {pending ? "Salvando..." : "Salvar prazo"}
            </button>
          </div>
        </div>

        <div className="lg:border-l lg:border-dashed lg:border-[#1a1a1a]/25 lg:pl-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/56">
            No cartão da sua loja o comprador lê
          </p>
          <p
            className="mt-3 text-2xl leading-tight font-black tracking-tight text-[#1a1a1a] md:text-3xl"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            {formatLeadTime(previewDays)}
          </p>

          {loadFailed ? (
            <p className="mt-5 border-2 border-[#c0392b] bg-[#f7e6e2] px-4 py-3 text-sm leading-6 font-semibold text-[#7a3428]">
              Não foi possível ler o prazo salvo agora. Recarregue a página antes de alterá-lo, para
              não sobrescrever o valor atual sem querer.
            </p>
          ) : isUnset ? (
            <p className="mt-5 border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm leading-6 font-semibold text-[#1a1a1a]">
              Você ainda não definiu esse prazo. Até definir, sua loja promete o padrão de{" "}
              {initialLeadTimeDays} dias úteis.
            </p>
          ) : (
            <p className="mt-4 max-w-md text-sm leading-6 text-[#1a1a1a]/68">
              O prazo entra no cálculo da data de entrega mostrada no checkout. Mantê-lo realista
              evita atraso de postagem e pedido cancelado.
            </p>
          )}

          <FeedbackBanner className="mt-5" feedback={feedback} />
        </div>
      </form>
    </AnchoredSection>
  );
}
