"use client";

import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CircleCheckBig,
  Download,
  MapPin,
  PackageCheck,
  ScanBarcode,
  Tag,
  Truck,
} from "lucide-react";
import { useState, useTransition } from "react";

import { FOCUS_RING } from "@/components/layout/operational-panel";
import type {
  VendorOrderShipment,
  VendorOrderStatus,
} from "@/features/vendor-orders/types/vendor-orders";
import { isDateOnly, parseUtcDate, SAO_PAULO } from "@/features/vendor-orders/utils/order-dates";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";
import { generationStatusLabel, logisticsStatusLabel } from "./order-status";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isS10(value: string) {
  return /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(value.replace(/\s+/g, "").toUpperCase());
}

function normalizeTracking(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: SAO_PAULO,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: SAO_PAULO,
  year: "numeric",
});

/**
 * Data da postagem é gravada só com o dia (`YYYY-MM-DD`); os eventos de
 * rastreamento trazem hora e são normalizados para UTC na gravação. Tratar as
 * duas com o mesmo formatador imprimia a data pura de volta em ISO, porque
 * `2026-09-01Z` não é uma data válida.
 */
function formatStamp(value: string) {
  if (!value) return "";

  if (isDateOnly(value)) {
    const dayOnly = new Date(`${value}T12:00:00-03:00`);
    return Number.isNaN(dayOnly.getTime()) ? value : dateFormatter.format(dayOnly);
  }

  const date = parseUtcDate(value);
  return date ? dateTimeFormatter.format(date) : value;
}

const primaryButton = [
  "inline-flex h-11 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
  FOCUS_RING,
].join(" ");

const secondaryButton = [
  "inline-flex h-11 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

const fieldClassName = [
  "h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
  FOCUS_RING,
].join(" ");

const labelClassName = "block text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]";

const INVALID_S10_MESSAGE = "⚠ Informe um código S10 válido, como AA123456789BR.";
const MISSING_POSTED_AT_MESSAGE = "⚠ Informe a data da postagem.";
const MISSING_BRASPRESS_REFERENCE_MESSAGE =
  "⚠ Informe o número de pedido confirmado na Braspress.";
const SERVER_UNREACHABLE_MESSAGE = "⚠ Não foi possível falar com o servidor.";
const POSTED_AT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const BRASPRESS_REFERENCE_PATTERN = /^[A-Za-z0-9._/-]{1,96}$/;

/**
 * Escrita de logística do vendor. Sempre JSON, sempre o mesmo envelope — e sem
 * depender de nada do componente, por isso vive no escopo do módulo.
 */
function request(url: string, method: "PATCH" | "POST", body: unknown) {
  return fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method,
  });
}

/**
 * O que impede a revisão do envio manual, ou `null` quando ele está pronto.
 * A validação é local porque a revisão não chama a API: ela só mostra ao vendor
 * o que será enviado.
 */
function manualShipmentError(trackingCode: string, postedAt: string): string | null {
  if (!isS10(normalizeTracking(trackingCode))) return INVALID_S10_MESSAGE;
  if (!POSTED_AT_PATTERN.test(postedAt)) return MISSING_POSTED_AT_MESSAGE;

  return null;
}

/**
 * O que impede a revisão da postagem Braspress, ou `null` quando ela está
 * pronta. A referência é o número de pedido acertado fora da plataforma, não um
 * S10 — o formato aceito é o mesmo que o backend valida.
 */
function braspressShipmentError(externalOrderNumber: string, postedAt: string): string | null {
  if (!BRASPRESS_REFERENCE_PATTERN.test(externalOrderNumber.trim())) {
    return MISSING_BRASPRESS_REFERENCE_MESSAGE;
  }
  if (!POSTED_AT_PATTERN.test(postedAt)) return MISSING_POSTED_AT_MESSAGE;

  return null;
}

type ShipmentFactProps = {
  /** Ícone do lucide que acompanha o rótulo. */
  icon: typeof Truck;
  label: string;
  /** Liga a fonte monoespaçada dos códigos — rastreio e referência externa. */
  mono?: boolean;
  value: string;
};

/**
 * Dado já conhecido da postagem. É **informação**: não pede ação e não é
 * situação — por isso vem em cinza de rótulo, sem moldura própria.
 */
