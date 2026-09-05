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
 * Data da postagem é gravada só com o dia (`YYYY-MM-DD`); os eventos dos
 * Correios trazem hora e são normalizados para UTC na gravação. Tratar as duas
 * com o mesmo formatador imprimia a data pura de volta em ISO, porque
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

/**
 * Dado já conhecido da postagem. É **informação**: não pede ação e não é
 * situação — por isso vem em cinza de rótulo, sem moldura própria.
 */
function ShipmentFact({
  icon: Icon,
  label,
  mono = false,
  value,
}: {
  icon: typeof Truck;
  label: string;
  mono?: boolean;
  value: string;
}) {
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
  shippingService,
  status,
}: {
  manualRegistrationEnabled: boolean;
  orderId: number;
  shipments: VendorOrderShipment[];
  shippingService: string;
  status: VendorOrderStatus;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [postedAt, setPostedAt] = useState(today);
  const [correctionPostedAt, setCorrectionPostedAt] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isBusy = isPending || activeAction !== null;
  const canRegister = manualRegistrationEnabled && status === "em_separacao" && shipments.length === 0;
  const correctable = shipments.filter(
    (shipment) => shipment.provider === "manual" && shipment.status !== "delivered",
  );

  function request(url: string, method: "PATCH" | "POST", body: unknown) {
    return fetch(url, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method,
    });
  }

  function reviewShipment() {
    if (!isS10(normalizeTracking(trackingCode))) {
      setFeedback({ error: true, message: "⚠ Informe um código S10 válido, como AA123456789BR." });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(postedAt)) {
      setFeedback({ error: true, message: "⚠ Informe a data da postagem." });
      return;
    }
    setFeedback(null);
    setReviewing(true);
  }

  function confirmShipment() {
    if (isBusy) return;
    setActiveAction("manual");

    startTransition(async () => {
      try {
        const response = await request(`/api/vendor/orders/${orderId}/shipments/manual`, "POST", {
          postedAt,
          serviceCode: shippingService,
          trackingCode: normalizeTracking(trackingCode),
        });
        const body = (await response.json().catch(() => null)) as { message?: string } | null;

        if (response.ok) {
          setReviewing(false);
          setFeedback({ error: false, message: "✓ Envio confirmado e comprador notificado." });
          router.refresh();
          return;
        }

        setFeedback({
          error: true,
          message: `⚠ ${body?.message ?? "Não foi possível confirmar o envio."}`,
        });
      } catch {
        setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor." });
      } finally {
        setActiveAction(null);
      }
    });
  }

  function correctShipment(shipment: VendorOrderShipment) {
    if (isBusy) return;
    if (!isS10(normalizeTracking(trackingCode))) {
      setFeedback({ error: true, message: "⚠ Informe um código S10 válido, como AA123456789BR." });
      return;
    }

    setActiveAction(`edit-${shipment.id}`);

    startTransition(async () => {
      try {
        const response = await request(
          `/api/vendor/orders/${orderId}/shipments/${shipment.id}`,
          "PATCH",
          { postedAt: correctionPostedAt, trackingCode: normalizeTracking(trackingCode) },
        );
        const body = (await response.json().catch(() => null)) as { message?: string } | null;

        if (response.ok) {
          setEditing(null);
          setFeedback({ error: false, message: "✓ Rastreamento corrigido e comprador notificado." });
          router.refresh();
          return;
        }

        setFeedback({
          error: true,
          message: `⚠ ${body?.message ?? "Não foi possível corrigir o rastreamento."}`,
        });
      } catch {
        setFeedback({ error: true, message: "⚠ Não foi possível falar com o servidor." });
      } finally {
        setActiveAction(null);
      }
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

        {shipments.length === 0 && !canRegister ? (
          <p className="text-sm leading-6 text-[#231f20]/74">
            {status === "aguardando_envio"
              ? "Marque o pedido como separado para liberar o registro da postagem."
              : "Nenhum pacote registrado neste pedido."}
          </p>
        ) : null}

        {shipments.length > 0 ? (
          <ul aria-label="Pacotes dos Correios" className="space-y-3">
            {shipments.map((shipment, index) => (
              <li className="border-2 border-[#1a1a1a]/15 bg-white" key={shipment.id}>
                {/* STATUS: a situação da entrega vem primeiro e com peso, porque é
                    o que o vendor procura ao abrir a seção. */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1a1a1a]/10 bg-[#faf8f2] px-4 py-3">
                  <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.1em] text-[#1a1a1a]">
                    {shipment.status === "delivered" ? (
                      <CircleCheckBig aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                    ) : (
                      <Truck aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                    )}
                    {logisticsStatusLabel(shipment.status)}
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/55">
                    Pacote {index + 1} de {shipments.length}
                  </span>
                </div>

                <div className="px-4 py-4">
                  {/* INFORMAÇÃO: o que já se sabe da postagem. */}
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <ShipmentFact
                      icon={ScanBarcode}
                      label="Código de rastreamento"
                      mono
                      value={shipment.trackingCode || generationStatusLabel(shipment.generationStatus)}
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
                  </dl>

                  {shipment.lastEventDescription ? (
                    <p className="mt-4 flex items-start gap-2 border-t-2 border-[#1a1a1a]/10 pt-3 text-xs leading-5 text-[#231f20]/62">
                      <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
                      <span>
                        {shipment.lastEventDescription}
                        {shipment.lastEventLocation ? ` · ${shipment.lastEventLocation}` : ""}
                        {shipment.lastEventAt ? ` · ${formatStamp(shipment.lastEventAt)}` : ""}
                      </span>
                    </p>
                  ) : null}

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

                  {correctable.some((entry) => entry.id === shipment.id) && editing !== shipment.id ? (
                    <button
                      className="cursor-pointer text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] underline"
                      onClick={() => {
                        setTrackingCode(shipment.trackingCode);
                        setCorrectionPostedAt(shipment.postedAt || today());
                        setEditing(shipment.id);
                      }}
                      type="button"
                    >
                      Corrigir código
                    </button>
                  ) : null}
                </div>

                {editing === shipment.id ? (
                  <div className="mt-4 grid gap-3 border-t-2 border-[#1a1a1a]/10 pt-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClassName} htmlFor={`tracking-${shipment.id}`}>
                        Código de rastreamento
                      </label>
                      <input
                        className={`${fieldClassName} mt-2 font-mono uppercase`}
                        disabled={isBusy}
                        id={`tracking-${shipment.id}`}
                        maxLength={13}
                        onChange={(event) => setTrackingCode(event.target.value)}
                        value={trackingCode}
                      />
                    </div>
                    <div>
                      <label className={labelClassName} htmlFor={`posted-${shipment.id}`}>
                        Data da postagem
                      </label>
                      <input
                        className={`${fieldClassName} mt-2`}
                        disabled={isBusy}
                        id={`posted-${shipment.id}`}
                        onChange={(event) => setCorrectionPostedAt(event.target.value)}
                        type="date"
                        value={correctionPostedAt}
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 sm:col-span-2">
                      <button
                        className={secondaryButton}
                        disabled={isBusy}
                        onClick={() => correctShipment(shipment)}
                        type="button"
                      >
                        {activeAction === `edit-${shipment.id}` ? "Salvando…" : "Salvar correção"}
                      </button>
                      <button
                        className="cursor-pointer text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] underline"
                        disabled={isBusy}
                        onClick={() => setEditing(null)}
                        type="button"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {canRegister ? (
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
              <button className={`${secondaryButton} mt-4`} disabled={isBusy} onClick={reviewShipment} type="button">
                Revisar envio
              </button>
            )}
          </section>
        ) : null}
      </div>
    </section>
  );
}
