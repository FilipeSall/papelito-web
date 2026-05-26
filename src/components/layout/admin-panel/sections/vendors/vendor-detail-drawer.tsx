import Link from "next/link";
import { X } from "lucide-react";

import { VendorActions } from "./vendor-actions";
import { VendorStatusBadge } from "./vendor-status";

import type { AdminVendorDetail, AdminVendorRowStatus } from "@/lib/server/admin-vendors";

function formatDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return value || "—";
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function normalizeStatus(value: string): AdminVendorRowStatus {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }
  return "none";
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
        {label}
      </span>
      <span className="text-sm leading-6 text-[#231f20]">{value || "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3
        className="text-xs font-semibold uppercase tracking-[0.22em] text-[#231f20]/72"
        style={{ fontFamily: "var(--font-admin-mono)" }}
      >
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function VendorDetailDrawer({
  closeHref,
  vendor,
}: {
  closeHref: string;
  vendor: AdminVendorDetail;
}) {
  const status = normalizeStatus(vendor.status);
  const fullName = `${vendor.firstName} ${vendor.lastName}`.trim() || vendor.name;
  const coverage = vendor.minCepRanges.length
    ? vendor.minCepRanges.map((min, index) => {
        const max = vendor.maxCepRanges[index] ?? "";
        return `${formatCep(min)} → ${formatCep(max)}`;
      })
    : [];

  return (
    <div
      aria-modal="true"
      aria-labelledby="vendor-drawer-title"
      role="dialog"
      className="fixed inset-0 z-50 flex"
    >
      <Link
        aria-label="Fechar detalhes"
        href={closeHref}
        scroll={false}
        className="flex-1 bg-black/40"
      />
      <div className="relative ml-auto flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[#231f20]/10 px-6 py-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
                Triagem #{vendor.id}
              </p>
              <VendorStatusBadge status={status} />
            </div>
            <h2
              id="vendor-drawer-title"
              className="text-2xl font-semibold leading-tight text-[#231f20]"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              {vendor.storeName || fullName || vendor.email || `Vendor #${vendor.id}`}
            </h2>
            <p className="text-sm text-[#231f20]/64">
              Solicitacao recebida em {formatDate(vendor.submittedAt || vendor.registeredAt)}
            </p>
          </div>
          <Link
            aria-label="Fechar"
            href={closeHref}
            scroll={false}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#231f20] transition hover:bg-[#f6f1da]"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </Link>
        </header>

        <div className="flex-1 space-y-8 px-6 py-6">
          <Section title="Responsavel">
            <DetailRow label="Nome" value={fullName} />
            <DetailRow
              label="Email"
              value={
                vendor.email ? (
                  <a href={`mailto:${vendor.email}`} className="text-[#231f20] underline">
                    {vendor.email}
                  </a>
                ) : null
              }
            />
            <DetailRow label="Telefone" value={vendor.phoneNumber} />
            <DetailRow label="CNPJ" value={vendor.cnpj} />
          </Section>

          <Section title="Loja">
            <DetailRow label="Nome da loja" value={vendor.storeName} />
            <DetailRow
              label="Instagram"
              value={vendor.instagram ? `@${vendor.instagram.replace(/^@/, "")}` : ""}
            />
            <DetailRow label="Como conheceu a Papelito" value={vendor.discoveryChannel} />
            <DetailRow
              label="Ja vendia Papelito?"
              value={
                vendor.hasSoldPapelito === "sim"
                  ? "Sim"
                  : vendor.hasSoldPapelito === "nao"
                    ? "Nao"
                    : vendor.hasSoldPapelito
              }
            />
          </Section>

          <Section title="Cobertura">
            <DetailRow label="Cidade / Estado" value={`${vendor.city} / ${vendor.state}`.trim()} />
            <DetailRow label="CEP base" value={formatCep(vendor.cep)} />
            <div className="sm:col-span-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
                Faixas atendidas
              </span>
              {coverage.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm font-mono text-[#231f20]">
                  {coverage.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#231f20]/56">Sem faixas definidas.</p>
              )}
            </div>
          </Section>

          <Section title="Triagem">
            <DetailRow label="Enviada em" value={formatDate(vendor.submittedAt)} />
            <DetailRow
              label="Decisao em"
              value={vendor.reviewedAt ? formatDate(vendor.reviewedAt) : ""}
            />
            <DetailRow label="Decidida por" value={vendor.reviewedBy?.name} />
            {status === "rejected" && vendor.rejectionReason ? (
              <div className="sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
                  Motivo da recusa
                </span>
                <p className="mt-2 rounded-xl border border-[#d7b0aa] bg-[#fef3f1] px-3 py-2 text-sm leading-6 text-[#7a3428]">
                  {vendor.rejectionReason}
                </p>
              </div>
            ) : null}
          </Section>
        </div>

        <footer className="sticky bottom-0 border-t border-[#231f20]/10 bg-white px-6 py-4">
          <VendorActions
            email={vendor.email}
            firstName={vendor.firstName}
            status={vendor.status}
            storeName={vendor.storeName}
            vendorId={vendor.id}
          />
        </footer>
      </div>
    </div>
  );
}
