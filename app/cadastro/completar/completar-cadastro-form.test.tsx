import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CadastroPrefill } from "../shared";
import { CompletarCadastroForm } from "./completar-cadastro-form";

const { replaceMock, refreshMock, updateMock, signOutMock, lookupCepMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  refreshMock: vi.fn(),
  updateMock: vi.fn().mockResolvedValue(undefined),
  signOutMock: vi.fn().mockResolvedValue(undefined),
  lookupCepMock: vi.fn().mockResolvedValue({
    status: "ok",
    data: {
      street: "Avenida Paulista",
      neighborhood: "Bela Vista",
      city: "Sao Paulo",
      state: "SP",
    },
    partial: false,
    missingFields: [],
  }),
}));

vi.mock("@/features/checkout/services/lookup-cep", () => ({
  lookupCepDetailed: lookupCepMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock, push: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ update: updateMock, data: null, status: "authenticated" }),
}));

vi.mock("@/features/auth/client/logout", () => ({
  signOutAndClearSession: signOutMock,
}));

const VALID_CPF = "529.982.247-25";
const VALID_CNPJ = "11.222.333/0001-81";

function buildPrefill(overrides: Partial<CadastroPrefill> = {}): CadastroPrefill {
  return {
    email: "google@papelito.com",
    name: "Google User",
    cep: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    cnpj: "",
    cpfLast4: null,
    hasBirthDate: false,
    intent: "create_company",
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Nome Completo"), { target: { value: "Google User" } });
  fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "(11) 99999-9999" } });
  fireEvent.change(screen.getByLabelText("CPF do responsável"), { target: { value: VALID_CPF } });
  fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: "1990-01-01" } });
  fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "01310-000" } });
  fireEvent.change(screen.getByLabelText("Logradouro"), { target: { value: "Avenida Paulista" } });
  fireEvent.change(screen.getByLabelText("Número"), { target: { value: "1000" } });
  fireEvent.change(screen.getByLabelText("Bairro"), { target: { value: "Bela Vista" } });
  fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Sao Paulo" } });
  fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "SP" } });
  fireEvent.change(screen.getByLabelText("CNPJ da empresa"), { target: { value: VALID_CNPJ } });
}

function submitForm() {
  fireEvent.submit(screen.getByRole("button", { name: /concluir/i }).closest("form")!);
}

