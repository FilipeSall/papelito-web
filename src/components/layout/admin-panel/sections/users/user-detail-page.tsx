import Link from "next/link";
import {
  AtSign,
  Building2,
  CalendarDays,
  FileDigit,
  Mail,
  MapPin,
  Phone,
  Signpost,
  Store,
  User,
  type LucideIcon,
} from "lucide-react";

import type {
  AdminOwnerApplications,
  AdminUserDetail,
  AdminUserRelatedOrder,
} from "@/lib/server/admin-users";
import type { AdminVendorIntegrations } from "@/lib/server/admin-vendor-integrations";
import type {
  AdminUserFilterRelation,
  AdminUserFilterRole,
  AdminUserFilterStatus,
} from "@/lib/server/admin-users-filters";
import { buildAdminUsersQuery } from "@/lib/server/admin-users-filters";

import { CompactTable, EmptyStateCard, FOCUS_RING, MetricCard, Panel, StatusBadge } from "../../primitives";

import { VendorIntegrationsPanel } from "./integrations/vendor-integrations-panel";
import { UserRoleBadge } from "./user-badges";
import { UserOrderActionButton } from "./user-order-action-button";
import { UserRoleActions } from "./user-role-actions";
import { CompanyApplicationReview } from "../company-application-review";
import { VendorEditLauncher } from "../vendors/vendor-edit/vendor-edit-launcher";
import { AccountStatusActions } from "../accounts/account-status-actions";
import { AccountStatusChip } from "../accounts/status-chip";
import {
  ACCOUNTS_PATH,
  companyHref,
  formatCnpj,
  membershipRoleLabel,
  membershipStatusLabel,
} from "../accounts/accounts-config";

export type UserDetailTabKey =
  | "company-review"
  | "conta"
  | "integrations"
  | "orders"
  | "overview"
  | "role"
  | "sales";

export type UserDetailOrigin = {
  page: number;
  relation: AdminUserFilterRelation;
  role: AdminUserFilterRole;
  search: string;
  status: AdminUserFilterStatus;
};

function sectionTitle(title: string) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" aria-hidden="true" />
      <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">{title}</h3>
    </div>
  );
}