function ShipmentFact({ icon: Icon, label, mono = false, value }: Readonly<ShipmentFactProps>) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/55">
        <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        {label}
      </p>
      <p
        className={[
          "mt-1 wrap-break-word text-sm text-[#1a1a1a]",
          mono ? "font-mono font-bold tracking-widest" : "font-semibold",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

type ShipmentStatusHeaderProps = {
  /** Posição do pacote na lista, base zero. */
  index: number;
  shipment: VendorOrderShipment;
  /** Quantos pacotes o pedido tem, para o "X de Y". */
  total: number;
};

/**
 * Faixa de situação do pacote: é o que o vendor procura ao abrir a seção, e por
 * isso vem antes de qualquer dado. O rótulo é dito na transportadora do próprio
 * pacote — remessa sem provider é lida como Correios.
 */
function ShipmentStatusHeader({ index, shipment, total }: Readonly<ShipmentStatusHeaderProps>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1a1a1a]/10 bg-[#faf8f2] px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#1a1a1a]">
        {shipment.status === "delivered" ? (
          <CircleCheckBig aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
        ) : (
          <Truck aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
        )}
        {logisticsStatusLabel(shipment.status, shipment.provider)}
      </p>
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/55">
        Pacote {index + 1} de {total}
      </span>
    </div>
  );
}

type ShipmentFactsProps = {
  shipment: VendorOrderShipment;
  /** Serviço do pedido, usado quando a remessa não gravou o próprio. */
  shippingService: string;
};

/**
 * O que já se sabe da postagem. Cada ficha só aparece quando tem valor: campo
 * vazio com rótulo promete um dado que a remessa não tem.
 */
function ShipmentFacts({ shipment, shippingService }: Readonly<ShipmentFactsProps>) {
  const reference =
    shipment.externalReference ||
    shipment.trackingCode ||
    generationStatusLabel(shipment.generationStatus);

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <ShipmentFact
        icon={ScanBarcode}
        label={shipment.provider === "braspress" ? "Pedido Braspress" : "Código de rastreamento"}
        mono
        value={reference}
      />
      <ShipmentFact
        icon={Tag}
        label="Serviço"
        value={shipment.serviceCode || shippingService || "Não informado"}
      />
      {shipment.postedAt ? (
        <ShipmentFact
          icon={CalendarDays}
          label="Postado em"
          value={formatStamp(shipment.postedAt) || shipment.postedAt}
        />
      ) : null}
      {shipment.deliveredAt ? (
        <ShipmentFact
          icon={CircleCheckBig}
          label="Entregue em"
          value={formatStamp(shipment.deliveredAt) || shipment.deliveredAt}
        />
      ) : null}
      {shipment.externalStatus ? (
        <ShipmentFact icon={Truck} label="Status Braspress" value={shipment.externalStatus} />
      ) : null}
    </dl>
  );
}

/**
 * Última ocorrência lida do rastreamento, com local e hora quando existem.
 * Devolve `null` sem ocorrência — a plataforma não inventa evento.
 */
function ShipmentLastEvent({ shipment }: Readonly<{ shipment: VendorOrderShipment }>) {
  if (!shipment.lastEventDescription) return null;

  return (
    <p className="mt-4 flex items-start gap-2 border-t-2 border-[#1a1a1a]/10 pt-3 text-xs leading-5 text-[#231f20]/62">
      <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
      <span>
        {shipment.lastEventDescription}
        {shipment.lastEventLocation ? ` · ${shipment.lastEventLocation}` : ""}
        {shipment.lastEventAt ? ` · ${formatStamp(shipment.lastEventAt)}` : ""}
      </span>
    </p>
  );
}

type ShipmentCorrectionFieldsProps = {
  /** Ação em voo, para o botão dizer "Salvando…" só na correção deste pacote. */
  activeAction: string | null;
  correctionPostedAt: string;
  isBusy: boolean;
  onCorrectionPostedAtChange: (value: string) => void;
  onDiscard: () => void;
  onSave: () => void;
  onTrackingCodeChange: (value: string) => void;
  shipmentId: number;
  trackingCode: string;
};

/**
 * Correção do código de rastreamento de um pacote já registrado.
 *
 * Só abre para remessa manual ainda não entregue; a data da postagem vem
 * preenchida com a original, porque corrigir o código não remarca a postagem.
 */
