"use client";

import { useState } from "react";

import { requestCompanyAccess } from "@/features/company/client/company-client";

type CompanyRequestAccessFormProps = {
  onRequested: () => void;
};

/**
 * Formulário "Entrar em uma empresa existente" (por CNPJ). A resposta é sempre neutra: nunca
 * revela se a empresa existe, seus membros ou pedidos.
 */
export function CompanyRequestAccessForm({ onRequested }: CompanyRequestAccessFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const cnpj = String(new FormData(event.currentTarget).get("cnpj") ?? "").trim();
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    const result = await requestCompanyAccess(cnpj);
    setSubmitting(false);
    if (!result.ok) {
      setError(`⚠ ${result.message}`);
      return;
    }
    setFeedback(
      "✓ Solicitação registrada. Se houver uma empresa com este CNPJ, os administradores dela receberão seu pedido.",
    );
    event.currentTarget.reset();
    onRequested();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border-2 border-[#1a1a1a] bg-[#faf8f2] p-5 shadow-[6px_6px_0px_#1a1a1a]"
    >
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          Entrar em uma empresa
        </h4>
      </div>
      <label
        htmlFor="request-cnpj"
        className="block text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]"
      >
        CNPJ da empresa *
      </label>
      <input
        id="request-cnpj"
        name="cnpj"
        required
        inputMode="numeric"
        placeholder="00.000.000/0000-00"
        className="h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow sm:w-80"
      />
      {error ? <p className="text-sm font-bold text-[#c0392b]">{error}</p> : null}
      {feedback ? <p className="text-sm font-bold text-[#1a7f37]">{feedback}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="cursor-pointer bg-[#1a1a1a] px-5 py-2.5 text-[12px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Enviando..." : "Solicitar acesso"}
      </button>
    </form>
  );
}
