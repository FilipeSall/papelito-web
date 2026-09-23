import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { VendorPendingRegistrationResponse } from "@/features/revendedor/types/revendedor-application";

import { VendorPendingRegistrationModalHost } from "./vendor-pending-registration-modal-host";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock, replace: vi.fn() }),
}));

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({
    isAuthenticated: true,
    isLoading: false,
    isSeller: true,
    session: { accessToken: "token-vendor" },
  }),
}));

const CONTA_FORA_DO_CNPJ =
  "A conta cadastrada não está no CNPJ da empresa. Se ela já é a conta PJ da empresa, confirme abaixo; se não, informe banco, agência e conta de uma conta PJ.";
const CONFIRMAR_CONTA_PJ = "Confirmar que esta conta está no CNPJ da empresa";

const PENDING_PARTNER_FIELDS = [
  "partner.document",
  "partner.birthdate",
  "partner.monthlyIncome",
  "partner.professionalOccupation",
];

function registration(
  overrides: Partial<VendorPendingRegistrationResponse> = {},
  partnerOverrides: Record<string, string> = {},
): VendorPendingRegistrationResponse {
  return {
    application: {
      coverageRanges: [{ minCep: "70000-000", maxCep: "72999-999" }],
      step1: {
        cnpj: "65.326.368/0001-90",
        discoveryChannel: "Instagram",
        email: "filipe@example.com",
        firstName: "Filipe",
        hasSoldPapelito: "sim",
        instagram: "papelote",
        lastName: "Salles",
        phone: "(61) 99999-9999",
        storeName: "Papelote",
      },
      step2: {
        cep: "70879-060",
        city: "Brasília",
        complement: "apt",
        coverageRanges: [],
        maxCep: "72999-999",
        minCep: "70000-000",
        neighborhood: "Asa Norte",
        number: "108",
        state: "DF",
        street: "Quadra SQN 416 Bloco F",
      },
    },
    draft: {
      annualRevenue: "15000",
      bankAccount: {
        accountCheckDigit: "7",
        accountNumber: "123456",
        bankCode: "260",
        branchCheckDigit: "",
        branchNumber: "1",
        holderDocument: "65.326.368/0001-90",
        holderName: "Papelote",
        holderType: "company",
        type: "checking",
      },
      companyName: "65.326.368 FILIPE REGES DE SALLES",
      corporationType: "MEI",
      corporationTypeOther: "",
      corporationTypeSelection: "MEI",
      foundingDate: "2026-02-03",
      hasManagingPartner: "yes",
      managingPartners: [
        {
          address: {
            city: "Brasília",
            complement: "apt",
            neighborhood: "Asa Norte",
            state: "DF",
            street: "Quadra SQN 416 Bloco F",
            streetNumber: "108",
            zipCode: "70879-060",
          },
          birthdate: "",
          document: "",
          email: "filipe@example.com",
          monthlyIncome: "",
          motherName: "",
          name: "Filipe Salles",
          professionalOccupation: "",
          selfDeclaredLegalRepresentative: true,
          ...partnerOverrides,
        },
      ],
      tradingName: "Papelote",
      transfer: { day: 0, interval: "Daily" },
    },
    pendingFields: PENDING_PARTNER_FIELDS,
    updatedAt: "2026-09-13 10:00:00",
    ...overrides,
  };
}