function ShipmentCorrectionFields({
  activeAction,
  correctionPostedAt,
  isBusy,
  onCorrectionPostedAtChange,
  onDiscard,
  onSave,
  onTrackingCodeChange,
  shipmentId,
  trackingCode,
}: Readonly<ShipmentCorrectionFieldsProps>) {
  return (
    <div className="mt-4 grid gap-3 border-t-2 border-[#1a1a1a]/10 pt-4 sm:grid-cols-2">
      <div>
        <label className={labelClassName} htmlFor={`tracking-${shipmentId}`}>
          Código de rastreamento
        </label>
        <input
          className={`${fieldClassName} mt-2 font-mono uppercase`}
          disabled={isBusy}
          id={`tracking-${shipmentId}`}
          maxLength={13}
          onChange={(event) => onTrackingCodeChange(event.target.value)}
          value={trackingCode}
        />
      </div>
      <div>
        <label className={labelClassName} htmlFor={`posted-${shipmentId}`}>
          Data da postagem
        </label>
        <input
          className={`${fieldClassName} mt-2`}
          disabled={isBusy}
          id={`posted-${shipmentId}`}
          onChange={(event) => onCorrectionPostedAtChange(event.target.value)}
          type="date"
          value={correctionPostedAt}
        />
      </div>
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button className={secondaryButton} disabled={isBusy} onClick={onSave} type="button">
          {activeAction === `edit-${shipmentId}` ? "Salvando…" : "Salvar correção"}
        </button>
        <button
          className="cursor-pointer text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] underline"
          disabled={isBusy}
          onClick={onDiscard}
          type="button"
        >
          Descartar
        </button>
      </div>
    </div>
  );
}

/**
 * Uma escrita de logística, do clique ao feedback.
 *
 * As três escritas do painel — postagem manual, postagem Braspress e correção
 * de código — têm o mesmo corpo: trava de duplo clique, requisição, leitura
 * tolerante do erro do backend e `router.refresh()` só no sucesso. O que muda
 * entre elas é a rota, o corpo e a frase.
 */
type VendorOrderActionsProps = {
  /** Registro manual de S10 ligado no backend. Não vale para pedido Braspress. */
  manualRegistrationEnabled: boolean;
  orderId: number;
  shipments: VendorOrderShipment[];
  /** Transportadora do pedido. Vazio é pedido anterior ao contrato multicarrier. */
  shippingProvider?: string;
  shippingService: string;
  status: VendorOrderStatus;
};

type ShipmentSubmission = {
  actionId: string;
  body: unknown;
  /** Frase usada quando o backend recusa sem mensagem própria. */
  failureMessage: string;
  method: "PATCH" | "POST";
  onSuccess: () => void;
  successMessage: string;
  url: string;
};

/**
 * Postagem e rastreio do pedido.
 *
 * Só logística: as transições de situação vivem em `VendorOrderStatusPanel`,
 * para o vendor ter um lugar só onde o estado do pedido muda. Confirmar o envio
 * aqui é o que projeta `enviado` — a API Papelito não aceita esse status
 * declarado à mão.
 */
