import Link from "next/link";

import type {
  AdminOwnerApplications,
  AdminUserDetail,
  AdminUserRelatedOrder,
} from "@/lib/server/admin-users";
import type { AdminUserFilterRole } from "@/lib/server/admin-users-filters";
import { buildAdminUsersQuery } from "@/lib/server/admin-users-filters";

import { CompactTable, EmptyStateCard, MetricCard, Panel, StatusBadge } from "../../primitives";

import { UserRoleBadge, UserStatusBadge } from "./user-badges";
import { UserOrderActionButton } from "./user-order-action-button";
import { UserRoleActions } from "./user-role-actions";
import { CompanyOwnerReviewTab } from "./company-owner-review-tab";

export type UserDetailTabKey = "company-review" | "orders" | "overview" | "role" | "sales";

export type UserDetailOrigin = {
  page: number;
  role: AdminUserFilterRole;
  search: string;
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
      role: origin.role,
      search: origin.search,
    },
    {},
  );

  return query ? `/admin/users?${query}` : "/admin/users";
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
  if (overrides.tab && overrides.tab !== "overview") {
    params.set("tab", overrides.tab);
  }

  return params.toString() ? `/admin/users/${userId}?${params.toString()}` : `/admin/users/${userId}`;
}

function detailRows(detail: AdminUserDetail) {
  return [
    ["Nome", detail.name || detail.displayName || "—"],
    ["Email", detail.email || "—"],
    ["Telefone", detail.phoneNumber || "—"],
    ["Loja", detail.storeName || "—"],
    ["CNPJ", detail.cnpj || "—"],
    ["Instagram", detail.instagram || "—"],
    ["Cadastro", formatDateTime(detail.registeredAt)],
    ["Cidade", [detail.city, detail.state].filter(Boolean).join(" / ") || "—"],
    ["CEP", detail.cep || "—"],
    [
      "Endereço",
      [detail.street, detail.number, detail.complement, detail.neighborhood].filter(Boolean).join(", ") || "—",
    ],
  ];
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
    order.isCancelled ? (
      <div key={`action-${order.id}`} className="space-y-1 text-xs text-[#7a3428]">
        <p className="font-semibold uppercase tracking-[0.12em]">Cancelado</p>
        {order.cancelReason ? <p>{order.cancelReason}</p> : null}
      </div>
    ) : user.availableActions.canCancelOrders ? (
      <UserOrderActionButton
        key={`action-${order.id}`}
        orderId={order.id}
        relationshipLabel={order.relationshipLabel}
        userId={user.id}
      />
    ) : (
      <span key={`action-${order.id}`} className="text-xs text-[#231f20]/46">
        —
      </span>
    ),
  ]);
}

export function UserDetailPage({
  activeTab,
  ownerApplications,
  origin,
  user,
}: {
  activeTab: UserDetailTabKey;
  ownerApplications: AdminOwnerApplications;
  origin: UserDetailOrigin;
  user: AdminUserDetail;
}) {
  const fullName =
    user.name ||
    `${user.firstName} ${user.lastName}`.trim() ||
    user.storeName ||
    user.email ||
    `Usuário #${user.id}`;
  const tabs: Array<{ key: UserDetailTabKey; label: string }> = [
    { key: "overview", label: "Visão geral" },
    { key: "orders", label: "Pedidos" },
    { key: "sales", label: "Vendas" },
    { key: "company-review", label: "Análise empresarial" },
    { key: "role", label: "Role / ações" },
  ];
  const hasPendingOwnerReview =
    ownerApplications.current?.application.status === "pending_manual_review";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Link
            className="inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[#231f20]/62 underline"
            href={buildBackHref(origin)}
          >
            Voltar para usuários
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              Usuário #{user.id}
            </p>
            <UserRoleBadge label={user.roleLabel || "Outro"} />
            <UserStatusBadge label={user.accountStatusLabel || "Ativa"} />
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

        <div className="flex flex-wrap gap-2">
          <a
            className="inline-flex h-11 items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-brand-yellow"
            href={`mailto:${user.email}`}
          >
            Enviar email
          </a>
          {user.availableActions.canUseVendorRedirect ? (
            <Link
              className="inline-flex h-11 items-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500]"
              href={`/admin/vendors?create=1&sourceUserId=${user.id}`}
            >
              Criar vendor
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          detail="Pedidos/compras do usuário como customer"
          label="Pedidos"
          value={String(user.metrics.ordersCount).padStart(2, "0")}
        />
        <MetricCard
          detail="Vendas operacionais como vendor"
          label="Vendas"
          value={String(user.metrics.salesCount).padStart(2, "0")}
        />
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

      <nav aria-label="Abas do usuário" className="-mx-1 flex flex-wrap items-center gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              className={[
                "inline-flex items-center gap-2 border-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition",
                isActive
                  ? "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500]"
                  : "border-[#1a1a1a] bg-white text-[#1a1a1a] hover:bg-brand-yellow",
              ].join(" ")}
              href={buildDetailHref(user.id, origin, { tab: tab.key })}
            >
              {tab.label}
              {tab.key === "company-review" && hasPendingOwnerReview ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#a7412e] px-1 text-[10px] text-white">
                  1
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {activeTab === "overview" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Panel className="rounded-none border-2 border-[#1a1a1a] px-5 py-5 shadow-[8px_8px_0px_#1a1a1a]">
            {sectionTitle("Conta e dados basicos")}
            <dl className="grid gap-3 md:grid-cols-2">
              {detailRows(user).map(([label, value]) => (
                <div key={label} className="border-2 border-[#1a1a1a] bg-white px-3 py-3">
                  <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/50">
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

            {user.vendorData ? (
              <Panel className="rounded-none border-2 border-[#1a1a1a] px-5 py-5 shadow-[8px_8px_0px_#1a1a1a]">
                {sectionTitle("Snapshot vendor")}
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/12 pb-3">
                    <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">Loja</dt>
                    <dd>{user.vendorData.storeName || user.vendorData.name || "—"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/12 pb-3">
                    <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">Status</dt>
                    <dd>{user.vendorData.status || "—"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[#1a1a1a]/12 pb-3">
                    <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">Faixas</dt>
                    <dd>{user.vendorData.minCepRanges.length}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">Última revisão</dt>
                    <dd>{formatDateTime(user.vendorData.reviewedAt)}</dd>
                  </div>
                </dl>
              </Panel>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "orders" ? (
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
      ) : null}

      {activeTab === "sales" ? (
        user.recentSales.length > 0 ? (
          <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
            <div className="border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-5 py-4">
              {sectionTitle("Vendas como vendor")}
            </div>
            <CompactTable
              headers={["pedido", "contexto", "status", "total", "ação"]}
              rows={ordersTableRows({ orders: user.recentSales, user })}
            />
          </Panel>
        ) : (
          <EmptyStateCard
            body="Esta conta ainda não possui vendas recentes no fluxo operacional do marketplace."
            label="Vendas"
            title="Sem vendas recentes"
          />
        )
      ) : null}

      {activeTab === "company-review" ? (
        <CompanyOwnerReviewTab initialData={ownerApplications} />
      ) : null}

      {activeTab === "role" ? (
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
      ) : null}
    </div>
  );
}
