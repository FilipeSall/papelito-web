"use client";

import { useState, useTransition } from "react";

import { Panel } from "@/components/layout/operational-panel";
import { ProfileFormField } from "@/components/layout/profile-page/profile-form-field";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";

export function VendorSettingsForm({ initialLeadTimeDays }: { initialLeadTimeDays: number }) {
  const [days, setDays] = useState(String(initialLeadTimeDays));
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pending, startTransition] = useTransition();
  const numberOfDays = Number(days);
  const error =
    !Number.isInteger(numberOfDays) || numberOfDays < 1 || numberOfDays > 30
      ? "Informe um numero inteiro entre 1 e 30."
      : "";

  function submit(event: React.FormEvent<HTMLFormElement>) {
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
      setFeedback(
        response.ok
          ? { error: false, message: "Prazo operacional atualizado." }
          : { error: true, message: body?.message ?? "Nao foi possivel atualizar o prazo." },
      );
    });
  }

  return (
    <Panel className="max-w-3xl overflow-hidden">
      <div className="bg-brand-dark px-5 py-3 text-brand-yellow">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em]">Prazo operacional</p>
      </div>
      <form className="px-5 py-6 md:px-6" onSubmit={submit}>
        <h3
          className="text-2xl font-semibold uppercase tracking-[0.1em]"
          style={{ fontFamily: "var(--font-admin-display)" }}
        >
          Preparacao de pedidos
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-brand-dark/68">
          Defina quantos dias uteis sua loja precisa para preparar pedidos. Este prazo aparece para clientes ao escolherem seu vendor.
        </p>
        <div className="mt-6 max-w-sm rounded-[20px] border border-brand-dark/12 bg-[#fbf7ef] p-5">
          <ProfileFormField
            errorMessage={days ? error : ""}
            inputMode="numeric"
            label="Dias uteis de processamento"
            onChange={setDays}
            type="number"
            value={days}
          />
        </div>
        <FeedbackBanner className="mt-5" feedback={feedback} />
        <button
          className="mt-6 rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-yellow disabled:opacity-50"
          disabled={pending || Boolean(error)}
          type="submit"
        >
          {pending ? "Salvando..." : "Salvar prazo"}
        </button>
      </form>
    </Panel>
  );
}