export function VendorOrderActions({
  manualRegistrationEnabled,
  orderId,
  shipments,
  shippingProvider = "",
  shippingService,
  status,
}: Readonly<VendorOrderActionsProps>) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [externalOrderNumber, setExternalOrderNumber] = useState("");
  const [postedAt, setPostedAt] = useState(today);
  const [correctionPostedAt, setCorrectionPostedAt] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isBusy = isPending || activeAction !== null;
  const isBraspressOrder = shippingProvider === "braspress";
  const canRegister = status === "em_separacao" && shipments.length === 0;
  const canRegisterManual = canRegister && manualRegistrationEnabled && !isBraspressOrder;
  const canRegisterBraspress = canRegister && isBraspressOrder;

  function isCorrectable(shipment: VendorOrderShipment) {
    return shipment.provider === "manual" && shipment.status !== "delivered";
  }

  function startCorrection(shipment: VendorOrderShipment) {
    setTrackingCode(shipment.trackingCode);
    setCorrectionPostedAt(shipment.postedAt || today());
    setEditing(shipment.id);
  }

  function submitShipment({
    actionId,
    body,
    failureMessage,
    method,
    onSuccess,
    successMessage,
    url,
  }: ShipmentSubmission) {
    if (isBusy) return;
    setActiveAction(actionId);

    startTransition(async () => {
      try {
        const response = await request(url, method, body);
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;

        if (response.ok) {
          onSuccess();
          setFeedback({ error: false, message: successMessage });
          router.refresh();
          return;
        }

        setFeedback({ error: true, message: `⚠ ${payload?.message ?? failureMessage}` });
      } catch {
        setFeedback({ error: true, message: SERVER_UNREACHABLE_MESSAGE });
      } finally {
        setActiveAction(null);
      }
    });
  }

  function review(error: string | null) {
    if (error) {
      setFeedback({ error: true, message: error });
      return;
    }

    setFeedback(null);
    setReviewing(true);
  }

  function confirmShipment() {
    submitShipment({
      actionId: "manual",
      body: {
        postedAt,
        serviceCode: shippingService,
        trackingCode: normalizeTracking(trackingCode),
      },
      failureMessage: "Não foi possível confirmar o envio.",
      method: "POST",
      onSuccess: () => setReviewing(false),
      successMessage: "✓ Envio confirmado e comprador notificado.",
      url: `/api/vendor/orders/${orderId}/shipments/manual`,
    });
  }

  function confirmBraspressShipment() {
    submitShipment({
      actionId: "braspress",
      body: { externalOrderNumber: externalOrderNumber.trim(), postedAt },
      failureMessage: "Não foi possível confirmar a postagem Braspress.",
      method: "POST",
      onSuccess: () => setReviewing(false),
      successMessage:
        "✓ Postagem Braspress confirmada. O rastreio será atualizado pela transportadora.",
      url: `/api/vendor/orders/${orderId}/shipments/braspress`,
    });
  }

  function correctShipment(shipment: VendorOrderShipment) {
    if (isBusy) return;
    if (!isS10(normalizeTracking(trackingCode))) {
      setFeedback({ error: true, message: INVALID_S10_MESSAGE });
      return;
    }

    submitShipment({
      actionId: `edit-${shipment.id}`,
      body: { postedAt: correctionPostedAt, trackingCode: normalizeTracking(trackingCode) },
      failureMessage: "Não foi possível corrigir o rastreamento.",
      method: "PATCH",
      onSuccess: () => setEditing(null),
      successMessage: "✓ Rastreamento corrigido e comprador notificado.",
      url: `/api/vendor/orders/${orderId}/shipments/${shipment.id}`,
    });
  }

  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <h2 className="border-b-2 border-[#1a1a1a] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55">
        Postagem e rastreio
      </h2>

      <div className="px-5 py-5 md:px-6">
        <FeedbackBanner className="mb-4" feedback={feedback} />

        {shipments.length === 0 && !canRegisterManual && !canRegisterBraspress ? (
          <p className="text-sm leading-6 text-[#231f20]/74">
            {status === "aguardando_envio"
              ? "Marque o pedido como separado para liberar o registro da postagem."
              : "Nenhum pacote registrado neste pedido."}
          </p>
        ) : null}

        {shipments.length > 0 ? (
          <ul aria-label="Pacotes do pedido" className="space-y-3">
            {shipments.map((shipment, index) => (
              <li className="border-2 border-[#1a1a1a]/15 bg-white" key={shipment.id}>
                <ShipmentStatusHeader index={index} shipment={shipment} total={shipments.length} />

                <div className="px-4 py-4">
                  <ShipmentFacts shipment={shipment} shippingService={shippingService} />
                  <ShipmentLastEvent shipment={shipment} />

                  {/* AÇÃO: só o que ainda depende do vendor. */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {shipment.labelAvailable ? (
                      <a
                        className={secondaryButton}
                        href={`/api/vendor/orders/${orderId}/shipments/${shipment.id}/label`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <Download aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                        Etiqueta
                      </a>
                    ) : null}

                    {isCorrectable(shipment) && editing !== shipment.id ? (
                      <button
                        className="cursor-pointer text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] underline"
                        onClick={() => startCorrection(shipment)}
                        type="button"
                      >
                        Corrigir código
                      </button>
                    ) : null}
                  </div>

                  {editing === shipment.id ? (
                    <ShipmentCorrectionFields
                      activeAction={activeAction}
                      correctionPostedAt={correctionPostedAt}
                      isBusy={isBusy}
                      onCorrectionPostedAtChange={setCorrectionPostedAt}
                      onDiscard={() => setEditing(null)}
                      onSave={() => correctShipment(shipment)}
                      onTrackingCodeChange={setTrackingCode}
                      shipmentId={shipment.id}
                      trackingCode={trackingCode}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {canRegisterManual ? (
          <section aria-labelledby="manual-shipping-title" className="mt-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]" id="manual-shipping-title">
              Enviar pelos Correios
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#231f20]/74">
              Poste o pacote e informe o código da etiqueta. A confirmação marca o pedido como
              enviado e notifica o comprador.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClassName} htmlFor="manual-tracking">
                  Código de rastreamento
                </label>
                <input
                  className={`${fieldClassName} mt-2 font-mono uppercase`}
                  disabled={isBusy || reviewing}
                  id="manual-tracking"
                  maxLength={13}
                  onChange={(event) => setTrackingCode(event.target.value)}
                  placeholder="AA123456789BR"
                  value={trackingCode}
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="manual-posted-at">
                  Data da postagem
                </label>
                <input
                  className={`${fieldClassName} mt-2`}
                  disabled={isBusy || reviewing}
                  id="manual-posted-at"
                  onChange={(event) => setPostedAt(event.target.value)}
                  type="date"
                  value={postedAt}
                />
              </div>
            </div>

            {reviewing ? (
              <div className="mt-4 border-2 border-[#1a1a1a] bg-white p-4">
                <p className="text-sm text-[#1a1a1a]">
                  Confirme:{" "}
                  <code className="font-mono font-bold">{normalizeTracking(trackingCode)}</code> ·{" "}
                  <span className="tabular-nums">{postedAt}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    className={primaryButton}
                    disabled={isBusy}
                    onClick={confirmShipment}
                    type="button"
                  >
                    <PackageCheck aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                    {activeAction === "manual" ? "Confirmando…" : "Confirmar envio"}
                  </button>
                  <button
                    className={secondaryButton}
                    disabled={isBusy}
                    onClick={() => setReviewing(false)}
                    type="button"
                  >
                    Revisar
                  </button>
                </div>
              </div>
            ) : (
              <button className={`${secondaryButton} mt-4`} disabled={isBusy} onClick={() => review(manualShipmentError(trackingCode, postedAt))} type="button">
                Revisar envio
              </button>
            )}
          </section>
        ) : null}

        {canRegisterBraspress ? (
          <section aria-labelledby="braspress-shipping-title" className="mt-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]" id="braspress-shipping-title">
              Confirmar postagem Braspress
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#231f20]/74">
              Depois de postar, informe o número de pedido confirmado na Braspress. A plataforma acompanha as atualizações no rastreio.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClassName} htmlFor="braspress-order-number">
                  Número de pedido Braspress
                </label>
                <input
                  className={`${fieldClassName} mt-2 font-mono`}
                  disabled={isBusy || reviewing}
                  id="braspress-order-number"
                  maxLength={96}
                  onChange={(event) => setExternalOrderNumber(event.target.value)}
                  placeholder="PED-2026/001"
                  value={externalOrderNumber}
                />
              </div>
              <div>
                <label className={labelClassName} htmlFor="braspress-posted-at">
                  Data da postagem
                </label>
                <input
                  className={`${fieldClassName} mt-2`}
                  disabled={isBusy || reviewing}
                  id="braspress-posted-at"
                  onChange={(event) => setPostedAt(event.target.value)}
                  type="date"
                  value={postedAt}
                />
              </div>
            </div>

            {reviewing ? (
              <div className="mt-4 border-2 border-[#1a1a1a] bg-white p-4">
                <p className="text-sm text-[#1a1a1a]">
                  Confirme: <code className="font-mono font-bold">{externalOrderNumber.trim()}</code> · <span className="tabular-nums">{postedAt}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button className={primaryButton} disabled={isBusy} onClick={confirmBraspressShipment} type="button">
                    <PackageCheck aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                    {activeAction === "braspress" ? "Confirmando…" : "Confirmar postagem"}
                  </button>
                  <button className={secondaryButton} disabled={isBusy} onClick={() => setReviewing(false)} type="button">
                    Revisar
                  </button>
                </div>
              </div>
            ) : (
              <button className={`${secondaryButton} mt-4`} disabled={isBusy} onClick={() => review(braspressShipmentError(externalOrderNumber, postedAt))} type="button">
                Revisar postagem
              </button>
            )}
          </section>
        ) : null}
      </div>
    </section>
  );
}
