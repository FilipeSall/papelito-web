import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { AdminCompanyDetail } from "@/lib/server/admin-companies";

import { CompactTable, EmptyStateCard, FOCUS_RING, HardPanel, Panel } from "../../primitives";

import { AccountStatusActions } from "./account-status-actions";
import { AccountStatusChip, CompanyStatusChip, EntityMark, OwnershipStatusChip } from "./status-chip";
import {
  ACCOUNTS_PATH,
  companyDisplayName,
  formatCnpj,
  formatDateTime,
  membershipRoleLabel,
  membershipStatusLabel,
  personHref,
} from "./accounts-config";

function sectionTitle(title: string) {
  return (
    <div className="border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-5 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/48">{title}</p>
    </div>
  );
}

function DataRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid gap-4 px-5 py-5 md:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/52">
            {label}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-[#231f20]">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CompanyDetailPage({ detail }: { detail: AdminCompanyDetail }) {
  const { company, events, members } = detail;
  const isSuspended = company.companyStatus === "suspended";
  const address = company.fiscalAddress;
  const addressLine = [
    [address.street, address.number].filter(Boolean).join(", "),
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(" / "),
    address.cep,
  ]
    .filter(Boolean)
    .join(" · ");

  const statusEvents = events
    .filter((event) => event.action === "company_suspended" || event.action === "company_reactivated")
    .map((event) => ({
      action: event.action === "company_suspended" ? "suspend" : "reactivate",
      actorName: event.actorName,
      actorUserId: event.actorUserId,
      createdAt: event.createdAt,
      reason: event.reason,
    }));

  const latestSuspension = statusEvents.find((event) => event.action === "suspend");

  const memberRows = members.map((member) => [
    <div className="space-y-1" key={`member-${member.userId}`}>
      <Link
        className={["block font-semibold text-[#231f20] hover:underline", FOCUS_RING].join(" ")}
        href={personHref(member.userId)}
      >
        {member.name || `Usuário #${member.userId}`}
      </Link>
      <p className="text-xs text-[#231f20]/58">{member.email}</p>
    </div>,
    <span className="text-sm text-[#231f20]" key={`role-${member.userId}`}>
      {membershipRoleLabel(member.role)}
    </span>,
    <span className="text-sm text-[#231f20]/72" key={`status-${member.userId}`}>
      {membershipStatusLabel(member.status)}
    </span>,
    <div className="flex flex-wrap items-center gap-2" key={`flags-${member.userId}`}>
      {member.isVendor ? <EntityMark kind="vendor" label="Vendor" /> : null}
      <AccountStatusChip status={member.accountStatus} />
    </div>,
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className={[
            "inline-flex items-center gap-2 border-2 border-[#1a1a1a] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow",
            FOCUS_RING,
          ].join(" ")}
          href={`${ACCOUNTS_PATH}?tab=empresas`}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Voltar para contas
        </Link>
      </div>

      <HardPanel accent="yellow">
        <div className="space-y-4 px-5 py-5 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/52">
                Empresa compradora
              </p>
              <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">
                {companyDisplayName(company)}
              </h1>
              <p className="mt-1 font-mono text-sm text-[#231f20]/64">{formatCnpj(company.cnpj)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CompanyStatusChip status={company.companyStatus} />
              <OwnershipStatusChip status={company.ownershipStatus} />
            </div>
          </div>
        </div>
      </HardPanel>

      <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
        {sectionTitle("estado comercial")}
        <div className="px-5 py-5">
          <AccountStatusActions
            accountStatus={isSuspended ? "suspended" : "active"}
            canReactivate={isSuspended}
            canSuspend={company.companyStatus === "active"}
            reactivateEndpoint={`/api/admin/companies/${company.id}/reactivate`}
            statusHistory={statusEvents}
            subjectLabel="Empresa"
            subjectName={companyDisplayName(company)}
            suspendBlockedReason={
              company.companyStatus === "active" || isSuspended
                ? ""
                : "Só empresas ativas podem ser suspensas por aqui."
            }
            suspendEndpoint={`/api/admin/companies/${company.id}/suspend`}
            suspension={
              isSuspended && latestSuspension
                ? {
                    actorName: latestSuspension.actorName,
                    actorUserId: latestSuspension.actorUserId,
                    at: latestSuspension.createdAt,
                    reason: latestSuspension.reason,
                  }
                : null
            }
          />
        </div>
      </Panel>

      <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
        {sectionTitle("dados cadastrais")}
        <DataRows
          rows={[
            ["Razão social", company.legalName],
            ["Nome fantasia", company.tradeName ?? ""],
            ["E-mail de faturamento", company.billingEmail],
            [
              "E-mail confirmado",
              company.billingEmailVerifiedAt ? formatDateTime(company.billingEmailVerifiedAt) : "Não confirmado",
            ],
            ["Telefone", company.phone],
            ["Situação cadastral", company.registryStatus],
            ["Endereço fiscal", addressLine],
            ["Criada em", formatDateTime(company.createdAt)],
          ]}
        />
      </Panel>

      <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
        {sectionTitle(`membros (${members.length})`)}
        {members.length === 0 ? (
          <div className="px-5 py-5">
            <EmptyStateCard
              body="Nenhuma pessoa vinculada a esta empresa."
              label="Sem membros"
              title="Empresa sem vínculos"
            />
          </div>
        ) : (
          <CompactTable headers={["pessoa", "papel", "vínculo", "conta"]} rows={memberRows} />
        )}
      </Panel>

      {company.rejectionReason ? (
        <p className="border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3 text-sm font-semibold text-[#7a3428]">
          Motivo da reprovação: {company.rejectionReason}
        </p>
      ) : null}
    </div>
  );
}
