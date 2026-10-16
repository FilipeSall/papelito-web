import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FinancialProfile } from "@/features/vendor-payment-gateways/types/payment-gateways";

import { VendorFinancialProfileForm } from "./vendor-financial-profile-form";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

const PROFILE_URL = "/api/vendor/financial-profile";
const STORE_CNPJ = "11222333000181";
const SAVE_BUTTON = "Salvar dados financeiros";
const CPF_LABEL = /^CPF/;
const PASSWORD_LABEL = /Senha atual/;

function profile(pending: FinancialProfile["pending"]["pagarme"] = { policy: "allowed", pendingFields: [] }): FinancialProfile {
  return {
    version: 4,
    cnpj: "",
    cnpjChanged: false,
    profile: {
      companyName: "Papelaria Exemplo LTDA",
      tradingName: "Papelaria Exemplo",
      corporationType: "MEI",
      foundingDate: "2020-01-01",
      annualRevenue: "120000",
      managingPartners: [
        {
          name: "Ana Souza",
          email: "ana@example.com",
          motherName: "Maria",
          monthlyIncome: "5000",
          professionalOccupation: "Empresária",
          hasDocument: true,
          documentLast4: "4725",
          hasBirthdate: true,
          selfDeclaredLegalRepresentative: false,
          address: {
            zipCode: "01310100",
            street: "Avenida Paulista",
            streetNumber: "1000",
            complement: "",
            neighborhood: "Bela Vista",
            city: "São Paulo",
            state: "SP",
          },
        },
      ],
      bankAccount: {
        holderName: "Papelaria Exemplo",
        holderType: "company",
        holderDocument: STORE_CNPJ,
        bankCode: "341",
        branchNumber: "1234",
        branchCheckDigit: "",
        accountNumber: "56789",
        accountCheckDigit: "0",
        type: "checking",
      },
    },
    pending: { pagarme: pending, mercadopago: { pendingFields: [] } },
  };
}

const fetchMock = vi.fn();

function lastPatchBody(): Record<string, unknown> {
  const call = fetchMock.mock.calls.find(([url]) => url === PROFILE_URL);
  return JSON.parse(String((call?.[1] as RequestInit).body)) as Record<string, unknown>;
}

