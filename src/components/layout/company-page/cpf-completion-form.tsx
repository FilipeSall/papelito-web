"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveCustomerCpf } from "@/features/company/client/company-client";
import { resolveSafeCallbackUrl } from "@/features/company/onboarding";
import { formatCpf } from "@/features/revendedor/utils/revendedor-registration";
import { isValidCpf } from "@/lib/validation/brazilian-documents";

type CpfCompletionFormProps = {
  callbackUrl?: string;
  onComplete?: () => void | Promise<void>;
};

export function CpfCompletionForm({ callbackUrl = "/", onComplete }: CpfCompletionFormProps) {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const formattedCpf = formatCpf(cpf);
    if (!isValidCpf(formattedCpf)) {
      setError("Informe um CPF válido.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await saveCustomerCpf(formattedCpf);
    if (!result.ok) {
      setSubmitting(false);
      setError(result.message);
      return;
    }

    if (onComplete) {
      await onComplete();
      setSubmitting(false);
      return;
    }

    router.replace(resolveSafeCallbackUrl(callbackUrl));
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 border-2 border-[#1a1a1a] bg-[#faf8f2] p-8 shadow-[8px_8px_0px_#1a1a1a]"
    >
      <div className="h-2 w-full bg-brand-yellow" />
      <div>
        <h1 className="text-xl font-black uppercase">Complete seu CPF</h1>
        <p className="mt-2 text-sm text-[#231f20]/75">
          Seu CPF identifica você como pessoa. Ele não altera o CNPJ nem os dados da empresa.
        </p>
      </div>
      <label className="block text-sm font-bold" htmlFor="customer-cpf">
        CPF
        <input
          id="customer-cpf"
          autoComplete="off"
          inputMode="numeric"
          maxLength={14}
          required
          value={cpf}
          onChange={(event) => setCpf(formatCpf(event.target.value))}
          className="mt-1 h-11 w-full border-2 border-[#1a1a1a] bg-white px-3"
          placeholder="000.000.000-00"
        />
      </label>
      {error ? <p className="text-sm font-bold text-[#c0392b]">⚠ {error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#1a1a1a] px-5 py-3 text-[12px] font-black uppercase tracking-[0.18em] text-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Salvando..." : "Continuar"}
      </button>
    </form>
  );
}
