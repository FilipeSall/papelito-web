"use client";

import { useRouter } from "next/navigation";
import { Paperclip, ScanBarcode } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import { FOCUS_RING } from "@/components/layout/operational-panel";
import { DirectUploadError, uploadDirectFile } from "@/lib/client/direct-upload";
import type { VendorReturn } from "@/features/returns/types/vendor-return";
import { centsToRefundInput, refundInputToCents } from "@/features/returns/money";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";
import { returnStatusMeta } from "@/features/returns/return-status";

const primaryButton = [
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
  FOCUS_RING,
].join(" ");

const secondaryButton = [
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

const dangerButton = [
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#c0392b] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#c0392b] transition hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

const fieldClassName = [
  "h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
  FOCUS_RING,
].join(" ");

const areaClassName = [
  "min-h-20 w-full border-2 border-[#1a1a1a] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
  FOCUS_RING,
].join(" ");

const labelClassName = "block text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]";

const triggerClassName =
  "h-11 rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm font-semibold text-[#1a1a1a] focus:border-[#1a1a1a]";

const CONDITIONS = [
  { label: "Revendável", value: "sellable" },
  { label: "Com defeito", value: "defective" },
  { label: "Danificado", value: "damaged" },
  { label: "Sem condição de revenda", value: "unsellable" },
  { label: "Outra condição", value: "other" },
];

const DISPOSITIONS = [
  { label: "Devolver ao estoque", value: "return_to_sellable_stock" },
  { label: "Não repor no estoque", value: "do_not_restock" },
];

const METHODS = [
  { label: "Pix", value: "pix" },
  { label: "Transferência bancária", value: "bank_transfer" },
  { label: "Mesmo meio da compra", value: "original_method" },
  { label: "Outro meio", value: "other" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isS10(value: string) {
  return /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(value.replace(/\s+/g, "").toUpperCase());
}

function Field({ children, label }: Readonly<{ children: ReactNode; label: string }>) {
  return (
    <label className="block">
      <span className={labelClassName}>{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

type InspectionRow = { condition: string; disposition: string; other: string; receivedQty: number };

/**
 * Único lugar da tela onde a devolução muda de estado.
 *
 * O fluxo tem sete transições, mas cada estado libera no máximo uma delas — o
 * painel renderiza só a que vale agora, sempre na mesma posição, para o vendor
 * não precisar procurar qual botão é o da vez.
 */
export function VendorReturnActions({ data }: Readonly<{ data: VendorReturn }>) {
  const router = useRouter();
  const meta = returnStatusMeta(data.status);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authInstructions, setAuthInstructions] = useState("");
  const [authExpiresAt, setAuthExpiresAt] = useState("");
  const [tracking, setTracking] = useState("");
  const [refundAmount, setRefundAmount] = useState(centsToRefundInput(data.eligibleAmountCents));
  const [refundMethod, setRefundMethod] = useState(METHODS[0].value);
  const [refundMethodOther, setRefundMethodOther] = useState("");
  const [refundReference, setRefundReference] = useState("");
  const [refundedAt, setRefundedAt] = useState(today);
  const [proof, setProof] = useState<{ id: number; name: string } | null>(null);
  const [inspection, setInspection] = useState<Record<number, InspectionRow>>(() =>
    Object.fromEntries(
      data.items.map((item) => [
        item.id,
        { condition: "sellable", disposition: "return_to_sellable_stock", other: "", receivedQty: item.requestedQty },
      ]),
    ),
  );

  async function run(action: string, body: unknown, success: string) {
    if (busy) return;
    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/vendor/returns/${data.id}/${action}`, {
        body: JSON.stringify(body ?? {}),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setFeedback({ error: true, message: `⚠ ${payload?.message ?? "Não foi possível concluir a ação."}` });
        return;
      }

      setFeedback({ error: false, message: `✓ ${success}` });
      setRejecting(false);
      router.refresh();
    } catch {
      setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor. Verifique sua conexão." });
    } finally {
      setBusy(false);
    }
  }

  async function attachProof(file: File) {
    setBusy(true);
    setFeedback(null);

    try {
      const uploaded = await uploadDirectFile<{ id?: number; originalName?: string }>(
        "return-refund-proof",
        file,
        { returnId: data.id },
      );
      setProof({ id: Number(uploaded.id) || 0, name: uploaded.originalName ?? file.name });
      setFeedback({ error: false, message: "✓ Comprovante anexado. Confira os dados e registre o estorno." });
    } catch (cause) {
      const message =
        cause instanceof DirectUploadError ? cause.message : "Não foi possível enviar o comprovante.";
      setFeedback({ error: true, message: `⚠ ${message}` });
    } finally {
      setBusy(false);
      if (proofInputRef.current) proofInputRef.current.value = "";
    }
  }

  function submitAuthorization() {
    if (authCode.trim().length < 3) {
      setFeedback({ error: true, message: "⚠ Informe o código de autorização com ao menos 3 caracteres." });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(authExpiresAt)) {
      setFeedback({ error: true, message: "⚠ Informe a validade da autorização, de até 7 dias." });
      return;
    }
    void run(
      "authorization",
      { authorizationCode: authCode.trim(), instructions: authInstructions.trim(), expiresAt: authExpiresAt },
      "Autorização enviada. O cliente já pode postar.",
    );
  }

  function submitTracking() {
    if (!isS10(tracking)) {
      setFeedback({ error: true, message: "⚠ Informe um código S10 válido, como AA123456789BR." });
      return;
    }
    void run("tracking", { trackingCode: tracking.replace(/\s+/g, "").toUpperCase() }, "Rastreio reverso associado.");
  }

  function submitInspection() {
    const items = data.items.map((item) => {
      const row = inspection[item.id];
      return {
        id: item.id,
        condition: row.condition,
        other: row.other.trim(),
        receivedQty: row.receivedQty,
        stockDisposition: row.disposition,
      };
    });

    const invalid = items.find(
      (item) => item.receivedQty <= 0 || (item.condition === "other" && item.other === ""),
    );
    if (invalid) {
      setFeedback({ error: true, message: "⚠ Informe a quantidade recebida e descreva as condições marcadas como outra." });
      return;
    }

    void run("inspection", { items }, "Inspeção registrada. Agora registre o estorno.");
  }

  function submitRefund() {
    const amountCents = refundInputToCents(refundAmount);
    if (amountCents <= 0 || amountCents > data.eligibleAmountCents) {
      setFeedback({
        error: true,
        message: `⚠ O estorno precisa ficar entre R$ 0,01 e ${centsToRefundInput(data.eligibleAmountCents)}.`,
      });
      return;
    }
    if (!proof) {
      setFeedback({ error: true, message: "⚠ Anexe o comprovante do estorno antes de registrar." });
      return;
    }
    if (refundMethod === "other" && refundMethodOther.trim() === "") {
      setFeedback({ error: true, message: "⚠ Descreva qual foi o meio usado no estorno." });
      return;
    }

    void run(
      "refund",
      {
        amountCents,
        method: refundMethod,
        methodOther: refundMethodOther.trim(),
        proofId: proof.id,
        reference: refundReference.trim(),
        refundedAt,
      },
      "Estorno registrado. O cliente foi notificado.",
    );
  }

  function updateInspection(itemId: number, patch: Partial<InspectionRow>) {
    setInspection((current) => ({ ...current, [itemId]: { ...current[itemId], ...patch } }));
  }

  return (
    <div className="space-y-4">
      <FeedbackBanner feedback={feedback} />

      {meta.action === null ? (
        <p className="text-sm font-semibold leading-6 text-[#231f20]/74">
          Esta devolução está encerrada. Nada mais é esperado de você aqui.
        </p>
      ) : null}

      {meta.action === "approve" ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[#231f20]/74">
            Aprovar abre a etapa de autorização de postagem reversa. Recusar encerra a devolução e exige
            um motivo, que o cliente vê.
          </p>
          {rejecting ? (
            <div className="space-y-3">
              <Field label="Motivo da recusa *">
                <textarea
                  className={areaClassName}
                  maxLength={500}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Explique por que a devolução não se aplica a este pedido."
                  value={rejectReason}
                />
              </Field>
              <div className="flex flex-wrap gap-3">
                <button
                  className={dangerButton}
                  disabled={busy}
                  onClick={() => {
                    if (rejectReason.trim() === "") {
                      setFeedback({ error: true, message: "⚠ Informe o motivo da recusa." });
                      return;
                    }
                    void run("reject", { reason: rejectReason.trim() }, "Devolução recusada.");
                  }}
                  type="button"
                >
                  Confirmar recusa
                </button>
                <button className={secondaryButton} disabled={busy} onClick={() => setRejecting(false)} type="button">
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                className={primaryButton}
                disabled={busy}
                onClick={() => void run("approve", {}, "Devolução aprovada. Envie a autorização de postagem.")}
                type="button"
              >
                Aprovar devolução
              </button>
              <button className={dangerButton} disabled={busy} onClick={() => setRejecting(true)} type="button">
                Recusar
              </button>
            </div>
          )}
        </div>
      ) : null}

      {meta.action === "authorization" ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[#231f20]/74">
            O código de autorização é o que o cliente apresenta para postar. Ele não é o rastreio: o S10 entra
            depois, quando existir.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Código de autorização *">
              <input
                className={fieldClassName}
                maxLength={96}
                onChange={(event) => setAuthCode(event.target.value)}
                placeholder="Ex.: AUT-2026-0031"
                value={authCode}
              />
            </Field>
            <Field label="Válida até *">
              <input
                className={fieldClassName}
                min={today()}
                onChange={(event) => setAuthExpiresAt(event.target.value)}
                type="date"
                value={authExpiresAt}
              />
            </Field>
          </div>
          <Field label="Instruções para o cliente">
            <textarea
              className={areaClassName}
              maxLength={500}
              onChange={(event) => setAuthInstructions(event.target.value)}
              placeholder="Agência, embalagem, prazo — o que o cliente precisa saber para postar."
              value={authInstructions}
            />
          </Field>
          <button className={primaryButton} disabled={busy} onClick={submitAuthorization} type="button">
            Enviar autorização
          </button>
        </div>
      ) : null}

      {meta.action === "received" ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[#231f20]/74">
            Confirme só quando a encomenda estiver fisicamente com você. A confirmação abre a inspeção dos itens.
          </p>
          <button
            className={primaryButton}
            disabled={busy}
            onClick={() => void run("received", {}, "Recebimento confirmado. Registre a inspeção.")}
            type="button"
          >
            Confirmar recebimento
          </button>

          <div className="border-t-2 border-[#1a1a1a]/12 pt-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/55">
              <ScanBarcode aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
              Rastreio reverso (opcional)
            </p>
            {data.reverseShipmentId > 0 ? (
              <p className="mt-2 text-sm font-semibold text-[#231f20]/74">
                Já existe um rastreio reverso associado a esta devolução.
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <span className="flex-1">
                  <Field label="Código S10">
                    <input
                      className={fieldClassName}
                      onChange={(event) => setTracking(event.target.value)}
                      placeholder="AA123456789BR"
                      value={tracking}
                    />
                  </Field>
                </span>
                <button className={secondaryButton} disabled={busy} onClick={submitTracking} type="button">
                  Associar
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {meta.action === "inspection" ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[#231f20]/74">
            Registre item a item. O que for marcado para voltar ao estoque é reposto automaticamente na sua
            grade de disponibilidade.
          </p>
          <ul className="space-y-4">
            {data.items.map((item) => {
              const row = inspection[item.id];
              return (
                <li className="border-2 border-[#1a1a1a]/20 bg-white p-4" key={item.id}>
                  <p className="text-sm font-black text-[#1a1a1a]">{item.productName}</p>
                  <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/55">
                    Cliente enviou {item.requestedQty}
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field label="Recebido *">
                      <input
                        className={fieldClassName}
                        max={item.requestedQty}
                        min={1}
                        onChange={(event) => updateInspection(item.id, { receivedQty: Number(event.target.value) || 0 })}
                        type="number"
                        value={row.receivedQty}
                      />
                    </Field>
                    <CheckoutCustomSelect
                      anchoredMenu
                      label="Condição *"
                      labelClassName={labelClassName}
                      onChange={(value) => updateInspection(item.id, { condition: value })}
                      options={CONDITIONS}
                      placeholder="Selecione"
                      triggerClassName={`mt-1.5 ${triggerClassName}`}
                      value={row.condition}
                    />
                    <CheckoutCustomSelect
                      anchoredMenu
                      label="Estoque *"
                      labelClassName={labelClassName}
                      onChange={(value) => updateInspection(item.id, { disposition: value })}
                      options={DISPOSITIONS}
                      placeholder="Selecione"
                      triggerClassName={`mt-1.5 ${triggerClassName}`}
                      value={row.disposition}
                    />
                  </div>
                  {row.condition === "other" ? (
                    <div className="mt-3">
                      <Field label="Descreva a condição *">
                        <input
                          className={fieldClassName}
                          maxLength={200}
                          onChange={(event) => updateInspection(item.id, { other: event.target.value })}
                          value={row.other}
                        />
                      </Field>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <button className={primaryButton} disabled={busy} onClick={submitInspection} type="button">
            Registrar inspeção
          </button>
        </div>
      ) : null}

      {meta.action === "refund" ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[#231f20]/74">
            O estorno é feito por você, fora da plataforma. Aqui você registra o que já pagou e anexa o
            comprovante — o teto é {centsToRefundInput(data.eligibleAmountCents)}, o valor líquido dos itens.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Valor estornado (R$) *">
              <input
                className={fieldClassName}
                inputMode="decimal"
                onChange={(event) => setRefundAmount(event.target.value)}
                value={refundAmount}
              />
            </Field>
            <Field label="Data do estorno *">
              <input
                className={fieldClassName}
                max={today()}
                onChange={(event) => setRefundedAt(event.target.value)}
                type="date"
                value={refundedAt}
              />
            </Field>
            <CheckoutCustomSelect
              anchoredMenu
              label="Meio usado *"
              labelClassName={labelClassName}
              onChange={setRefundMethod}
              options={METHODS}
              placeholder="Selecione"
              triggerClassName={`mt-1.5 ${triggerClassName}`}
              value={refundMethod}
            />
            <Field label="Referência ou identificador">
              <input
                className={fieldClassName}
                maxLength={191}
                onChange={(event) => setRefundReference(event.target.value)}
                placeholder="Ex.: E2026090812..."
                value={refundReference}
              />
            </Field>
          </div>

          {refundMethod === "other" ? (
            <Field label="Qual meio? *">
              <input
                className={fieldClassName}
                maxLength={191}
                onChange={(event) => setRefundMethodOther(event.target.value)}
                value={refundMethodOther}
              />
            </Field>
          ) : null}

          <div className="border-t-2 border-[#1a1a1a]/12 pt-4">
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

          <button className={primaryButton} disabled={busy || !proof} onClick={submitRefund} type="button">
            Registrar estorno
          </button>
        </div>
      ) : null}
    </div>
  );
}