function respond(data: unknown, status = 200) {
  fetchMock.mockImplementation(() =>
    Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(data) }),
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  refreshMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("VendorFinancialProfileForm", () => {
  it("explica o papel de cada gateway sem prometer verificação do Mercado Pago", () => {
    render(<VendorFinancialProfileForm cnpj={STORE_CNPJ} initialProfile={profile()} />);

    expect(screen.getByText(/O Mercado Pago não usa este formulário/)).toBeInTheDocument();
    expect(screen.queryByText(/KYC do Mercado Pago aprovado|aprovado pelo Mercado Pago/i)).not.toBeInTheDocument();
  });

  it("CPF e nascimento são só indicadores: campo vazio com o final salvo", () => {
    render(<VendorFinancialProfileForm cnpj={STORE_CNPJ} initialProfile={profile()} />);

    const cpf = screen.getByLabelText(CPF_LABEL);
    expect(cpf).toHaveValue("");
    expect(cpf).toHaveAttribute("placeholder", "CPF salvo terminando em 4725");
    expect(screen.getByLabelText(/^Data de nascimento/)).toHaveValue("");
  });

  it("edição parcial não envia CPF nem senha quando o CPF não foi digitado", async () => {
    const user = userEvent.setup();
    respond(profile());
    render(<VendorFinancialProfileForm cnpj={STORE_CNPJ} initialProfile={profile()} />);

    const tradingName = screen.getByLabelText(/^Nome fantasia/);
    await user.clear(tradingName);
    await user.type(tradingName, "Papelaria Nova");
    await user.click(screen.getByRole("button", { name: SAVE_BUTTON }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastPatchBody()).toEqual({ version: 4, profile: { tradingName: "Papelaria Nova" } });
    expect(screen.queryByLabelText(PASSWORD_LABEL)).not.toBeInTheDocument();
  });

  it("envio que toca o CPF pede a senha atual antes de chamar o servidor", async () => {
    const user = userEvent.setup();
    respond(profile());
    render(<VendorFinancialProfileForm cnpj={STORE_CNPJ} initialProfile={profile()} />);

    await user.type(screen.getByLabelText(CPF_LABEL), "52998224725");
    await user.click(screen.getByRole("button", { name: SAVE_BUTTON }));

    expect(await screen.findByText(/Digite a senha atual/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(PASSWORD_LABEL), "minha-senha");
    await user.click(screen.getByRole("button", { name: SAVE_BUTTON }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastPatchBody()).toEqual({
      version: 4,
      profile: { managingPartners: [{ document: "52998224725" }] },
      currentPassword: "minha-senha",
    });
  });

  it("confirmação de representante legal vai como true explícito", async () => {
    const user = userEvent.setup();
    respond(profile());
    render(<VendorFinancialProfileForm cnpj={STORE_CNPJ} initialProfile={profile()} />);

    await user.click(screen.getByRole("checkbox", { name: /representante legal da empresa/ }));
    await user.click(screen.getByRole("button", { name: SAVE_BUTTON }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastPatchBody()).toEqual({ version: 4, profile: { managingPartners: [{ selfDeclaredLegalRepresentative: true }] } });
  });

  it("mostra as pendências da Pagar.me com rótulo legível", () => {
    render(
      <VendorFinancialProfileForm
        cnpj={STORE_CNPJ}
        initialProfile={profile({ policy: "allowed", pendingFields: ["partner.document", "bankAccount.accountNumber"] })}
      />,
    );

    expect(screen.getByTestId("financial-pending-pagarme")).toHaveTextContent(/CPF do socio administrador/);
    expect(screen.queryByText("partner.document")).not.toBeInTheDocument();
  });

  it("CNAE bloqueado deixa a seção Pagar.me indisponível e dispensa os campos dela", async () => {
    const user = userEvent.setup();
    respond(profile({ policy: "blocked_cnae", pendingFields: [] }));
    render(
      <VendorFinancialProfileForm cnpj={STORE_CNPJ} initialProfile={profile({ policy: "blocked_cnae", pendingFields: [] })} />,
    );

    expect(screen.getAllByText("Pagar.me indisponível para este CNAE").length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(CPF_LABEL)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Conta/)).not.toBeInTheDocument();

    const companyName = screen.getByLabelText(/^Razão social/);
    await user.clear(companyName);
    await user.type(companyName, "Tabacaria Exemplo LTDA");
    await user.click(screen.getByRole("button", { name: SAVE_BUTTON }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastPatchBody()).toEqual({ version: 4, profile: { companyName: "Tabacaria Exemplo LTDA" } });
  });

  it("conflito de versão pede para recarregar", async () => {
    const user = userEvent.setup();
    respond({ code: "papelito_financial_profile_version_conflict" }, 409);
    render(<VendorFinancialProfileForm cnpj={STORE_CNPJ} initialProfile={profile()} />);

    await user.type(screen.getByLabelText(/^Nome fantasia/), " 2");
    await user.click(screen.getByRole("button", { name: SAVE_BUTTON }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Recarregue antes de salvar/);
  });

  it("senha recusada aparece no campo de senha", async () => {
    const user = userEvent.setup();
    respond({ code: "papelito_reauthentication_failed" }, 403);
    render(<VendorFinancialProfileForm cnpj={STORE_CNPJ} initialProfile={profile()} />);

    await user.type(screen.getByLabelText(CPF_LABEL), "52998224725");
    await user.type(await screen.findByLabelText(PASSWORD_LABEL), "errada");
    await user.click(screen.getByRole("button", { name: SAVE_BUTTON }));

    expect(await screen.findByText(/Não foi possível confirmar a senha atual/)).toBeInTheDocument();
  });

  it("sem leitura do perfil não desenha campos vazios como se estivessem salvos", () => {
    render(<VendorFinancialProfileForm cnpj={STORE_CNPJ} initialProfile={null} />);

    expect(screen.getByText(/Não conseguimos ler os dados financeiros/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: SAVE_BUTTON })).not.toBeInTheDocument();
  });
});
