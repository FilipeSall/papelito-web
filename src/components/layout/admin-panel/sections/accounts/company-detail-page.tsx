import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileDigit,
  Mail,
  MailCheck,
  MapPin,
  Phone,
  ScrollText,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { AdminCompanyDetail, AdminCompanyMember } from "@/lib/server/admin-companies";

import { CompactTable, EmptyStateCard, FOCUS_RING, HardPanel, Panel } from "../../primitives";
import type { StatusTone } from "../../primitives";

import { AccountStatusActions } from "./account-status-actions";
import {
  AccountStatusChip,
  CompanyStatusChip,
  companyStatusTone,
  EntityMark,
  OwnershipStatusChip,
} from "./status-chip";
import {
  ACCOUNTS_PATH,
  companyDisplayName,
  companyStatusLabel,
  formatCnpj,
  formatDateTime,
  membershipRoleLabel,
  membershipStatusLabel,
  personHref,
  registryStatusLabel,
} from "./accounts-config";

const TONE_BAND: Record<StatusTone, string> = {
  critical: "bg-[#c0392b]",
  neutral: "bg-[#1a1a1a]",
  pending: "bg-[#e0b400]",
  positive: "bg-brand-yellow",
};

const TONE_NOTE: Record<StatusTone, string> = {
  critical: "border-[#c0392b] bg-[#c0392b]/10 text-[#7a3428]",
  neutral: "border-[#1a1a1a] bg-white text-[#231f20]",
  pending: "border-[#1a1a1a] bg-[#fdf6d8] text-[#231f20]",
  positive: "border-[#1a1a1a] bg-brand-yellow/25 text-[#231f20]",
};

const STATUS_NOTE: Record<string, string> = {
  active: "Empresa liberada para comprar pela plataforma.",
  archived: "Empresa arquivada. Não aparece mais nos fluxos de compra.",
  onboarding: "Cadastro em andamento. A compra só abre depois da titularidade verificada.",
  suspended: "Empresa suspensa. Nenhum membro compra em nome dela enquanto durar a suspensão.",
};

type DataRow = { icon: LucideIcon; label: string; value: string };

function sectionTitle(title: string, Icon: LucideIcon) {
  return (
    <div className="flex items-center gap-2 border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-5 py-4">
      <Icon aria-hidden className="h-4 w-4 shrink-0 text-[#231f20]/70" strokeWidth={2.2} />
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/48">{title}</p>
    </div>
  );
}

function DataRows({ rows }: { rows: DataRow[] }) {
  return (
    <dl className="grid gap-4 px-5 py-5 md:grid-cols-2">
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label}>
          <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/52">
            <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
            {label}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-[#231f20]">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Responsável pela empresa: o titular vinculado, sem segunda fonte de verdade.
 *
 * `ownerUserId` é a coluna canônica; a lista de membros só entra para resolver nome e e-mail, e a
 * membership `owner` cobre a empresa ainda sem titularidade aprovada.
 */
function resolveOwner(
  ownerUserId: number | null,
  members: AdminCompanyMember[],
): AdminCompanyMember | null {
  if (ownerUserId) {
    const owner = members.find((member) => member.userId === ownerUserId);
    if (owner) return owner;
  }

  return members.find((member) => member.role === "owner") ?? null;
}

export function CompanyDetailPage({ detail }: { detail: AdminCompanyDetail }) {
  const { company, events, members } = detail;
  const isSuspended = company.companyStatus === "suspended";
  const tone = companyStatusTone(company.companyStatus);
  const owner = resolveOwner(company.ownerUserId, members);
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

      <HardPanel>
        <div aria-hidden className={["h-2 w-full shrink-0", TONE_BAND[tone]].join(" ")} />
        <div className="space-y-4 px-5 py-5 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#1a1a1a]">
                <Building2 aria-hidden className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/52">
                  Empresa compradora · #{company.id}
                </p>
                <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">
                  {companyDisplayName(company)}
                </h1>
                {company.tradeName?.trim() && company.legalName.trim() ? (
                  <p className="mt-1 text-sm leading-6 text-[#231f20]/64">{company.legalName}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CompanyStatusChip status={company.companyStatus} />
              <OwnershipStatusChip status={company.ownershipStatus} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 border-2 border-[#1a1a1a] bg-white px-3 py-2">
              <FileDigit aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.2} />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/52">
                CNPJ
              </span>
              <span className="font-mono text-sm text-[#231f20]">{formatCnpj(company.cnpj)}</span>
            </span>
          </div>

          <p
            className={[
              "border-2 px-4 py-3 text-sm font-semibold leading-6",
              TONE_NOTE[tone],
            ].join(" ")}
          >
            {companyStatusLabel(company.companyStatus)} ·{" "}
            {STATUS_NOTE[company.companyStatus] ?? "Situação sem regra operacional própria."}
          </p>
        </div>
      </HardPanel>

      <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
        {sectionTitle("estado comercial", ShieldCheck)}
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

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
          {sectionTitle("identificação da empresa", FileDigit)}
          <DataRows
            rows={[
              { icon: FileDigit, label: "CNPJ", value: formatCnpj(company.cnpj) },
              { icon: ScrollText, label: "Razão social", value: company.legalName },
              { icon: Building2, label: "Nome fantasia", value: company.tradeName ?? "" },
              {
                icon: ShieldCheck,
                label: "Situação cadastral",
                value: registryStatusLabel(company.registryStatus),
              },
            ]}
          />
        </Panel>

        <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
          {sectionTitle("responsável", UserRound)}
          {owner ? (
            <div className="space-y-4 px-5 py-5">
              <div className="flex items-start gap-3">
                <EntityMark kind="person" label="Responsável" />
                <div className="min-w-0">
                  <Link
                    className={[
                      "block font-black uppercase tracking-tight text-[#231f20] hover:underline",
                      FOCUS_RING,
                    ].join(" ")}
                    href={personHref(owner.userId)}
                  >
                    {owner.name || `Usuário #${owner.userId}`}
                  </Link>
                  <p className="mt-1 text-sm text-[#231f20]/64">{owner.email}</p>
                </div>
              </div>
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/52">
                    <UserRound aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                    Papel
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-[#231f20]">
                    {membershipRoleLabel(owner.role)}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/52">
                    <Users aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                    Vínculo
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-[#231f20]">
                    {membershipStatusLabel(owner.status)}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-center gap-2">
                <AccountStatusChip status={owner.accountStatus} />
                {company.ownerUserId ? null : (
                  <span className="text-xs leading-6 text-[#231f20]/64">
                    Titularidade ainda não aprovada.
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="px-5 py-5">
              <EmptyStateCard
                body="Nenhum titular vinculado a esta empresa até agora."
                label="Sem responsável"
                title="Empresa sem titular"
              />
            </div>
          )}
        </Panel>
      </div>

      <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
        {sectionTitle("dados cadastrais", ScrollText)}
        <DataRows
          rows={[
            { icon: Mail, label: "E-mail de faturamento", value: company.billingEmail },
            {
              icon: MailCheck,
              label: "E-mail confirmado",
              value: company.billingEmailVerifiedAt
                ? formatDateTime(company.billingEmailVerifiedAt)
                : "Não confirmado",
            },
            { icon: Phone, label: "Telefone", value: company.phone },
            { icon: MapPin, label: "Endereço fiscal", value: addressLine },
            { icon: CalendarDays, label: "Criada em", value: formatDateTime(company.createdAt) },
          ]}
        />
      </Panel>

      <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
        {sectionTitle(`membros (${members.length})`, Users)}
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
