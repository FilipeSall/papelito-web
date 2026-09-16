"use client";

import { useRouter } from "next/navigation";
import { Copy, KeyRound, Paperclip, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";

import { FOCUS_RING, StatusChip, type StatusShape } from "@/components/layout/operational-panel";
import type { VendorOrderRefund } from "@/features/vendor-orders/types/vendor-orders";
import { parseUtcDate, SAO_PAULO } from "@/features/vendor-orders/utils/order-dates";
import { DirectUploadError, uploadDirectFile } from "@/lib/client/direct-upload";
import { formatBRLIntl } from "@/lib/format-currency";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";

const primaryButton = [
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
  FOCUS_RING,
].join(" ");

const secondaryButton = [
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

const fieldClassName = [
  "h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
  FOCUS_RING,
].join(" ");

const labelClassName = "block text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: SAO_PAULO });

const STATUS_SHAPE: Record<VendorOrderRefund["status"], StatusShape> = {
  falhou: { icon: RotateCcw, label: "Estorno com falha", tone: "critical" },
  manual_pendente: { icon: RotateCcw, label: "Devolução pendente", tone: "critical" },
  processando: { icon: RotateCcw, label: "Estorno em processamento", tone: "pending" },
  reembolsado: { icon: RotateCcw, label: "Estorno concluído", tone: "positive" },
};

const PIX_KEY_TYPE_LABEL: Record<string, string> = {
  aleatoria: "Chave aleatória",
  cnpj: "CNPJ",
  cpf: "CPF",
  email: "E-mail",
  telefone: "Telefone",
};

type RevealedPixKey = { holderName: string; key: string; type: string };

function formatUtcDate(value: string) {
  const date = parseUtcDate(value);
  return date ? dateFormatter.format(date) : "";
}

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SAO_PAULO }).format(new Date());
}

/**
 * Estorno do pedido pago que o vendor cancelou. No caminho automático só
 * informa; no manual mostra a chave PIX do comprador sob demanda e registra a
 * devolução com comprovante, que é o que encerra o pedido como estornado.
 */
