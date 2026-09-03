import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AdminCompanyDetail } from "@/lib/server/admin-companies";

import { CompanyDetailPage } from "./company-detail-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function buildDetail(
  companyOverrides: Partial<AdminCompanyDetail["company"]> = {},
  overrides: Partial<AdminCompanyDetail> = {},
): AdminCompanyDetail {
  return {
    company: {
      billingEmail: "user1@test.com",
      billingEmailVerifiedAt: "2026-09-01 00:18:47",
      cnpj: "99999003000148",
      companyStatus: "active",
      createdAt: "2026-09-01 00:17:20",
      createdByUserId: 2271,
      fiscalAddress: {
        cep: "71200030",
        city: "Brasília",
        complement: "apt",
        neighborhood: "Zona Industrial (Guará)",
        number: "108",
        state: "DF",
        street: "Trecho SIA Trecho 3",
      },
      id: 21,
      legalName: "CERRADO PAPEIS E SUPRIMENTOS LTDA",
      ownerUserId: 2271,
      ownershipStatus: "verified",
      phone: "(61) 4002-8922",
      registryStatus: "active",
      rejectionReason: null,
      tradeName: "CERRADO PAPEIS",
      ...companyOverrides,
    },
    events: [],
    members: [
      {
        accountStatus: "active",
        email: "user1@test.com",
        isVendor: false,
        name: "Marcos Stub de Oliveira",
        role: "owner",
        status: "active",
        userId: 2271,
      },
    ],
    ...overrides,
  };
}

describe("detalhe administrativo da empresa", () => {
  it("exibe o CNPJ com a máscara brasileira", () => {
    render(<CompanyDetailPage detail={buildDetail()} />);

    expect(screen.getAllByText("99.999.003/0001-48").length).toBeGreaterThan(0);
  });

  it("mostra o responsável a partir do titular vinculado", () => {
    render(<CompanyDetailPage detail={buildDetail()} />);

    expect(screen.getByText("Responsável")).toBeInTheDocument();

    for (const link of screen.getAllByRole("link", { name: "Marcos Stub de Oliveira" })) {
      expect(link).toHaveAttribute("href", "/admin/contas/2271");
    }
  });

  it("cai para a membership owner quando a titularidade ainda não foi aprovada", () => {
    render(
      <CompanyDetailPage
        detail={buildDetail({ ownerUserId: null, ownershipStatus: "pending_manual_review" })}
      />,
    );

    expect(screen.getByText("Titularidade ainda não aprovada.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Marcos Stub de Oliveira" }).length).toBe(2);
  });

  it("diferencia visualmente cada situação da empresa", () => {
    const { container: ativa } = render(<CompanyDetailPage detail={buildDetail()} />);
    expect(ativa.querySelector(".bg-brand-yellow")).not.toBeNull();
    expect(screen.getByText(/Empresa liberada para comprar/)).toBeInTheDocument();

    const { container: suspensa } = render(
      <CompanyDetailPage detail={buildDetail({ companyStatus: "suspended" })} />,
    );
    expect(suspensa.querySelector(".bg-\\[\\#c0392b\\]")).not.toBeNull();
    expect(screen.getByText(/Empresa suspensa/)).toBeInTheDocument();
  });
});
