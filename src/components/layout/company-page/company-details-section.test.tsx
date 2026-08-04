import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CompanyContext, CompanyDetails } from "@/features/company/types/company";

import { CompanyDetailsSection } from "./company-details-section";

const updateCompanyDetails = vi.fn();
const resendBillingEmailConfirmation = vi.fn();

vi.mock("@/features/company/client/company-client", () => ({
  updateCompanyDetails: (...args: unknown[]) => updateCompanyDetails(...args),
  resendBillingEmailConfirmation: (...args: unknown[]) => resendBillingEmailConfirmation(...args),
}));

function company(overrides: Partial<CompanyDetails> = {}): CompanyDetails {
  return {
    legalName: "Papelaria Central LTDA",
    tradeName: "Papelaria Central",
    cnpj: "12.345.678/0001-95",
    registryStatus: "active",
    ownershipStatus: "verified",
    status: "active",
    fiscalAddress: null,
    providerSource: null,
    providerCheckedAt: null,
    billingEmail: "dono@empresa.com",
    pendingBillingEmail: null,
    billingEmailStatus: "verified",
    phone: "(61) 99999-0000",
    ...overrides,
  };
}

function context(overrides: Partial<CompanyDetails> = {}): CompanyContext {
  return {
    membershipRole: "owner",
    company: company(overrides),
  } as CompanyContext;
}

beforeEach(() => {
  updateCompanyDetails.mockReset();
  resendBillingEmailConfirmation.mockReset();
});

describe("CompanyDetailsSection — e-mail de faturamento", () => {
  it("não pede confirmação nem oferece reenvio quando já está verificado", () => {
    render(<CompanyDetailsSection context={context()} onChanged={async () => {}} />);

    expect(screen.getByText("Verificado")).toBeInTheDocument();
    expect(screen.queryByText(/Aguardando confirmação/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reenviar/i })).not.toBeInTheDocument();
  });

  it("mostra qual endereço está aguardando confirmação", () => {
    render(
      <CompanyDetailsSection
        context={context({ billingEmailStatus: "pending", pendingBillingEmail: "novo@empresa.com" })}
        onChanged={async () => {}}
      />,
    );

    expect(screen.getByText(/Aguardando confirmação de/i)).toBeInTheDocument();
    expect(screen.getByText("novo@empresa.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reenviar confirmação/i })).toBeInTheDocument();
  });

  it("pede o endereço quando ainda não há nenhum confirmado", () => {
    render(
      <CompanyDetailsSection
        context={context({ billingEmailStatus: "unverified" })}
        onChanged={async () => {}}
      />,
    );

    expect(screen.getByText(/Informe abaixo o e-mail que deve receber/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reenviar/i })).not.toBeInTheDocument();
  });

  it("não chama a API ao salvar de novo o mesmo endereço já verificado", async () => {
    const user = userEvent.setup();
    render(<CompanyDetailsSection context={context()} onChanged={async () => {}} />);

    await user.type(screen.getByLabelText(/E-mail de faturamento/i), "dono@empresa.com");
    await user.click(screen.getByRole("button", { name: /Salvar/i }));

    expect(updateCompanyDetails).not.toHaveBeenCalled();
    expect(await screen.findByText(/já está confirmado/i)).toBeInTheDocument();
  });

  it("trata mudança apenas de caixa e espaços como o mesmo endereço", async () => {
    const user = userEvent.setup();
    render(<CompanyDetailsSection context={context()} onChanged={async () => {}} />);

    await user.type(screen.getByLabelText(/E-mail de faturamento/i), "  DONO@Empresa.COM  ");
    await user.click(screen.getByRole("button", { name: /Salvar/i }));

    expect(updateCompanyDetails).not.toHaveBeenCalled();
  });

  it("envia o endereço normalizado quando é de fato uma troca", async () => {
    const user = userEvent.setup();
    updateCompanyDetails.mockResolvedValue({
      ok: true,
      data: context({ billingEmailStatus: "pending", pendingBillingEmail: "novo@empresa.com" }),
    });

    render(<CompanyDetailsSection context={context()} onChanged={async () => {}} />);

    await user.type(screen.getByLabelText(/E-mail de faturamento/i), "  Novo@Empresa.COM ");
    await user.click(screen.getByRole("button", { name: /Salvar/i }));

    await waitFor(() =>
      expect(updateCompanyDetails).toHaveBeenCalledWith(
        expect.objectContaining({ billingEmail: "novo@empresa.com" }),
      ),
    );
    expect(await screen.findByText(/Enviamos um link de confirmação para novo@empresa.com/i)).toBeInTheDocument();
  });

  it("avisa que a autoconfirmação aconteceu quando o backend devolve verificado", async () => {
    const user = userEvent.setup();
    updateCompanyDetails.mockResolvedValue({ ok: true, data: context() });

    render(
      <CompanyDetailsSection
        context={context({ billingEmailStatus: "unverified" })}
        onChanged={async () => {}}
      />,
    );

    await user.type(screen.getByLabelText(/E-mail de faturamento/i), "dono@empresa.com");
    await user.click(screen.getByRole("button", { name: /Salvar/i }));

    expect(
      await screen.findByText(/é o mesmo e-mail já verificado da sua conta/i),
    ).toBeInTheDocument();
  });

  it("avisa que o link anterior deixou de valer ao reenviar", async () => {
    const user = userEvent.setup();
    resendBillingEmailConfirmation.mockResolvedValue({
      ok: true,
      data: context({ billingEmailStatus: "pending", pendingBillingEmail: "novo@empresa.com" }),
    });

    render(
      <CompanyDetailsSection
        context={context({ billingEmailStatus: "pending", pendingBillingEmail: "novo@empresa.com" })}
        onChanged={async () => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Reenviar confirmação/i }));

    expect(await screen.findByText(/link anterior deixou de valer/i)).toBeInTheDocument();
  });

  it("mostra o erro do backend sem deixar o botão travado", async () => {
    const user = userEvent.setup();
    updateCompanyDetails.mockResolvedValue({
      ok: false,
      status: 422,
      message: "E-mail de faturamento inválido.",
    });

    render(<CompanyDetailsSection context={context()} onChanged={async () => {}} />);

    await user.type(screen.getByLabelText(/E-mail de faturamento/i), "outro@empresa.com");
    await user.click(screen.getByRole("button", { name: /Salvar/i }));

    expect(await screen.findByText(/E-mail de faturamento inválido/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvar/i })).toBeEnabled();
  });

  it("esconde o formulário e o reenvio para quem não administra", () => {
    render(
      <CompanyDetailsSection
        context={
          {
            membershipRole: "buyer",
            company: company({ billingEmailStatus: "pending", pendingBillingEmail: "novo@empresa.com" }),
          } as CompanyContext
        }
        onChanged={async () => {}}
      />,
    );

    expect(screen.queryByRole("button", { name: /Salvar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reenviar/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Aguardando confirmação de/i)).toBeInTheDocument();
  });
});