function formatDateTime(value: string) {
  if (!value) return "—";

  const parsed = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function buildBackHref(origin: UserDetailOrigin) {
  const query = buildAdminUsersQuery(
    {
      page: origin.page,
      perPage: 20,
      relation: origin.relation,
      role: origin.role,
      search: origin.search,
      status: origin.status,
    },
    {},
  );

  return query ? `${ACCOUNTS_PATH}?${query}` : ACCOUNTS_PATH;
}

function buildDetailHref(
  userId: number,
  origin: UserDetailOrigin,
  overrides: Partial<{ tab: UserDetailTabKey }>,
) {
  const params = new URLSearchParams();

  if (origin.page > 1) {
    params.set("originPage", String(origin.page));
  }
  if (origin.search) {
    params.set("originSearch", origin.search);
  }
  if (origin.role !== "all") {
    params.set("originRole", origin.role);
  }
  if (origin.status !== "all") {
    params.set("originStatus", origin.status);
  }
  if (origin.relation !== "all") {
    params.set("originRelation", origin.relation);
  }
  if (overrides.tab && overrides.tab !== "overview") {
    params.set("tab", overrides.tab);
  }

  return params.toString()
    ? `${ACCOUNTS_PATH}/${userId}?${params.toString()}`
    : `${ACCOUNTS_PATH}/${userId}`;
}

type DetailRow = { icon: LucideIcon; label: string; value: string };

function detailRows(detail: AdminUserDetail): DetailRow[] {
  const primaryCompany = detail.companies[0];
  const rows: DetailRow[] = [
    { icon: User, label: "Nome", value: detail.name || detail.displayName || "—" },
    { icon: Mail, label: "Email", value: detail.email || "—" },
    { icon: Phone, label: "Telefone", value: detail.phoneNumber || "—" },
    { icon: FileDigit, label: "CNPJ", value: detail.cnpj ? formatCnpj(detail.cnpj) : "—" },
  ];

  if (primaryCompany) {
    rows.push({
      icon: Building2,
      label: "Empresa",
      value: primaryCompany.tradeName || primaryCompany.legalName || "—",
    });
  }

  if (detail.isVendor || detail.storeName) {
    rows.push({ icon: Store, label: "Loja", value: detail.storeName || "—" });
  }

  rows.push(
    { icon: AtSign, label: "Instagram", value: detail.instagram || "—" },
    { icon: CalendarDays, label: "Cadastro", value: formatDateTime(detail.registeredAt) },
    {
      icon: MapPin,
      label: "Cidade",
      value: [detail.city, detail.state].filter(Boolean).join(" / ") || "—",
    },
    { icon: Signpost, label: "CEP", value: detail.cep || "—" },
    {
      icon: MapPin,
      label: "Endereço",
      value:
        [detail.street, detail.number, detail.complement, detail.neighborhood]
          .filter(Boolean)
          .join(", ") || "—",
    },
  );

  return rows;
}

function orderStatusLabel(order: AdminUserRelatedOrder) {
  if (order.isCancelled) {
    return "Cancelado";
  }

  if (order.vendorStatus) {
    return order.vendorStatus.replaceAll("_", " ");
  }

  return order.status.replaceAll("_", " ") || "Em análise";
}

function OrderActionCell({
  order,
  user,
}: Readonly<{ order: AdminUserRelatedOrder; user: AdminUserDetail }>) {
  if (order.isCancelled) {
    return (
      <div className="space-y-1 text-xs text-[#7a3428]">
        <p className="font-semibold uppercase tracking-[0.12em]">Cancelado</p>
        {order.cancelReason ? <p>{order.cancelReason}</p> : null}
      </div>
    );
  }

  if (user.availableActions.canCancelOrders && order.canCancel) {
    return (
      <UserOrderActionButton
        orderId={order.id}
        relationshipLabel={order.relationshipLabel}
        userId={user.id}
      />
    );
  }

  return <span className="text-xs text-[#231f20]/46">—</span>;
}

function ordersTableRows({
  orders,
  user,
}: {
  orders: AdminUserRelatedOrder[];
  user: AdminUserDetail;
}) {
  return orders.map((order) => [
    <div key={`order-${order.id}`} className="space-y-1">
      <p className="font-semibold text-[#231f20]">#{order.orderNumber || order.id}</p>
      <p className="text-xs text-[#231f20]/56">{formatDateTime(order.createdAt)}</p>
    </div>,
    <div key={`meta-${order.id}`} className="space-y-1 text-xs text-[#231f20]/66">
      <p>{order.relationshipLabel}</p>
      <p>{order.itemsLabel || `${order.itemsCount} itens`}</p>
      {order.customerName ? <p>Cliente: {order.customerName}</p> : null}
    </div>,
    <StatusBadge key={`status-${order.id}`} label={orderStatusLabel(order)} />,
    <div key={`total-${order.id}`} className="space-y-1 text-xs uppercase tracking-[0.12em] text-[#231f20]/66">
      <p>{formatCurrency(order.total)}</p>
      <p>{order.itemsCount} itens</p>
    </div>,
    <OrderActionCell key={`action-${order.id}`} order={order} user={user} />,
  ]);
}

type UserDetailTab = { key: UserDetailTabKey; label: string };

function UserDetailHeader({
  fullName,
  origin,
  user,
}: Readonly<{ fullName: string; origin: UserDetailOrigin; user: AdminUserDetail }>) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-3">
        <Link
          className="inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[#231f20]/62 underline"
          href={buildBackHref(origin)}
        >
          Voltar para contas
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
            Usuário #{user.id}
          </p>
          <UserRoleBadge label={user.roleLabel || "Outro"} />
          <AccountStatusChip fallbackLabel={user.accountStatusLabel} status={user.accountStatus} />
        </div>

        <div>
          <h1 className="text-3xl font-black uppercase leading-tight tracking-tight text-[#231f20]">
            {fullName}
          </h1>
          <p className="mt-2 text-sm text-[#231f20]/64">
            {user.email} · conta criada em {formatDateTime(user.registeredAt)}
          </p>
        </div>
      </div>

      <UserDetailHeaderActions fullName={fullName} user={user} />
    </div>
  );
}

