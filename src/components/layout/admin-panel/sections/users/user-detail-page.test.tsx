import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AdminOwnerApplications, AdminUserDetail } from "@/lib/server/admin-users";

import { UserDetailPage, type UserDetailOrigin } from "./user-detail-page";

const origin: UserDetailOrigin = {
  page: 1,
  relation: "all",
  role: "all",
  search: "",
  status: "all",
};

const ownerApplications: AdminOwnerApplications = { current: null, history: [] };

function buildUser(overrides: Partial<AdminUserDetail> = {}): AdminUserDetail {
  return {
    accountStatus: "active",
    accountStatusLabel: "Ativa",
    accountSuspension: null,
    availableActions: {
      canCancelOrders: true,
      canConvertSellerToCustomer: false,
      canDemoteAdministrator: false,
      canPromoteToAdministrator: false,
      canReactivate: false,
      canSuspend: true,
      canUseVendorRedirect: false,
      currentRole: "customer",
      isSelf: false,
      suspendBlockedCode: "",
      suspendBlockedReason: "",
    },
    cancelledOrders: [],
    cep: "71200030",
    city: "Brasília",
    cnpj: "99999003000148",
    companies: [
      {
        cnpj: "99999003000148",
        companyId: 21,
        companyStatus: "active",
        legalName: "CERRADO PAPEIS E SUPRIMENTOS LTDA",
        membershipRole: "owner",
        membershipStatus: "active",
        ownershipStatus: "verified",
        tradeName: "CERRADO PAPEIS",
      },
    ],
    complement: "apt",
    displayName: "Marcos Stub de Oliveira",
    email: "user1@test.com",
    emailVerificationStatus: "verified",
    firstName: "Marcos",
    id: 2271,
    instagram: "",
    isVendor: false,
    lastName: "Stub de Oliveira",
    metrics: {
      cancelledOrdersCount: 1,
      favoritesCount: 1,
      ordersCount: 4,
      purchasesCount: 4,
      salesCount: 0,
      supportTicketsCount: 0,
    },
    name: "Marcos Stub de Oliveira",
    neighborhood: "Zona Industrial (Guará)",
    number: "108",
    phoneNumber: "(61) 4002-8922",
    recentPurchases: [],
    recentSales: [],
    registeredAt: "2026-08-31 21:17:00",
    role: "customer",
    roleLabel: "Customer",
    roles: ["customer"],
    state: "DF",
    statusHistory: [],
    storeName: "",
    street: "Trecho SIA Trecho 3",
    vendorData: null,
    ...overrides,
  };
}

describe("detalhe administrativo da conta", () => {
  it("mostra telefone, CNPJ mascarado e endereço vindos do vínculo empresarial", () => {
    render(
      <UserDetailPage
        activeTab="overview"
        origin={origin}
        ownerApplications={ownerApplications}
        user={buildUser()}
      />,
    );

    expect(screen.getByText("(61) 4002-8922")).toBeInTheDocument();
    expect(screen.getByText("99.999.003/0001-48")).toBeInTheDocument();
    expect(screen.getByText("CERRADO PAPEIS")).toBeInTheDocument();
    expect(
      screen.getByText("Trecho SIA Trecho 3, 108, apt, Zona Industrial (Guará)"),
    ).toBeInTheDocument();
  });

  it("mantém o traço quando o dado realmente não existe", () => {
    render(
      <UserDetailPage
        activeTab="overview"
        origin={origin}
        ownerApplications={ownerApplications}
        user={buildUser({ cnpj: "", companies: [], phoneNumber: "" })}
      />,
    );

    const telefone = screen.getByText("Telefone").closest("div");
    const cnpj = screen.getByText("CNPJ").closest("div");

    expect(telefone).toHaveTextContent("—");
    expect(cnpj).toHaveTextContent("—");
    expect(screen.queryByText("Empresa")).not.toBeInTheDocument();
  });

  it("não oferece área de vendas para quem não é vendor", () => {
    render(
      <UserDetailPage
        activeTab="overview"
        origin={origin}
        ownerApplications={ownerApplications}
        user={buildUser()}
      />,
    );

    expect(screen.queryByRole("link", { name: "Vendas" })).not.toBeInTheDocument();
    expect(screen.queryByText("Vendas operacionais como vendor")).not.toBeInTheDocument();
    expect(screen.queryByText("Loja")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pedidos" })).toBeInTheDocument();
  });

  it("ignora tab=sales pedida na URL para uma conta customer", () => {
    render(
      <UserDetailPage
        activeTab="sales"
        origin={origin}
        ownerApplications={ownerApplications}
        user={buildUser()}
      />,
    );

    expect(screen.getByText("Conta e dados basicos")).toBeInTheDocument();
    expect(screen.queryByText("Vendas como vendor")).not.toBeInTheDocument();
    expect(screen.queryByText("Sem vendas recentes")).not.toBeInTheDocument();
  });

  it("mantém vendas e loja para uma conta vendor", () => {
    render(
      <UserDetailPage
        activeTab="overview"
        origin={origin}
        ownerApplications={ownerApplications}
        user={buildUser({
          cnpj: "65.326.368/0001-90",
          companies: [],
          isVendor: true,
          metrics: {
            cancelledOrdersCount: 1,
            favoritesCount: 0,
            ordersCount: 0,
            purchasesCount: 0,
            salesCount: 3,
            supportTicketsCount: 1,
          },
          role: "seller",
          roleLabel: "Vendor",
          roles: ["seller"],
          storeName: "Papeloto",
        })}
      />,
    );

    expect(screen.getByRole("link", { name: "Vendas" })).toBeInTheDocument();
    expect(screen.getByText("Vendas operacionais como vendor")).toBeInTheDocument();
    expect(screen.getByText("Papeloto")).toBeInTheDocument();
    expect(screen.getByText("65.326.368/0001-90")).toBeInTheDocument();
  });
});