describe("CompletarCadastroForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pré-preenche os dados vindos do Google e trava o e-mail autenticado", () => {
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    const email = screen.getByLabelText("E-mail") as HTMLInputElement;
    expect(email.value).toBe("google@papelito.com");
    expect(email.readOnly).toBe(true);

    expect((screen.getByLabelText("Nome Completo") as HTMLInputElement).value).toBe("Google User");
  });

  it("continua exigindo os dados B2B que o Google não fornece", () => {
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    for (const label of ["Telefone", "CPF do responsável", "Data de nascimento", "CEP", "CNPJ da empresa"]) {
      expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe("");
    }
  });

  it("rejeita CPF inválido sem chamar a rede", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    fillValidForm();
    fireEvent.change(screen.getByLabelText("CPF do responsável"), { target: { value: "111.111.111-11" } });
    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe um CPF válido.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejeita CNPJ inválido sem chamar a rede", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    fillValidForm();
    fireEvent.change(screen.getByLabelText("CNPJ da empresa"), { target: { value: "11.111.111/1111-11" } });
    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe um CNPJ válido.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejeita CEP inválido sem chamar a rede", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    fillValidForm();
    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "123" } });
    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe um CEP válido.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cria a empresa, revalida a sessão e vai para o destino original", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ identityStatus: "verified" }))
      .mockResolvedValueOnce(jsonResponse({ companyId: 10 }));

    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/checkout" />);
    fillValidForm();
    submitForm();

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/checkout"));

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/api/company/onboarding/customer-profile",
      "/api/company",
    ]);
    // Sem o refresh do token o gate devolveria o usuário para o onboarding logo após concluir.
    expect(updateMock).toHaveBeenCalledWith({ refreshB2b: true });
  });

  it("solicita acesso quando a intenção é entrar em uma empresa existente", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ identityStatus: "verified" }))
      .mockResolvedValueOnce(jsonResponse({ status: "received" }));

    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);
    fireEvent.click(screen.getByRole("button", { name: "Entrar em uma empresa" }));
    fillValidForm();
    submitForm();

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/"));
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/company/request-access");
  });

  it("retoma o cadastro com o CNPJ salvo e a dica do CPF já registrado", () => {
    render(
      <CompletarCadastroForm
        prefill={buildPrefill({
          cnpj: "11222333000181",
          cpfLast4: "4725",
          hasBirthDate: true,
          intent: "join_company",
        })}
        callbackUrl="/"
      />,
    );

    expect((screen.getByLabelText("CNPJ da empresa") as HTMLInputElement).value).toBe("11222333000181");
    expect(screen.getByText(/terminando em 4725/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar em uma empresa" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("mantém a sessão viva e o formulário montado quando o backend recusa", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ identityStatus: "verified" }))
      .mockResolvedValueOnce(
        jsonResponse({ message: "Não foi possível concluir esta candidatura." }, 409),
      );

    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);
    fillValidForm();
    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível concluir esta candidatura.");
    expect(replaceMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("CNPJ da empresa")).toBeInTheDocument();
  });

  it("distingue rollout desligado (503) de erro genérico", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({ message: "Alterações empresariais estão temporariamente indisponíveis." }, 503),
    );

    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);
    fillValidForm();
    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O cadastro empresarial está temporariamente indisponível.",
    );
  });

  it("abre o modal do projeto ao cancelar, sem alert nativo do navegador", () => {
    const nativeConfirm = vi.spyOn(window, "confirm");
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Sair do cadastro?")).toBeInTheDocument();
    expect(nativeConfirm).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("encerra a sessão só depois de confirmar no modal", async () => {
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Sair mesmo assim" }));

    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/", redirect: true }),
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("volta ao formulário ao escolher continuar o cadastro", () => {
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar cadastro" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("fecha o modal pelo teclado (Escape), sem encerrar a sessão", async () => {
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("fecha o modal pelo clique externo, sem encerrar a sessão", async () => {
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByTestId("base-modal-overlay"));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("envia o endereço completo no payload do onboarding", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ identityStatus: "verified" }))
      .mockResolvedValueOnce(jsonResponse({ companyId: 10 }));

    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText("Complemento"), { target: { value: "sala 2" } });
    submitForm();

    await waitFor(() => expect(replaceMock).toHaveBeenCalled());

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as Record<string, string>;
    expect(body).toMatchObject({
      cep: "01310-000",
      street: "Avenida Paulista",
      number: "1000",
      complement: "sala 2",
      neighborhood: "Bela Vista",
      city: "Sao Paulo",
      state: "SP",
    });
  });

  it("exige o endereço completo antes de concluir", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    fillValidForm();
    fireEvent.change(screen.getByLabelText("Número"), { target: { value: "" } });
    submitForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Preencha logradouro, número, bairro, cidade e estado",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preenche o endereço automaticamente ao digitar um CEP válido", async () => {
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "01310-000" } });

    await waitFor(() =>
      expect((screen.getByLabelText("Logradouro") as HTMLInputElement).value).toBe(
        "Avenida Paulista",
      ),
    );
    expect((screen.getByLabelText("Cidade") as HTMLInputElement).value).toBe("Sao Paulo");
    expect((screen.getByLabelText("Estado") as HTMLSelectElement).value).toBe("SP");
    expect(lookupCepMock).toHaveBeenCalledWith("01310000");
  });

  it("deixa o endereço editável quando o CEP não é encontrado", async () => {
    lookupCepMock.mockResolvedValueOnce({ status: "not_found", message: "CEP não encontrado." });
    render(<CompletarCadastroForm prefill={buildPrefill()} callbackUrl="/" />);

    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "99999-999" } });

    expect(await screen.findByText(/Preencha o endereço manualmente/)).toBeInTheDocument();
    expect(screen.getByLabelText("Logradouro")).not.toBeDisabled();
  });

  it("reidrata o endereço já salvo para o usuário retomar sem redigitar", () => {
    render(
      <CompletarCadastroForm
        prefill={buildPrefill({
          cep: "01310-000",
          street: "Avenida Paulista",
          neighborhood: "Bela Vista",
          city: "Sao Paulo",
          state: "SP",
        })}
        callbackUrl="/"
      />,
    );

    expect((screen.getByLabelText("CEP") as HTMLInputElement).value).toBe("01310-000");
    expect((screen.getByLabelText("Logradouro") as HTMLInputElement).value).toBe("Avenida Paulista");
    expect((screen.getByLabelText("Bairro") as HTMLInputElement).value).toBe("Bela Vista");
    expect((screen.getByLabelText("Cidade") as HTMLInputElement).value).toBe("Sao Paulo");
    expect((screen.getByLabelText("Estado") as HTMLSelectElement).value).toBe("SP");
  });
});