function UserDetailHeaderActions({
  fullName,
  user,
}: Readonly<{ fullName: string; user: AdminUserDetail }>) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        className="inline-flex h-11 items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-brand-yellow"
        href={`mailto:${user.email}`}
      >
        Enviar email
      </a>
      {user.isVendor ? (
        <>
          <Link
            className={[
              "inline-flex h-11 items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-brand-yellow",
              FOCUS_RING,
            ].join(" ")}
            href={`/admin/vendors/${user.id}`}
          >
            Painel do vendor
          </Link>
          <VendorEditLauncher vendorId={user.id} vendorName={fullName} />
        </>
      ) : null}
      {user.availableActions.canUseVendorRedirect ? (
        <Link
          className="inline-flex h-11 items-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500]"
          href={`${ACCOUNTS_PATH}?create=1&sourceUserId=${user.id}`}
        >
          Criar vendor
        </Link>
      ) : null}
    </div>
  );
}

function UserMetrics({ user }: Readonly<{ user: AdminUserDetail }>) {
  return (
    <div
      className={[
        "grid gap-4 md:grid-cols-2",
        user.isVendor ? "xl:grid-cols-5" : "xl:grid-cols-4",
      ].join(" ")}
    >
      <MetricCard
        detail="Pedidos/compras do usuário como customer"
        label="Pedidos"
        value={String(user.metrics.ordersCount).padStart(2, "0")}
      />
      {user.isVendor ? (
        <MetricCard
          detail="Vendas operacionais como vendor"
          label="Vendas"
          value={String(user.metrics.salesCount).padStart(2, "0")}
        />
      ) : null}
      <MetricCard
        detail="Quantidade bruta de favoritos"
        label="Favoritos"
        value={String(user.metrics.favoritesCount).padStart(2, "0")}
      />
      <MetricCard
        detail="Contagem bruta de tickets"
        label="Tickets"
        value={String(user.metrics.supportTicketsCount).padStart(2, "0")}
      />
      <MetricCard
        detail="Pedidos já cancelados operacionalmente"
        label="Cancelados"
        tone={user.metrics.cancelledOrdersCount > 0 ? "warning" : "default"}
        value={String(user.metrics.cancelledOrdersCount).padStart(2, "0")}
      />
    </div>
  );
}

function UserTabLink({
  hasPendingOwnerReview,
  href,
  isActive,
  tab,
}: Readonly<{
  hasPendingOwnerReview: boolean;
  href: string;
  isActive: boolean;
  tab: UserDetailTab;
}>) {
  return (
    <Link
      className={[
        "inline-flex items-center gap-2 border-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition",
        isActive
          ? "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500]"
          : "border-[#1a1a1a] bg-white text-[#1a1a1a] hover:bg-brand-yellow",
      ].join(" ")}
      href={href}
    >
      {tab.label}
      {tab.key === "company-review" && hasPendingOwnerReview ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#a7412e] px-1 text-[10px] text-white">
          1
        </span>
      ) : null}
    </Link>
  );
}

function UserTabsNav({
  currentTab,
  hasPendingOwnerReview,
  origin,
  tabs,
  userId,
}: Readonly<{
  currentTab: UserDetailTabKey;
  hasPendingOwnerReview: boolean;
  origin: UserDetailOrigin;
  tabs: UserDetailTab[];
  userId: number;
}>) {
  return (
    <nav aria-label="Abas do usuário" className="-mx-1 flex flex-wrap items-center gap-1">
      {tabs.map((tab) => (
        <UserTabLink
          key={tab.key}
          hasPendingOwnerReview={hasPendingOwnerReview}
          href={buildDetailHref(userId, origin, { tab: tab.key })}
          isActive={currentTab === tab.key}
          tab={tab}
        />
      ))}
    </nav>
  );
}

