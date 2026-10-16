"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { ConfirmModal } from "@/components/ui/confirm-modal";
import { hardPrimaryActionClass } from "@/components/ui/hard-actions";
import { registerMercadoPagoIdentity } from "@/features/vendor-payment-gateways/services/payment-gateways-client";

type IdentityResult = "mismatch" | "verified";

type Feedback = { tone: "error" | "success"; text: string };

const RESULT_OPTIONS: ReadonlyArray<{ value: IdentityResult; label: string }> = [
  { value: "verified", label: "Conta é do CNPJ da loja" },
  { value: "mismatch", label: "Conta de outro titular" },
];

const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70";

function resultLabel(value: IdentityResult): string {
  return RESULT_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function FeedbackLine({ feedback }: Readonly<{ feedback: Feedback | null }>) {
  if (!feedback) return null;

  const isError = feedback.tone === "error";

  return (
    <p
      className={`border-2 bg-white px-4 py-3 text-sm font-semibold ${isError ? "border-[#c0392b] text-[#c0392b]" : "border-[#15803d] text-[#14532d]"}`}
      role={isError ? "alert" : "status"}
    >
      {feedback.text}
    </p>
  );
}

type IdentityFormProps = {
  accountId: number;
  vendorId: number;
};

/**
 * Formulário administrativo que registra a conferência de titularidade da conta Mercado Pago
 * de um vendor (`verified` ou `mismatch`). A referência da evidência — nº do chamado, não o
 * documento — é obrigatória, e o envio passa por confirmação porque muda a aptidão do vendor.
 * A conferência vale só para `accountId`: se a loja reconectar outra conta, o envio é recusado.
 */
export function VendorMercadoPagoIdentityForm({ accountId, vendorId }: Readonly<IdentityFormProps>) {
  const router = useRouter();
  const evidenceId = useId();
  const [result, setResult] = useState<IdentityResult | null>(null);
  const [evidenceRef, setEvidenceRef] = useState("");
  const [validation, setValidation] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const evidence = evidenceRef.trim();

  function requestConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!result) {
      setValidation("Escolha o resultado da conferência.");
      return;
    }
    if (!evidence) {
      setValidation("Informe a referência da evidência (ex.: nº do chamado).");
      return;
    }

    setValidation("");
    setConfirmOpen(true);
  }

  async function submit() {
    if (!result) return;

    setSubmitting(true);
    const response = await registerMercadoPagoIdentity(vendorId, accountId, result, evidence);
    setSubmitting(false);
    setConfirmOpen(false);

    if (!response.ok) {
      setFeedback({ tone: "error", text: response.message });
      return;
    }

    setEvidenceRef("");
    setResult(null);
    setFeedback({ tone: "success", text: "Conferência registrada. O estado do Mercado Pago foi atualizado." });
    router.refresh();
  }

  return (
    <form className="space-y-4 border-t-2 border-[#1a1a1a]/10 pt-4" noValidate onSubmit={requestConfirmation}>
      <fieldset className="space-y-2">
        <legend className={LABEL_CLASS}>Resultado da conferência</legend>
        <div className="flex flex-wrap gap-4">
          {RESULT_OPTIONS.map((option) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#231f20]" key={option.value}>
              <input
                checked={result === option.value}
                className="size-4 accent-[#1a1a1a]"
                name={`identity-result-${vendorId}`}
                onChange={() => setResult(option.value)}
                type="radio"
                value={option.value}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex max-w-md flex-col gap-2">
        <label className={LABEL_CLASS} htmlFor={evidenceId}>
          Referência da evidência
        </label>
        <input
          className="h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm font-medium text-[#1a1a1a] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
          id={evidenceId}
          maxLength={120}
          onChange={(event) => setEvidenceRef(event.target.value)}
          placeholder="Nº do chamado ou do protocolo"
          value={evidenceRef}
        />
      </div>

      {validation ? <p className="text-[11px] font-semibold text-[#c0392b]">⚠ {validation}</p> : null}
      <FeedbackLine feedback={feedback} />

      <button className={hardPrimaryActionClass} disabled={submitting} type="submit">
        Registrar conferência
      </button>

      <ConfirmModal
        confirmLabel="Confirmar registro"
        description={`Registrar "${result ? resultLabel(result) : ""}" com a evidência ${evidence}. Isso muda se o vendor pode receber pelo Mercado Pago.`}
        isSubmitting={submitting}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void submit()}
        open={confirmOpen}
        title="Registrar conferência de titularidade?"
        tone={result === "mismatch" ? "danger" : "default"}
      />
    </form>
  );
}
