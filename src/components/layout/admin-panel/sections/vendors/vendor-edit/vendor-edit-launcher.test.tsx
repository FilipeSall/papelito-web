import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { VendorPendingRegistrationResponse } from "@/features/revendedor/types/revendedor-application";

import { VendorEditLauncher } from "./vendor-edit-launcher";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: refreshMock, replace: vi.fn() }),
}));

function registration(
  overrides: Partial<VendorPendingRegistrationResponse> = {},
): VendorPendingRegistrationResponse {
  return {
    application: {
      coverageRanges: [{ minCep: "01000-000", maxCep: "02000-000" }],
      step1: {
        cnpj: "65.326.368/0001-90",
        discoveryChannel: "Instagram",
        email: "ana@example.com",
        firstName: "Ana",
        hasSoldPapelito: "sim",
        instagram: "ana",
        lastName: "Souza",
        phone: "(11) 99999-9999",
        storeName: "Papelaria Ana",
      },
      step2: {
        cep: "01310-930",
        city: "São Paulo",
        complement: "Sala 2",
        coverageRanges: [],
        maxCep: "02000-000",
        minCep: "01000-000",
        neighborhood: "Bela Vista",
        number: "1000",
        state: "SP",
        street: "Avenida Paulista",
      },
    },
    draft: {
      annualRevenue: "250000",
      bankAccount: {
        accountCheckDigit: "7",
        accountNumber: "123456",
        bankCode: "260",
        branchCheckDigit: "",
        branchNumber: "1",
        holderDocument: "65.326.368/0001-90",
        holderName: "Papelaria Ana",
        holderType: "company",
        type: "checking",
      },
      companyName: "Papelaria Ana LTDA",
      corporationType: "MEI",
      corporationTypeOther: "",
      corporationTypeSelection: "MEI",
      foundingDate: "2020-01-15",
      hasManagingPartner: "yes",
      managingPartners: [
        {
          address: {
            city: "São Paulo",
            complement: "",
            neighborhood: "Bela Vista",
            state: "SP",
            street: "Avenida Paulista",
            streetNumber: "1000",
            zipCode: "01310-930",
          },
          birthdate: "1990-05-04",
          document: "111.444.777-35",
          email: "ana@example.com",
          monthlyIncome: "9000",
          motherName: "Maria Souza",
          name: "Ana Souza",
          professionalOccupation: "Empresária",
          selfDeclaredLegalRepresentative: true,
        },
      ],
      tradingName: "Papelaria Ana",
      transfer: { day: 0, interval: "Daily" },
    },
    pendingFields: [],
    updatedAt: "2026-09-01 10:00:00",
    ...overrides,
  };
}

function stubFetch(overrides: Partial<VendorPendingRegistrationResponse> = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    json: async () => ({ registration: registration(overrides) }),
    ok: true,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderLauncher() {
  return render(<VendorEditLauncher vendorId={42} vendorName="Papelaria Ana" />);
}

async function openEditor() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /Editar dados/ }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument());
  return user;
}

function campoPorRotulo(rotulo: string) {
  const label = screen
    .getAllByText(rotulo)
    .map((element) => element.closest("label"))
    .find(Boolean);
  const input = label?.querySelector("input");

  if (!input) {
    throw new Error(`Campo não encontrado: ${rotulo}`);
  }

  return input;
}

function lastRequestBody(fetchMock: ReturnType<typeof vi.fn>) {
  const call = fetchMock.mock.calls.at(-1);
  return JSON.parse(String((call?.[1] as RequestInit).body));
}

beforeEach(() => {
  refreshMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("VendorEditLauncher — ação de edição", () => {
  it("oferece a ação de editar os dados do vendor", () => {
    stubFetch();
    renderLauncher();

    expect(screen.getByRole("button", { name: /Editar dados/ })).toBeInTheDocument();
  });

  it("não busca o cadastro do vendor antes de abrir o editor", () => {
    const fetchMock = stubFetch();
    renderLauncher();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mostra o estado de carregamento e depois o formulário", async () => {
    let resolveFetch: ((value: unknown) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );
    renderLauncher();

    fireEvent.click(screen.getByRole("button", { name: /Editar dados/ }));

    expect(await screen.findByRole("status")).toHaveTextContent(/Carregando o cadastro atual/);

    resolveFetch?.({ json: async () => ({ registration: registration() }), ok: true });

    await waitFor(() => expect(campoPorRotulo("Nome da loja *")).toHaveValue("Papelaria Ana"));
  });

  it("mostra o erro de carregamento e não renderiza o formulário", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ message: "Vendor nao encontrado." }),
        ok: false,
      }),
    );
    renderLauncher();

    fireEvent.click(screen.getByRole("button", { name: /Editar dados/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Vendor nao encontrado.");
    expect(screen.queryByText("Nome da loja *")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
  });

  it("carrega os valores atuais do vendor no formulário", async () => {
    const fetchMock = stubFetch();
    renderLauncher();
    await openEditor();

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/vendors/42/registration", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    expect(campoPorRotulo("Nome da loja *")).toHaveValue("Papelaria Ana");
    expect(campoPorRotulo("CNPJ *")).toHaveValue("65.326.368/0001-90");
    expect(campoPorRotulo("Telefone *")).toHaveValue("(11) 99999-9999");
    expect(campoPorRotulo("Razao social")).toHaveValue("Papelaria Ana LTDA");
    expect(campoPorRotulo("Conta")).toHaveValue("123456");
    expect(campoPorRotulo("CPF")).toHaveValue("111.444.777-35");
  });

  it("não pede senha temporária na edição", async () => {
    stubFetch();
    renderLauncher();
    await openEditor();

    expect(screen.queryByText("Senha temporária *")).not.toBeInTheDocument();
  });

  it("não bloqueia o salvamento por campos de KYC ainda vazios", async () => {
    const base = registration();
    stubFetch({ draft: { ...base.draft!, annualRevenue: "", companyName: "" } });
    renderLauncher();
    await openEditor();

    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeEnabled();
  });
});

