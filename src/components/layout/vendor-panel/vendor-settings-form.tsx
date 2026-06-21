"use client";

import { useState, useTransition } from "react";

import { Panel } from "@/components/layout/operational-panel";
import { PasswordSettingsCard } from "@/components/layout/profile-page/password-settings-card";
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
    <div className="grid max-w-6xl gap-4 xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)] xl:items-stretch">
      <Panel className="flex h-full flex-col overflow-hidden">
        <div className="bg-brand-yellow px-5 py-3 text-brand-dark">
          <p className="text-[10px] font-black uppercase tracking-[0.25em]">
            Prazo operacional
          </p>
        </div>
        <form className="flex flex-1 flex-col px-5 py-6 md:px-6" onSubmit={submit}>
          <p className="mt-3 max-w-xl text-sm leading-6 text-brand-dark/68">
            Defina quantos dias uteis sua loja precisa para preparar pedidos. Este prazo aparece
            para clientes ao escolherem seu vendor.
          </p>
          <div className="mt-6 max-w-sm border-2 border-[#1a1a1a] bg-white p-5 shadow-[4px_4px_0px_#1a1a1a]">
            <ProfileFormField
              errorMessage={days ? error : ""}
              inputMode="numeric"
              label="Dias uteis de processamento"
              onChange={setDays}
              type="number"
              value={days}
            />
          </div>
          <div className="mt-auto pt-6">
            <FeedbackBanner className="mt-5" feedback={feedback} />
            <button
              className="mt-6 inline-flex w-fit whitespace-nowrap rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-yellow disabled:opacity-50"
              disabled={pending || Boolean(error)}
              type="submit"
            >
              {pending ? "Salvando..." : "Salvar prazo"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel className="flex h-full flex-col overflow-hidden">
        <div className="bg-brand-yellow px-5 py-3 text-brand-dark">
          <p className="text-[10px] font-black uppercase tracking-[0.25em]">Alterar senha</p>
        </div>
        <PasswordSettingsCard variant="embedded" />
      </Panel>
    </div>
  );
}
