"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { VendorOrderShipment, VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";

import { VendorCancelShipmentModal } from "./vendor-cancel-shipment-modal";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isS10(value: string) {
  return /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(value.replace(/\s+/g, "").toUpperCase());
}

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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [postedAt, setPostedAt] = useState(today);
  const [correctionPostedAt, setCorrectionPostedAt] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || activeAction !== null;
  const canSeparate = status === "aguardando_envio";
  const canRegister = manualRegistrationEnabled && status === "em_separacao" && shipments.length === 0;

  function request(url: string, method: "POST" | "PATCH" | "PUT", body?: unknown) {
    return fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  function updateStatus(target: VendorOrderStatus, reason?: string) {
    setActiveAction("status");
    startTransition(async () => {
      try {
        const response = await request(`/api/vendor/orders/${orderId}/status`, "PUT", reason ? { status: target, reason } : { status: target });
        const body = await response.json().catch(() => null) as { message?: string } | null;
        setFeedback(response.ok ? "Status atualizado." : body?.message ?? "Não foi possível atualizar o status.");
        if (response.ok) router.refresh();
      } finally { setActiveAction(null); }
    });
  }

  function reviewShipment() {
    const normalized = trackingCode.replace(/\s+/g, "").toUpperCase();
    if (!isS10(normalized)) {
      setFeedback("Informe um código S10 válido, como AA123456789BR.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(postedAt)) {
      setFeedback("Informe a data da postagem.");
      return;
    }
    setFeedback(null);
    setReviewing(true);
  }

  function confirmShipment() {
    const normalized = trackingCode.replace(/\s+/g, "").toUpperCase();
    setActiveAction("manual");
    startTransition(async () => {
      try {
        const response = await request(`/api/vendor/orders/${orderId}/shipments/manual`, "POST", { trackingCode: normalized, serviceCode: shippingService, postedAt });
        const body = await response.json().catch(() => null) as { message?: string } | null;
        setFeedback(response.ok ? "Envio confirmado e cliente notificado." : body?.message ?? "Não foi possível confirmar o envio.");
        if (response.ok) { setReviewing(false); router.refresh(); }
      } finally { setActiveAction(null); }
    });
  }

  function correctShipment(shipment: VendorOrderShipment) {
    const normalized = trackingCode.replace(/\s+/g, "").toUpperCase();
    if (!isS10(normalized)) { setFeedback("Informe um código S10 válido, como AA123456789BR."); return; }
    setActiveAction(`edit-${shipment.id}`);
    startTransition(async () => {
      try {
        const response = await request(`/api/vendor/orders/${orderId}/shipments/${shipment.id}`, "PATCH", { trackingCode: normalized, postedAt: correctionPostedAt });
        const body = await response.json().catch(() => null) as { message?: string } | null;
        setFeedback(response.ok ? "Rastreamento corrigido e cliente notificado." : body?.message ?? "Não foi possível corrigir o rastreamento.");
        if (response.ok) { setEditing(null); router.refresh(); }
      } finally { setActiveAction(null); }
    });
  }

  return (
    <div className="mt-5 border-t border-brand-dark/10 pt-5">
      {feedback ? <p className="mb-4 rounded-xl border border-brand-dark/15 bg-bg-light px-4 py-3 text-sm text-brand-dark" role="alert">{feedback}</p> : null}
      {canSeparate ? <button className="cursor-pointer rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-yellow disabled:opacity-50" disabled={isBusy} onClick={() => updateStatus("em_separacao")} type="button">{isBusy ? "Atualizando..." : "Marcar como separado"}</button> : null}
      {canRegister ? <section className="rounded-xl border border-brand-dark/15 bg-brand-dark/3 p-4" aria-labelledby="manual-shipping-title">
        <h3 className="text-sm font-bold text-brand-dark" id="manual-shipping-title">Enviar pelos Correios</h3>
        <p className="mt-2 text-sm text-brand-dark/70">Poste o pacote nos Correios e, em seguida, informe o código da etiqueta ou comprovante. A confirmação marca o pedido como enviado.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-brand-dark/60">Código de rastreamento<input className="mt-2 w-full rounded-xl border border-brand-dark/20 bg-white px-4 py-3 font-mono text-sm uppercase" disabled={isBusy || reviewing} maxLength={13} onChange={(event) => setTrackingCode(event.target.value)} placeholder="AA123456789BR" value={trackingCode} /></label>
          <label className="text-xs font-semibold uppercase tracking-widest text-brand-dark/60">Data da postagem<input className="mt-2 w-full rounded-xl border border-brand-dark/20 bg-white px-4 py-3 text-sm" disabled={isBusy || reviewing} onChange={(event) => setPostedAt(event.target.value)} type="date" value={postedAt} /></label>
        </div>
        {reviewing ? <div className="mt-4 rounded-xl bg-white p-4 text-sm text-brand-dark"><p>Confirme: <code className="font-bold">{trackingCode.replace(/\s+/g, "").toUpperCase()}</code> · {postedAt}</p><div className="mt-3 flex gap-3"><button className="rounded-full bg-brand-dark px-4 py-2 text-xs font-bold uppercase text-brand-yellow disabled:opacity-50" disabled={isBusy} onClick={confirmShipment} type="button">{activeAction === "manual" ? "Confirmando..." : "Confirmar envio"}</button><button className="rounded-full px-4 py-2 text-xs font-bold uppercase" disabled={isBusy} onClick={() => setReviewing(false)} type="button">Revisar</button></div></div> : <button className="mt-4 rounded-full border border-brand-dark px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-dark disabled:opacity-50" disabled={isBusy} onClick={reviewShipment} type="button">Revisar envio</button>}
      </section> : null}
      {shipments.filter((shipment) => shipment.provider === "manual" && shipment.status !== "delivered").map((shipment) => <section className="mt-4 rounded-xl border border-brand-dark/15 p-4" key={shipment.id}><p className="text-sm font-bold text-brand-dark">Rastreamento informado: <code>{shipment.trackingCode}</code></p>{editing === shipment.id ? <div className="mt-3 flex flex-wrap gap-3"><input className="rounded-xl border border-brand-dark/20 px-3 py-2 font-mono uppercase" onChange={(event) => setTrackingCode(event.target.value)} value={trackingCode} /><input className="rounded-xl border border-brand-dark/20 px-3 py-2" onChange={(event) => setCorrectionPostedAt(event.target.value)} type="date" value={correctionPostedAt} /><button className="rounded-full border border-brand-dark px-4 py-2 text-xs font-bold uppercase" disabled={isBusy} onClick={() => correctShipment(shipment)} type="button">Salvar correção</button></div> : <button className="mt-3 text-xs font-bold uppercase underline" onClick={() => { setTrackingCode(shipment.trackingCode); setCorrectionPostedAt(shipment.postedAt || today()); setEditing(shipment.id); }} type="button">Corrigir código</button>}</section>)}
      {(status === "aguardando_envio" || status === "em_separacao") && shipments.length === 0 ? <button className="mt-4 block rounded-full border border-red-700 px-5 py-3 text-xs font-bold uppercase text-red-700" onClick={() => setIsModalOpen(true)} type="button">Cancelar envio</button> : null}
      <VendorCancelShipmentModal errorMessage={null} isSubmitting={isBusy} onClose={() => setIsModalOpen(false)} onConfirm={(reason) => updateStatus("cancelado", reason)} open={isModalOpen} />
    </div>
  );
}