describe("VendorEditLauncher — salvamento", () => {
  it("envia o campo alterado preservando os demais e atualiza a página", async () => {
    const fetchMock = stubFetch();

    renderLauncher();
    const user = await openEditor();

    await user.clear(campoPorRotulo("Nome da loja *"));
    await user.type(campoPorRotulo("Nome da loja *"), "Papelaria Nova");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/admin/vendors/42/registration");
    expect((init as RequestInit).method).toBe("PUT");

    const body = lastRequestBody(fetchMock);
    expect(body.application.step1.storeName).toBe("Papelaria Nova");
    expect(body.application.step1.cnpj).toBe("65.326.368/0001-90");
    expect(body.application.step2.street).toBe("Avenida Paulista");
    expect(body.application.coverageRanges).toEqual([
      { minCep: "01000-000", maxCep: "02000-000" },
    ]);
    expect(body.draft.bankAccount.accountNumber).toBe("123456");
    expect(body.draft.managingPartners[0].document).toBe("111.444.777-35");

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(await screen.findByText(/Dados do vendor atualizados/)).toBeInTheDocument();
  });

  it("nunca manda id, senha temporária ou usuário de origem no payload", async () => {
    const fetchMock = stubFetch();

    renderLauncher();
    const user = await openEditor();
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const body = lastRequestBody(fetchMock);
    expect(Object.keys(body)).toEqual(["application", "draft"]);
    expect(JSON.stringify(body)).not.toContain("temporaryPassword");
    expect(JSON.stringify(body)).not.toContain("sourceUserId");
  });

  it("bloqueia o submit e não chama a API quando um campo essencial é apagado", async () => {
    const fetchMock = stubFetch();

    renderLauncher();
    const user = await openEditor();

    await user.clear(campoPorRotulo("Nome da loja *"));

    expect(screen.getByText(/Informe o nome da loja\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mostra a mensagem de erro devolvida pelo backend", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ registration: registration() }), ok: true })
      .mockResolvedValueOnce({
        json: async () => ({ message: "Ja existe uma conta com este CNPJ." }),
        ok: false,
      });
    vi.stubGlobal("fetch", fetchMock);

    renderLauncher();
    const user = await openEditor();
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ja existe uma conta com este CNPJ.");
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("não dispara duas requisições em cliques repetidos", async () => {
    let resolveSave: ((value: unknown) => void) | undefined;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ registration: registration() }), ok: true })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSave = resolve;
          }),
      );
    vi.stubGlobal("fetch", fetchMock);

    renderLauncher();
    await openEditor();

    const submit = screen.getByRole("button", { name: "Salvar alterações" });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: /Salvando/ })).toBeDisabled();

    resolveSave?.({ json: async () => ({ registration: registration() }), ok: true });
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it("destaca as pendências que ainda bloqueiam as vendas", async () => {
    stubFetch({ pendingFields: ["bankAccount.accountNumber"] });
    renderLauncher();
    await openEditor();

    expect(screen.getByText(/Pendências que bloqueiam as vendas/)).toBeInTheDocument();
    expect(screen.getAllByText("Conta").length).toBeGreaterThan(0);
  });

  it("tira o erro visual da pendência assim que o campo fica válido", async () => {
    const base = registration();
    stubFetch({
      draft: { ...base.draft!, bankAccount: { ...base.draft!.bankAccount, accountNumber: "" } },
      pendingFields: ["bankAccount.accountNumber"],
    });
    renderLauncher();
    const user = await openEditor();

    expect(campoPorRotulo("Conta")).toHaveClass("border-[#c0392b]");

    await user.type(campoPorRotulo("Conta"), "123456");

    expect(campoPorRotulo("Conta")).not.toHaveClass("border-[#c0392b]");
  });
});