function stubFetch(saved?: VendorPendingRegistrationResponse) {
  const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) =>
    Promise.resolve({
      json: async () => (init?.method === "POST" ? saved : registration()),
      ok: true,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function renderOnboarding() {
  render(<VendorPendingRegistrationModalHost dismissible={false} mode="page" returnTo="/vendor/dashboard" />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Salvar cadastro" })).toBeInTheDocument());
  return userEvent.setup();
}

function campo(rotulo: string) {
  const label = screen
    .getAllByText(rotulo)
    .map((element) => element.closest("label"))
    .find((element): element is HTMLLabelElement => element !== null);
  const input = label?.querySelector("input");

  if (!label || !input) {
    throw new Error(`Campo não encontrado: ${rotulo}`);
  }

  return { input, label };
}

function expectEmErro(rotulo: string, mensagem: string) {
  const { input, label } = campo(rotulo);
  expect(input).toHaveClass("border-[#c0392b]");
  expect(within(label).getByText(mensagem)).toBeInTheDocument();
}

function expectSemErro(rotulo: string, mensagem: string) {
  const { input, label } = campo(rotulo);
  expect(input).not.toHaveClass("border-[#c0392b]");
  expect(within(label).queryByText(mensagem)).not.toBeInTheDocument();
}

beforeEach(() => {
  pushMock.mockReset();
  refreshMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const PARTNER_COMPLETE_SAVE = {
  birthdate: "1992-04-01",
  document: "037.122.851-40",
  monthlyIncome: "4500",
  professionalOccupation: "T.I",
};

describe("VendorPendingRegistrationModalHost — erro visual dos campos pendentes", () => {
  it("abre com os campos obrigatórios pendentes em estado de erro", async () => {
    stubFetch();
    await renderOnboarding();

    expectEmErro("CPF", "CPF do socio administrador");
    expectEmErro("Data de nascimento", "Data de nascimento do socio administrador");
    expectEmErro("Renda mensal", "Renda mensal do socio administrador");
    expectEmErro("Ocupacao profissional", "Ocupacao profissional do socio administrador");
    expectSemErro("Nome completo", "Nome do socio administrador");
  });

  it("mantém o erro enquanto o CPF ainda está incompleto", async () => {
    stubFetch();
    const user = await renderOnboarding();

    await user.type(campo("CPF").input, "037122");

    expect(campo("CPF").input).toHaveValue("037.122");
    expectEmErro("CPF", "CPF do socio administrador");
  });

  it("tira do erro somente o campo que passou na validação", async () => {
    stubFetch();
    const user = await renderOnboarding();

    await user.type(campo("CPF").input, "03712285140");

    expectSemErro("CPF", "CPF do socio administrador");
    expectEmErro("Data de nascimento", "Data de nascimento do socio administrador");
    expectEmErro("Renda mensal", "Renda mensal do socio administrador");
    expectEmErro("Ocupacao profissional", "Ocupacao profissional do socio administrador");
  });

  it("mantém em erro um CPF completo com dígitos verificadores inválidos", async () => {
    stubFetch();
    const user = await renderOnboarding();

    await user.type(campo("CPF").input, "03712285141");

    expectEmErro("CPF", "CPF do socio administrador");
  });

  it("libera data, renda e ocupação conforme cada um fica válido", async () => {
    stubFetch();
    const user = await renderOnboarding();

    await user.type(campo("Renda mensal").input, "0");
    expectEmErro("Renda mensal", "Renda mensal do socio administrador");

    await user.clear(campo("Renda mensal").input);
    await user.type(campo("Renda mensal").input, "4500");
    expectSemErro("Renda mensal", "Renda mensal do socio administrador");

    await user.type(campo("Data de nascimento").input, "1992-04-01");
    expectSemErro("Data de nascimento", "Data de nascimento do socio administrador");

    await user.type(campo("Ocupacao profissional").input, "T.I");
    expectSemErro("Ocupacao profissional", "Ocupacao profissional do socio administrador");
  });

  it("volta a marcar o erro quando o campo corrigido fica inválido de novo", async () => {
    stubFetch();
    const user = await renderOnboarding();

    await user.type(campo("CPF").input, "03712285140");
    expectSemErro("CPF", "CPF do socio administrador");

    await user.type(campo("CPF").input, "{Backspace}");
    expectEmErro("CPF", "CPF do socio administrador");

    await user.type(campo("Ocupacao profissional").input, "T.I");
    await user.clear(campo("Ocupacao profissional").input);
    expectEmErro("Ocupacao profissional", "Ocupacao profissional do socio administrador");
  });
});

describe("VendorPendingRegistrationModalHost — salvamento", () => {
  it("salva normalmente depois que todos os campos pendentes ficam válidos", async () => {
    const fetchMock = stubFetch(
      registration(
        { pendingFields: [] },
        {
          birthdate: "1992-04-01",
          document: "037.122.851-40",
          monthlyIncome: "4500",
          professionalOccupation: "T.I",
        },
      ),
    );
    const user = await renderOnboarding();

    await user.type(campo("CPF").input, "03712285140");
    await user.type(campo("Data de nascimento").input, "1992-04-01");
    await user.type(campo("Renda mensal").input, "4500");
    await user.type(campo("Ocupacao profissional").input, "T.I");
    await user.click(screen.getByRole("button", { name: "Salvar cadastro" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("/api/vendor/registration-pending");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body)).draft.managingPartners[0]).toMatchObject({
      birthdate: "1992-04-01",
      document: "037.122.851-40",
      monthlyIncome: "4500",
      professionalOccupation: "T.I",
    });

    expect(await screen.findByText(/Cadastro complementar concluido/)).toBeInTheDocument();
    expect(pushMock).toHaveBeenCalledWith("/vendor/dashboard");
  });

  it("trava os dois botões enquanto grava e recarrega a casca antes de navegar", async () => {
    let liberarPost: () => void = () => undefined;
    const postPendente = new Promise<void>((resolve) => {
      liberarPost = resolve;
    });
    const fetchMock = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") await postPendente;

      return {
        json: async () => registration({ pendingFields: [] }, PARTNER_COMPLETE_SAVE),
        ok: true,
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = await renderOnboarding();

    await user.click(screen.getByRole("button", { name: "Salvar cadastro" }));

    expect(await screen.findByRole("button", { name: "Salvando..." })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Voltar ao painel" })[0]).toBeDisabled();

    liberarPost();

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/vendor/dashboard"));
    expect(refreshMock.mock.invocationCallOrder[0]).toBeLessThan(pushMock.mock.invocationCallOrder[0]);
  });
});

describe("VendorPendingRegistrationModalHost — conta bancária no CNPJ da empresa", () => {
  const PARTNER_COMPLETE = {
    birthdate: "1992-04-01",
    document: "037.122.851-40",
    monthlyIncome: "4500",
    professionalOccupation: "T.I",
  };

  function contaPessoaFisicaAntiga(): VendorPendingRegistrationResponse {
    const base = registration({}, PARTNER_COMPLETE);

    return {
      ...base,
      draft: {
        ...base.draft!,
        bankAccount: {
          ...base.draft!.bankAccount,
          holderDocument: "037.122.851-40",
          holderName: "Filipe Salles",
          holderType: "individual",
        },
      },
      pendingFields: ["bankAccount.holderDocument"],
    };
  }

  function stubCarga(loaded: VendorPendingRegistrationResponse) {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) =>
      Promise.resolve({
        json: async () =>
          init?.method === "POST" ? registration({ pendingFields: [] }, PARTNER_COMPLETE) : loaded,
        ok: true,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("mostra o titular fixo como pessoa jurídica no CNPJ da empresa, sem opção de pessoa física", async () => {
    stubCarga(registration({ pendingFields: [] }, PARTNER_COMPLETE));
    await renderOnboarding();

    expect(campo("Tipo do titular").input).toHaveValue("Pessoa jurídica");
    expect(campo("Tipo do titular").input).toBeDisabled();
    expect(campo("CNPJ do titular").input).toHaveValue("65.326.368/0001-90");
    expect(campo("CNPJ do titular").input).toBeDisabled();
    expect(screen.queryByText("Pessoa física")).not.toBeInTheDocument();
  });

  it("mantém pendente a conta antiga em pessoa física sem trocar o titular sozinho", async () => {
    stubCarga(contaPessoaFisicaAntiga());
    const user = await renderOnboarding();

    expectEmErro("CNPJ do titular", CONTA_FORA_DO_CNPJ);

    await user.type(campo("Titular").input, " ME");

    expectEmErro("CNPJ do titular", CONTA_FORA_DO_CNPJ);
  });

  it("assume o CNPJ como titular quando a conta é informada e salva a conta como pessoa jurídica", async () => {
    const fetchMock = stubCarga(contaPessoaFisicaAntiga());
    const user = await renderOnboarding();

    await user.clear(campo("Conta").input);
    await user.type(campo("Conta").input, "7654321");

    expectSemErro("CNPJ do titular", CONTA_FORA_DO_CNPJ);

    await user.click(screen.getByRole("button", { name: "Salvar cadastro" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(String(init.body)).draft.bankAccount).toMatchObject({
      accountNumber: "7654321",
      holderDocument: "65.326.368/0001-90",
      holderType: "company",
    });
  });

  it("confirma que a conta já cadastrada é a conta PJ da empresa sem redigitar os dados", async () => {
    const fetchMock = stubCarga(contaPessoaFisicaAntiga());
    const user = await renderOnboarding();

    await user.click(screen.getByRole("button", { name: CONFIRMAR_CONTA_PJ }));

    expectSemErro("CNPJ do titular", CONTA_FORA_DO_CNPJ);
    expect(screen.queryByRole("button", { name: CONFIRMAR_CONTA_PJ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar cadastro" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(String(init.body)).draft.bankAccount).toMatchObject({
      accountNumber: "123456",
      holderDocument: "65.326.368/0001-90",
      holderType: "company",
    });
  });

  it("não oferece a confirmação quando a conta já está no CNPJ da empresa", async () => {
    stubCarga(registration({ pendingFields: [] }, PARTNER_COMPLETE));
    await renderOnboarding();

    expect(screen.queryByRole("button", { name: CONFIRMAR_CONTA_PJ })).not.toBeInTheDocument();
  });
});
