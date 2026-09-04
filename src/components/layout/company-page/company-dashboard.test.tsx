import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CompanyContext } from "@/features/company/types/company";

import { CompanyDashboard } from "./company-dashboard";

const updateMock = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "1" } },
    status: "authenticated",
    update: updateMock,
  }),
}));

// Seções internas fazem fetch; isolamos o teste ao roteamento de estado do dashboard.
vi.mock("./company-members-section", () => ({
  CompanyMembersSection: () => <div data-testid="members-section" />,
}));
vi.mock("./company-invitations-section", () => ({
  CompanyInvitationsSection: () => <div data-testid="invitations-section" />,
}));
vi.mock("./company-access-requests-section", () => ({
  CompanyAccessRequestsSection: () => (
    <div data-testid="access-requests-section" />
  ),
}));

function ctx(overrides: Partial<CompanyContext>): CompanyContext {
  return {
    identityStatus: "verified",
    companyId: null,
    companyStatus: null,
    companyRegistryStatus: null,
    companyOwnershipStatus: null,
    membershipRole: null,
    membershipStatus: null,
    onboardingStatus: "none",
    companySelectionRequired: false,
    availableCompanies: [],
    canPurchase: false,
    ...overrides,
  };
}

describe("CompanyDashboard", () => {
  beforeEach(() => {
    updateMock.mockReset();
  });

  it("sem empresa: mostra bloqueio + CTA de cadastro + form de solicitar acesso", () => {
    render(
      <CompanyDashboard initialContext={ctx({ onboardingStatus: "none" })} />,
    );

    expect(
      screen.getByText(/ainda não faz parte de uma empresa/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /cadastrar minha empresa/i }),
    ).toHaveAttribute("href", "/cadastro?intent=company");
    expect(
      screen.getByRole("heading", { name: /entrar em uma empresa/i }),
    ).toBeInTheDocument();
    // Sem empresa não mostra gestão de membros.
    expect(screen.queryByTestId("members-section")).not.toBeInTheDocument();
  });

  it("múltiplas empresas: exige seleção e não mostra gestão", () => {
    render(
      <CompanyDashboard
        initialContext={ctx({
          onboardingStatus: "company_selection_required",
          companySelectionRequired: true,
          availableCompanies: [
            {
              companyId: 1,
              legalName: "A LTDA",
              tradeName: "A",
              role: "buyer",
            },
            {
              companyId: 2,
              legalName: "B LTDA",
              tradeName: "B",
              role: "admin",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText(/selecione a empresa ativa/i)).toBeInTheDocument();
    // O seletor exibe o trade name (fallback para legal name).
    expect(
      screen.getByRole("button", { name: /Comprador/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Administrador/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("members-section")).not.toBeInTheDocument();
  });

  it("empresa ativa como owner: mostra gestão e compra liberada", () => {
    render(
      <CompanyDashboard
        initialContext={ctx({
          onboardingStatus: "complete",
          companyId: 7,
          companyStatus: "active",
          membershipRole: "owner",
          membershipStatus: "active",
          canPurchase: true,
          availableCompanies: [
            {
              companyId: 7,
              legalName: "ACME LTDA",
              tradeName: "ACME",
              role: "owner",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText(/compra liberada/i)).toBeInTheDocument();
    expect(screen.getByTestId("members-section")).toBeInTheDocument();
    expect(screen.getByTestId("invitations-section")).toBeInTheDocument();
    expect(screen.getByTestId("access-requests-section")).toBeInTheDocument();
  });

  it("viewer com empresa ativa: compra bloqueada", () => {
    render(
      <CompanyDashboard
        initialContext={ctx({
          onboardingStatus: "complete",
          companyId: 7,
          companyStatus: "active",
          membershipRole: "viewer",
          membershipStatus: "active",
          canPurchase: false,
          availableCompanies: [
            {
              companyId: 7,
              legalName: "ACME LTDA",
              tradeName: "ACME",
              role: "viewer",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText(/compra bloqueada/i)).toBeInTheDocument();
    expect(screen.getByText(/compra indisponível/i)).toBeInTheDocument();
  });

  it("não mostra onboarding para usuário já vinculado mesmo com identidade incompleta", () => {
    render(
      <CompanyDashboard
        initialContext={ctx({
          identityStatus: "incomplete",
          onboardingStatus: "complete",
          companyId: 7,
          companyStatus: "active",
          membershipRole: "buyer",
          membershipStatus: "active",
          canPurchase: true,
          availableCompanies: [
            {
              companyId: 7,
              legalName: "ACME LTDA",
              tradeName: "ACME",
              role: "buyer",
            },
          ],
        })}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: /complete seu onboarding b2b/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/compra liberada/i)).toBeInTheDocument();
  });
});