export function VendorOrderRefundPanel({ orderId, refund }: { orderId: number; refund: VendorOrderRefund }) {
  const router = useRouter();
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [busy, setBusy] = useState(false);
  const [pixKey, setPixKey] = useState<RevealedPixKey | null>(null);
  const [proof, setProof] = useState<{ id: number; name: string } | null>(null);
  const [reference, setReference] = useState("");
  const [refundedAt, setRefundedAt] = useState(todayInSaoPaulo);
  const shape = STATUS_SHAPE[refund.status];
  const done = refund.status === "reembolsado";
  const dueDate = formatUtcDate(refund.refundDueAt);

  async function revealPixKey() {
    if (busy) return;

    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/vendor/orders/${orderId}/refund/pix-key`, { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as (Partial<RevealedPixKey> & { message?: string }) | null;

      if (response.ok && body?.key) {
        setPixKey({ holderName: body.holderName ?? "", key: body.key, type: body.type ?? "" });
        return;
      }

      setFeedback({ error: true, message: `⚠ ${body?.message ?? "Não foi possível mostrar a chave PIX."}` });
    } catch {
      setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor. Tente de novo." });
    } finally {
      setBusy(false);
    }
  }

  async function copyPixKey() {
    if (!pixKey) return;

    try {
      await navigator.clipboard.writeText(pixKey.key);
      setFeedback({ error: false, message: "✓ Chave PIX copiada." });
    } catch {
      setFeedback({ error: true, message: "⚠ Não foi possível copiar. Selecione a chave e copie manualmente." });
    }
  }

  async function attachProof(file: File) {
    setBusy(true);
    setFeedback(null);

    try {
      const uploaded = await uploadDirectFile<{ id?: number; originalName?: string }>("order-refund-proof", file, {
        orderId,
      });

      if (!uploaded.id) {
        throw new DirectUploadError("Não foi possível anexar o comprovante.", 500);
      }

      setProof({ id: uploaded.id, name: uploaded.originalName ?? file.name });
    } catch (error) {
      setFeedback({
        error: true,
        message: `⚠ ${error instanceof Error ? error.message : "Não foi possível anexar o comprovante."}`,
      });
    } finally {
      setBusy(false);
      if (proofInputRef.current) proofInputRef.current.value = "";
    }
  }

  async function registerRefund() {
    if (busy) return;

    if (!proof) {
      setFeedback({ error: true, message: "⚠ Anexe o comprovante da transferência." });
      return;
    }

    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/vendor/orders/${orderId}/refund/manual`, {
        body: JSON.stringify({ proofId: proof.id, reference: reference.trim(), refundedAt }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (response.ok) {
        setFeedback({ error: false, message: "✓ Devolução registrada. O pedido foi encerrado como estornado." });
        router.refresh();
        return;
      }

      setFeedback({
        error: true,
        hint: response.status === 409 ? "Atualize a página: o estorno já mudou de situação." : undefined,
        message: `⚠ ${body?.message ?? "Não foi possível registrar a devolução."}`,
      });
    } catch {
      setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor. Tente de novo." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]" id="estorno">
      <div aria-hidden className={`h-2 w-full ${done ? "bg-brand-yellow" : "bg-[#c0392b]"}`} />
      <div className="flex flex-col gap-3 border-b-2 border-[#1a1a1a] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55">
          Estorno ao comprador
        </h2>
        <StatusChip icon={shape.icon} label={shape.label} tone={shape.tone} />
      </div>

      <div className="space-y-5 px-5 py-5 md:px-6">
        <FeedbackBanner className="" feedback={feedback} />

        <div>
          <p className={labelClassName}>{done ? "Valor devolvido" : "Valor a devolver"}</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-[#1a1a1a]">
            {formatBRLIntl(refund.amountCents / 100)}
          </p>
        </div>

        {refund.status === "processando" ? (
          <p className="text-sm leading-6 text-[#231f20]/74">
            Pedimos à Pagar.me o estorno na forma de pagamento original do comprador. O valor é
            debitado do seu saldo de recebedor, e o pedido se encerra sozinho quando a Pagar.me confirmar.
          </p>
        ) : null}

        {refund.status === "falhou" ? (
          <div className="space-y-2">
            <p
              className="border-2 border-[#c0392b] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#c0392b]"
              role="alert"
            >
              ⚠ A Pagar.me ainda não aceitou o estorno. Tentamos de novo automaticamente (tentativa{" "}
              {refund.attempts}). Se não passar, a devolução vira manual e aparece aqui.
            </p>
            {refund.lastError ? (
              <p className="text-xs leading-5 text-[#231f20]/62">Retorno da Pagar.me: {refund.lastError}</p>
            ) : null}
          </div>
        ) : null}

        {refund.status === "manual_pendente" ? (
          <>
            <p className="text-sm leading-6 text-[#231f20]/74">
              {refund.lastError
                ? "A Pagar.me não aceitou o estorno automático, então a devolução passou a ser feita por você."
                : "Este pagamento não volta pela Pagar.me. Faça a transferência ao comprador e registre o comprovante aqui."}
            </p>

            {refund.overdue ? (
              <p
                className="border-2 border-[#c0392b] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#c0392b]"
                role="alert"
              >
                ⚠ Prazo vencido em {dueDate}. A Papelito acompanha este estorno.
              </p>
            ) : dueDate ? (
              <p className="text-sm font-bold text-[#1a1a1a]">Prazo para devolver: {dueDate}</p>
            ) : null}

            <div className="border-t-2 border-[#1a1a1a]/12 pt-4">
              <p className={labelClassName}>1. Chave PIX do comprador</p>

              {pixKey ? (
                <div className="mt-3 border-2 border-[#1a1a1a] bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60">
                    {PIX_KEY_TYPE_LABEL[pixKey.type] ?? pixKey.type}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
                    <code className="min-w-0 break-all font-mono text-sm font-bold text-[#1a1a1a]">{pixKey.key}</code>
                    <button className={secondaryButton} onClick={copyPixKey} type="button">
                      <Copy aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                      Copiar
                    </button>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#231f20]/62">
                    Titular: {pixKey.holderName}. Confira o nome no seu banco antes de confirmar a transferência.
                  </p>
                </div>
              ) : refund.customerHasPixKey ? (
                <>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#231f20]/62">
                    A chave só aparece quando você pede, e cada consulta fica registrada.
                  </p>
                  <button className={`mt-3 ${secondaryButton}`} disabled={busy} onClick={revealPixKey} type="button">
                    <KeyRound aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Mostrar chave PIX
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm leading-6 text-[#231f20]/74">
                  O comprador ainda não cadastrou uma chave PIX para reembolso. Combine a devolução pelo
                  chamado do pedido.
                </p>
              )}
            </div>

            <div className="space-y-4 border-t-2 border-[#1a1a1a]/12 pt-4">
              <p className={labelClassName}>2. Registrar a devolução</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClassName}>Data da transferência *</span>
                  <input
                    className={`mt-1.5 ${fieldClassName}`}
                    max={todayInSaoPaulo()}
                    onChange={(event) => setRefundedAt(event.target.value)}
                    type="date"
                    value={refundedAt}
                  />
                </label>
                <label className="block">
                  <span className={labelClassName}>Identificador da transferência</span>
                  <input
                    className={`mt-1.5 ${fieldClassName}`}
                    maxLength={191}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="Ex.: E2026091412..."
                    value={reference}
                  />
                </label>
              </div>

              <div>
                <p className={labelClassName}>Comprovante *</p>
                <p className="mt-1 text-xs font-semibold text-[#231f20]/62">PDF, JPG ou PNG, até 10 MB.</p>
                <input
                  accept="application/pdf,image/jpeg,image/png"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void attachProof(file);
                  }}
                  ref={proofInputRef}
                  type="file"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    className={secondaryButton}
                    disabled={busy}
                    onClick={() => proofInputRef.current?.click()}
                    type="button"
                  >
                    <Paperclip aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                    {proof ? "Trocar comprovante" : "Anexar comprovante"}
                  </button>
                  {proof ? (
                    <span className="min-w-0 truncate text-sm font-semibold text-[#231f20]/74">{proof.name}</span>
                  ) : null}
                </div>
              </div>

              <button className={primaryButton} disabled={busy || !proof} onClick={registerRefund} type="button">
                Registrar devolução
              </button>
            </div>
          </>
        ) : null}

        {done ? (
          <>
            <p className="text-sm leading-6 text-[#231f20]/74">
              {refund.mode === "manual"
                ? `Devolução registrada em ${formatUtcDate(refund.settledAt)}.`
                : `A Pagar.me confirmou o estorno em ${formatUtcDate(refund.settledAt)}.`}
            </p>

            {/*
              Recibo de estorno e comprovante vivem em "Documentos do estorno",
              logo abaixo: o pedido tem um lugar só para documentos, e o mesmo
              arquivo oferecido em dois cartões faz o vendor procurar diferença
              onde não há.
            */}
          </>
        ) : null}
      </div>
    </section>
  );
}