function OverviewTab({ user }: Readonly<{ user: AdminUserDetail }>) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <Panel className="rounded-none border-2 border-[#1a1a1a] px-5 py-5 shadow-[8px_8px_0px_#1a1a1a]">
        {sectionTitle("Conta e dados basicos")}
        <dl className="grid gap-3 md:grid-cols-2">
          {detailRows(user).map(({ icon: Icon, label, value }) => (
            <div key={label} className="border-2 border-[#1a1a1a] bg-white px-3 py-3">
              <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/50">
                <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                {label}
              </dt>
              <dd className="mt-2 text-sm leading-6 text-[#1a1a1a]">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <div className="space-y-5">
        <Panel className="rounded-none border-2 border-[#1a1a1a] px-5 py-5 shadow-[8px_8px_0px_#1a1a1a]">
          {sectionTitle("Permissões e flags")}
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/12 pb-3">
              <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">Role atual</dt>
              <dd>{user.roleLabel || user.role}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/12 pb-3">
              <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">Roles WP</dt>
              <dd>{user.roles.join(", ") || "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/12 pb-3">
              <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">Status da conta</dt>
              <dd>{user.accountStatusLabel || "Ativa"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/12 pb-3">
              <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">Email</dt>
              <dd>{user.emailVerificationStatus || "legacy/verified"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">É vendor</dt>
              <dd>{user.isVendor ? "sim" : "nao"}</dd>
            </div>
          </dl>
        </Panel>

        {user.vendorData ? <VendorSnapshotPanel vendorData={user.vendorData} /> : null}
      </div>
    </div>
  );
}

function VendorSnapshotPanel({
  vendorData,
}: Readonly<{ vendorData: NonNullable<AdminUserDetail["vendorData"]> }>) {
  return (
    <Panel className="rounded-none border-2 border-[#1a1a1a] px-5 py-5 shadow-[8px_8px_0px_#1a1a1a]">
      {sectionTitle("Snapshot vendor")}
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/12 pb-3">
          <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">Loja</dt>
          <dd>{vendorData.storeName || vendorData.name || "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/12 pb-3">
          <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">Status</dt>
          <dd>{vendorData.status || "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/12 pb-3">
          <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">Faixas</dt>
          <dd>{vendorData.minCepRanges.length}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">Última revisão</dt>
          <dd>{formatDateTime(vendorData.reviewedAt)}</dd>
        </div>
      </dl>
    </Panel>
  );
}

function OrdersTab({ user }: Readonly<{ user: AdminUserDetail }>) {
  return (
    <div className="space-y-5">
      {user.recentPurchases.length > 0 ? (
        <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
          <div className="border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-5 py-4">
            {sectionTitle("Pedidos como customer")}
          </div>
          <CompactTable
            headers={["pedido", "contexto", "status", "total", "ação"]}
            rows={ordersTableRows({ orders: user.recentPurchases, user })}
          />
        </Panel>
      ) : (
        <EmptyStateCard
          body="Nenhum pedido recente encontrado para esta conta como customer."
          label="Pedidos"
          title="Sem compras recentes"
        />
      )}

      {user.cancelledOrders.length > 0 ? (
        <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
          <div className="border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-5 py-4">
            {sectionTitle("Cancelamentos recentes")}
          </div>
          <CompactTable
            headers={["pedido", "contexto", "status", "total", "motivo"]}
            rows={user.cancelledOrders.map((order) => [
              <span key={`cancel-order-${order.id}`} className="font-semibold text-[#231f20]">
                #{order.orderNumber || order.id}
              </span>,
              <div key={`cancel-meta-${order.id}`} className="space-y-1 text-xs text-[#231f20]/66">
                <p>{order.relationshipLabel}</p>
                <p>{formatDateTime(order.createdAt)}</p>
              </div>,
              <StatusBadge key={`cancel-status-${order.id}`} label="Cancelado" />,
              <span key={`cancel-total-${order.id}`} className="text-xs uppercase tracking-[0.12em] text-[#231f20]/66">
                {formatCurrency(order.total)}
              </span>,
              <span key={`cancel-reason-${order.id}`} className="text-xs text-[#7a3428]">
                {order.cancelReason || "Sem justificativa registrada."}
              </span>,
            ])}
          />
        </Panel>
      ) : null}
    </div>
  );
}

function SalesTab({ user }: Readonly<{ user: AdminUserDetail }>) {
  if (user.recentSales.length === 0) {
    return (
      <EmptyStateCard
        body="Esta conta ainda não possui vendas recentes no fluxo operacional do marketplace."
        label="Vendas"
        title="Sem vendas recentes"
      />
    );
  }

  return (
    <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
      <div className="border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-5 py-4">
        {sectionTitle("Vendas como vendor")}
      </div>
      <CompactTable
        headers={["pedido", "contexto", "status", "total", "ação"]}
        rows={ordersTableRows({ orders: user.recentSales, user })}
      />
    </Panel>
  );
}

function CompaniesPanelBody({ user }: Readonly<{ user: AdminUserDetail }>) {
  if (user.companies.length === 0) {
    return (
      <p className="text-sm leading-6 text-[#231f20]/68">
        {user.availableActions.currentRole === "administrator"
          ? "Conta da equipe Papelito. Administrador não compra em nome de empresa nenhuma — é quem aprova as dos outros."
          : "Esta pessoa não participa de nenhuma empresa. Sem vínculo ativo ela não compra pela plataforma."}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {user.companies.map((membership) => (
        <li className="border-2 border-[#1a1a1a] bg-white px-4 py-3" key={membership.companyId}>
          <Link
            className={[
              "block font-black uppercase tracking-tight text-[#231f20] hover:underline",
              FOCUS_RING,
            ].join(" ")}
            href={companyHref(membership.companyId)}
          >
            {membership.tradeName || membership.legalName}
          </Link>
          <p className="mt-1 font-mono text-xs text-[#231f20]/58">
            {formatCnpj(membership.cnpj)}
          </p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/58">
            {membershipRoleLabel(membership.membershipRole)} ·{" "}
            {membershipStatusLabel(membership.membershipStatus)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function AccountTab({
  fullName,
  user,
}: Readonly<{ fullName: string; user: AdminUserDetail }>) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Panel className="rounded-none border-2 border-[#1a1a1a] px-5 py-5 shadow-[8px_8px_0px_#1a1a1a]">
        {sectionTitle("Situacao da conta")}
        <AccountStatusActions
          accountStatus={user.accountStatus === "suspended" ? "suspended" : "active"}
          canReactivate={user.availableActions.canReactivate}
          canSuspend={user.availableActions.canSuspend}
          reactivateEndpoint={`/api/admin/users/${user.id}/reactivate`}
          statusHistory={user.statusHistory}
          subjectLabel="Conta"
          subjectName={fullName}
          suspendBlockedReason={user.availableActions.suspendBlockedReason}
          suspendEndpoint={`/api/admin/users/${user.id}/suspend`}
          suspension={user.accountSuspension}
        />
      </Panel>

      <Panel className="rounded-none border-2 border-[#1a1a1a] px-5 py-5 shadow-[8px_8px_0px_#1a1a1a]">
        {sectionTitle("Empresas vinculadas")}
        <CompaniesPanelBody user={user} />
      </Panel>
    </div>
  );
}

function RoleTab({ fullName, user }: Readonly<{ fullName: string; user: AdminUserDetail }>) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Panel className="rounded-none border-2 border-[#1a1a1a] px-5 py-5 shadow-[8px_8px_0px_#1a1a1a]">
        {sectionTitle("Transicoes de role")}
        <UserRoleActions
          availableActions={user.availableActions}
          emailVerificationStatus={user.emailVerificationStatus}
          userId={user.id}
          userName={fullName}
        />
      </Panel>

      <Panel className="rounded-none border-2 border-[#1a1a1a] px-5 py-5 shadow-[8px_8px_0px_#1a1a1a]">
        {sectionTitle("Notas operacionais")}
        <div className="space-y-3 text-sm leading-6 text-[#231f20]/72">
          <p>
            Cancelamentos nesta área usam somente o fluxo operacional já existente: status do
            vendor como <strong>cancelado</strong> com justificativa.
          </p>
          <p>
            Não ha refund financeiro WooCommerce/Pagar.me nesta v1. O foco aqui e leitura
            administrativa, triagem e transicoes coerentes de role.
          </p>
          <p>
            Favoritos e tickets aparecem apenas como contadores brutos para evitar abrir um
            segundo painel de suporte dentro desta tela.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function userFullName(user: AdminUserDetail): string {
  return (
    user.name ||
    `${user.firstName} ${user.lastName}`.trim() ||
    user.storeName ||
    user.email ||
    `Usuário #${user.id}`
  );
}

function userDetailTabs(user: AdminUserDetail): UserDetailTab[] {
  return [
    { key: "overview", label: "Visão geral" },
    { key: "conta", label: "Conta" },
    { key: "orders", label: "Pedidos" },
    ...(user.isVendor ? ([{ key: "sales", label: "Vendas" }] as const) : []),
    { key: "company-review", label: "Análise empresarial" },
    ...(user.isVendor ? ([{ key: "integrations", label: "Integrações" }] as const) : []),
    { key: "role", label: "Role / ações" },
  ];
}

export function UserDetailPage({
  activeTab,
  integrations,
  ownerApplications,
  origin,
  user,
}: Readonly<{
  activeTab: UserDetailTabKey;
  integrations: AdminVendorIntegrations | null;
  ownerApplications: AdminOwnerApplications;
  origin: UserDetailOrigin;
  user: AdminUserDetail;
}>) {
  const fullName = userFullName(user);
  const tabs = userDetailTabs(user);
  const vendorOnlyTab = activeTab === "integrations" || activeTab === "sales";
  const currentTab: UserDetailTabKey = vendorOnlyTab && !user.isVendor ? "overview" : activeTab;
  const hasPendingOwnerReview =
    ownerApplications.current?.application.status === "pending_manual_review";

  return (
    <div className="space-y-5">
      <UserDetailHeader fullName={fullName} origin={origin} user={user} />

      <UserMetrics user={user} />

      <UserTabsNav
        currentTab={currentTab}
        hasPendingOwnerReview={hasPendingOwnerReview}
        origin={origin}
        tabs={tabs}
        userId={user.id}
      />

      {currentTab === "overview" ? <OverviewTab user={user} /> : null}

      {currentTab === "orders" ? <OrdersTab user={user} /> : null}

      {currentTab === "sales" ? <SalesTab user={user} /> : null}

      {currentTab === "company-review" ? (
        <CompanyApplicationReview initialData={ownerApplications} />
      ) : null}

      {currentTab === "integrations" && integrations ? (
        <Panel className="rounded-none border-2 border-[#1a1a1a] px-5 py-5 shadow-[8px_8px_0px_#1a1a1a]">
          {sectionTitle("Integrações externas")}
          <VendorIntegrationsPanel
            integrations={integrations}
            vendorId={user.id}
            vendorName={fullName}
          />
        </Panel>
      ) : null}

      {currentTab === "conta" ? <AccountTab fullName={fullName} user={user} /> : null}

      {currentTab === "role" ? <RoleTab fullName={fullName} user={user} /> : null}
    </div>
  );
}
