"use client";

import Image from "next/image";
import { useState } from "react";

import { ConfirmModal } from "@/components/ui";
import type {
  AdminOwnerApplicationDetail,
  AdminOwnerApplications,
} from "@/lib/server/admin-users";

const STATUS_LABELS: Record<string, string> = {
  document_required: "Aguardando documento",
  pending_manual_review: "Aguardando revisão",
  auto_approved: "Aprovada automaticamente",
  approved: "Aprovada",
  rejected: "Reprovada",
};

const EVIDENCE_LABELS: Record<string, string> = {
  qsa_available: "QSA disponível",
  qsa_sufficient: "QSA suficiente",
  cpf_mask_match: "CPF mascarado confere",
  name_match: "Nome confere",
  age_band_match: "Faixa etária confere",
  mei_confirmed: "MEI confirmado",
  provider: "Fonte da consulta",
  checked_at: "Consulta realizada em",
};

function formatEvidenceLabel(key: string) {
  return EVIDENCE_LABELS[key] ?? key.replaceAll("_", " ");
}

function formatEvidenceValue(value: unknown) {
  if (value === "unknown") return "Não informado pela consulta";
  if (value === true) return "Sim";
  if (value === false) return "Não";
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  try {
    return JSON.stringify(value) || "—";
  } catch {
    return "Dados não disponíveis";
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const date = new Date(hasTimezone ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).format(date);
  const day = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
  return `${time}, ${day}`;
}

function formatBytes(value: number | null) {
  if (!value) return "—";
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function DataCard({ label, value }: Readonly<{ label: string; value: unknown }>) {
  const text = formatEvidenceValue(value);
  return (
    <div className="border-2 border-[#1a1a1a] bg-white p-3">
      <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/48">
        {label}
      </dt>
      <dd className="mt-2 wrap-break-word text-sm text-[#1a1a1a]">{text || "—"}</dd>
    </div>
  );
}

function DocumentViewer({ mime, url }: Readonly<{ mime: string | null; url: string }>) {
  const [zoom, setZoom] = useState(100);
  const isImage = mime?.startsWith("image/") ?? false;
  const zoomIn = () => setZoom((current) => Math.min(200, current + 25));
  const zoomOut = () => setZoom((current) => Math.max(50, current - 25));

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2" aria-label="Controles de zoom do documento">
        <button
          aria-label="Diminuir zoom"
          className="inline-flex h-9 min-w-9 items-center justify-center border-2 border-[#1a1a1a] bg-white px-3 text-lg font-black hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-40"
          disabled={zoom <= 50}
          onClick={zoomOut}
          type="button"
        >
          −
        </button>
        <button
          aria-label="Restaurar zoom"
          className="h-9 border-2 border-[#1a1a1a] bg-white px-3 text-[10px] font-black uppercase tracking-[0.16em] hover:bg-brand-yellow"
          onClick={() => setZoom(100)}
          type="button"
        >
          {zoom}%
        </button>
        <button
          aria-label="Aumentar zoom"
          className="inline-flex h-9 min-w-9 items-center justify-center border-2 border-[#1a1a1a] bg-white px-3 text-lg font-black hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-40"
          disabled={zoom >= 200}
          onClick={zoomIn}
          type="button"
        >
          +
        </button>
      </div>

      <div className="h-140 overflow-auto border-2 border-[#1a1a1a] bg-[#f2f2f2]">
        {isImage ? (
          <Image
            alt="Documento privado da candidatura"
            className="block max-w-none"
            height={1000}
            src={url}
            style={{ minWidth: "100%", width: `${zoom}%` }}
            unoptimized
            width={1000}
          />
        ) : (
          <iframe
            className="h-full w-full bg-[#f2f2f2]"
            src={`${url}#zoom=${zoom}`}
            title="Documento privado da candidatura"
          />
        )}
      </div>
    </div>
  );
}

function ApplicationHistory({ items }: Readonly<{ items: AdminOwnerApplicationDetail[] }>) {
  return (
    <section className="border-2 border-[#1a1a1a] bg-white p-5 shadow-[8px_8px_0px_#1a1a1a]">
      <h2 className="text-xs font-black uppercase tracking-[0.2em]">Histórico de candidaturas</h2>
      <div className="mt-4 space-y-3">
        {items.map(({ application }) => (
          <article
            key={application.applicationId}
            className="grid gap-2 border-2 border-[#1a1a1a] bg-[#faf8f2] p-4 text-sm md:grid-cols-[1fr_auto]"
          >
            <div>
              <p className="font-black uppercase tracking-[0.12em]">
                Tentativa {application.attemptNumber} · {STATUS_LABELS[application.status] ?? application.status}
              </p>
              <p className="mt-1 text-xs text-[#1a1a1a]/60">
                Envio: {formatDate(application.submittedAt)} · decisão: {formatDate(application.decidedAt)}
              </p>
              {application.rejectionReason ? (
                <p className="mt-3 border-l-4 border-[#a7412e] pl-3 text-xs leading-5 text-[#6f2d22]">
                  <strong>Motivo interno:</strong> {application.rejectionReason}
                </p>
              ) : null}
            </div>
            <span className="h-fit border-2 border-[#1a1a1a] bg-white px-2 py-1 text-[10px] font-black uppercase">
              #{application.applicationId}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CompanyApplicationReview({
  initialData,
  apiBasePath = "/api/admin/owner-applications",
}: Readonly<{ initialData: AdminOwnerApplications; apiBasePath?: string }>) {

  const [data, setData] = useState(initialData);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const current = data.current;

  function requestDecision(action: "approve" | "reject") {
    if (current?.application.status !== "pending_manual_review") return;
    if (action === "reject" && !reason.trim()) {
      setMessage("Informe o motivo interno da reprovação.");
      return;
    }

    setPendingAction(action);
  }

  async function decide(action: "approve" | "reject") {
    if (current?.application.status !== "pending_manual_review") return;

    setPendingAction(null);
    setBusy(true);
    setMessage(null);
    const response = await fetch(
      `${apiBasePath}/${encodeURIComponent(String(current.application.applicationId))}/${action}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "reject" ? { reason: reason.trim() } : {}),
      },
    );
    const body = (await response.json().catch(() => null)) as
      | AdminOwnerApplicationDetail
      | { message?: string }
      | null;
    if (!response.ok || !body || !("application" in body)) {
      setMessage(
        (body as { message?: string } | null)?.message ??
          (response.status === 409
            ? "Esta candidatura já foi decidida por outro administrador."
            : "Não foi possível registrar a decisão."),
      );
      setBusy(false);
      return;
    }

    setData((previous) => ({
      current: body,
      history: previous.history.map((item) =>
        item.application.applicationId === body.application.applicationId ? body : item,
      ),
    }));
    setReason("");
    setMessage(action === "approve" ? "Candidatura aprovada." : "Candidatura reprovada e encerrada.");
    setBusy(false);
  }

  if (!current) {
    return (
      <section className="border-2 border-[#1a1a1a] bg-white p-6 shadow-[8px_8px_0px_#1a1a1a]">
        <p className="text-xs font-black uppercase tracking-[0.2em]">Análise empresarial</p>
        <h2 className="mt-2 text-2xl font-black uppercase">Nenhuma candidatura</h2>
        <p className="mt-3 text-sm text-[#1a1a1a]/65">
          Este usuário ainda não iniciou uma candidatura como titular de empresa.
        </p>
      </section>
    );
  }

  const { application, company, evidence, person } = current;
  const canDecide = application.status === "pending_manual_review";
  const documentUrl = `${apiBasePath}/${encodeURIComponent(String(application.applicationId))}/document`;

  return (
    <div className="space-y-5">
      <section className="border-2 border-[#1a1a1a] bg-brand-yellow p-5 shadow-[8px_8px_0px_#1a1a1a]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">
              Tentativa {application.attemptNumber}
            </p>
            <h2 className="mt-1 text-2xl font-black uppercase">
              {STATUS_LABELS[application.status] ?? application.status}
            </h2>
          </div>
          <span className="border-2 border-[#1a1a1a] bg-white px-3 py-2 text-xs font-black uppercase">
            Candidatura #{application.applicationId}
          </span>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="border-2 border-[#1a1a1a] bg-white p-5 shadow-[8px_8px_0px_#1a1a1a]">
          <h3 className="text-xs font-black uppercase tracking-[0.2em]">Dados informados</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <DataCard label="Nome completo" value={person.fullName} />
            <DataCard label="CPF" value={person.cpf} />
            <DataCard label="Data de nascimento" value={person.birthDate} />
            <DataCard label="Telefone" value={person.phone} />
            <DataCard label="E-mail" value={person.email} />
            <DataCard label="CNPJ" value={company.cnpj} />
            <DataCard label="Razão social" value={company.legalName} />
            <DataCard label="Nome fantasia" value={company.tradeName} />
            <DataCard
              label="Endereço fiscal"
              value={[
                company.fiscalAddress.street,
                company.fiscalAddress.number,
                company.fiscalAddress.neighborhood,
                company.fiscalAddress.city,
                company.fiscalAddress.state,
                company.fiscalAddress.cep,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <DataCard label="Fonte / consulta" value={`${company.providerSource ?? "—"} · ${formatDate(company.providerCheckedAt)}`} />
          </dl>

          <h3 className="mt-6 text-xs font-black uppercase tracking-[0.2em]">
            Evidências automáticas
          </h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(evidence).map(([key, value]) => (
              <DataCard key={key} label={formatEvidenceLabel(key)} value={value} />
            ))}
          </dl>
        </section>

        <section className="border-2 border-[#1a1a1a] bg-white p-5 shadow-[8px_8px_0px_#1a1a1a]">
          <h3 className="text-xs font-black uppercase tracking-[0.2em]">Documento privado</h3>
          <p className="mt-2 text-xs text-[#1a1a1a]/58">
            {application.fileName ?? "Nome removido após a decisão"} · {application.documentMime ?? "—"} ·{" "}
            {formatBytes(application.documentSize)}
          </p>
          {application.documentAvailable ? (
            <>
              <DocumentViewer mime={application.documentMime} url={documentUrl} />
              <a
                href={documentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex border-2 border-[#1a1a1a] bg-white px-3 py-2 text-xs font-black uppercase hover:bg-brand-yellow"
              >
                Abrir em nova aba
              </a>
            </>
          ) : (
            <p className="mt-5 border-2 border-[#1a1a1a] bg-[#faf8f2] p-4 text-sm">
              O documento não está disponível. Arquivos são eliminados após uma decisão terminal.
            </p>
          )}
        </section>
      </div>

      {canDecide ? (
        <section className="border-2 border-[#1a1a1a] bg-white p-5 shadow-[8px_8px_0px_#1a1a1a]">
          <h3 className="text-xs font-black uppercase tracking-[0.2em]">Decisão administrativa</h3>
          <label className="mt-4 block">
            <span className="text-xs font-black uppercase tracking-[0.16em]">
              Motivo interno da reprovação
            </span>
            <textarea
              value={reason}
              maxLength={500}
              disabled={busy}
              onChange={(event) => setReason(event.currentTarget.value)}
              className="mt-2 min-h-28 w-full border-2 border-[#1a1a1a] p-3 text-sm outline-none focus:shadow-[4px_4px_0px_#ffe500]"
              placeholder="Obrigatório somente para reprovar. Este texto não será enviado ao usuário."
            />
            <span className="mt-1 block text-right text-[10px] text-[#1a1a1a]/50">
              {reason.length}/500
            </span>
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => requestDecision("approve")}
              className="border-2 border-[#1a1a1a] bg-brand-yellow px-5 py-3 text-xs font-black uppercase disabled:opacity-50"
            >
              Aprovar cadastro
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => requestDecision("reject")}
              className="border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-3 text-xs font-black uppercase text-white disabled:opacity-50"
            >
              Reprovar e encerrar
            </button>
          </div>
        </section>
      ) : null}

      {message ? (
        <output className="block border-2 border-[#1a1a1a] bg-white p-4 text-sm font-bold">
          {message}
        </output>
      ) : null}

      <ApplicationHistory items={data.history} />

      <ConfirmModal
        confirmLabel="Aprovar cadastro"
        description="A empresa passa a comprar pelo marketplace e o titular recebe o aviso de aprovação."
        isSubmitting={busy}
        open={pendingAction === "approve"}
        title="Confirmar aprovação"
        onClose={() => setPendingAction(null)}
        onConfirm={() => void decide("approve")}
      />

      <ConfirmModal
        confirmLabel="Reprovar e encerrar"
        description="A reprovação é terminal: o usuário só volta a comprar iniciando uma nova candidatura do zero."
        isSubmitting={busy}
        open={pendingAction === "reject"}
        title="Confirmar reprovação"
        tone="danger"
        onClose={() => setPendingAction(null)}
        onConfirm={() => void decide("reject")}
      />
    </div>
  );
}
