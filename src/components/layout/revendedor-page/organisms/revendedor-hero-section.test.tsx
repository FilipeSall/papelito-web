import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CADASTRO_STEP1_ERROR_KEY,
  CADASTRO_STORAGE_KEY,
  REVENDEDOR_STEP1_DRAFT_KEY,
} from "@/features/company-application";
import type { RevendedorSignupValues } from "@/features/revendedor";

import { RevendedorHeroSection } from "./revendedor-hero-section";

const { routerMock } = vi.hoisted(() => ({
  routerMock: { push: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

const ADVANCE_BUTTON = /Avançar/i;

const filled: RevendedorSignupValues = {
  storeName: "Tabacaria do Centro",
  firstName: "Joana",
  lastName: "Fixture de Almeida",
  cpf: "123.456.789-09",
  birthDate: "1985-03-12",
  cnpj: "65.326.368/0001-90",
  phone: "(11) 98765-4321",
  email: "joana@example.com",
  instagram: "tabacaria.centro",
  discoveryChannel: "instagram",
  hasSoldPapelito: "sim",
};

function seedDraft(values: Partial<RevendedorSignupValues>) {
  window.sessionStorage.setItem(REVENDEDOR_STEP1_DRAFT_KEY, JSON.stringify({ ...filled, ...values }));
}

describe("RevendedorHeroSection", () => {
  beforeEach(() => {
    routerMock.push.mockReset();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("asks for the owner's CPF and birth date", () => {
    render(<RevendedorHeroSection />);

    expect(screen.getByRole("heading", { name: "Faça seu cadastro" })).toBeInTheDocument();
    expect(screen.getByLabelText("CPF *")).toBeInTheDocument();
    expect(screen.getByLabelText("Data de nascimento *")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ADVANCE_BUTTON })).toBeInTheDocument();
  });

  it("saves step 1 with the store data and opens step 2", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    seedDraft({});

    render(<RevendedorHeroSection />);
    await waitFor(() => expect(screen.getByLabelText("CPF *")).toHaveValue(filled.cpf));
    await user.click(screen.getByRole("button", { name: ADVANCE_BUTTON }));

    expect(routerMock.push).toHaveBeenCalledWith("/cadastro/etapa-2");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(JSON.parse(window.sessionStorage.getItem(CADASTRO_STORAGE_KEY) ?? "{}")).toEqual({
      birthDate: filled.birthDate,
      cnpj: filled.cnpj,
      cpf: filled.cpf,
      email: filled.email,
      intent: "create_company",
      name: "Joana Fixture de Almeida",
      phone: filled.phone,
      lead: {
        source: "revendedor",
        discoveryChannel: "instagram",
        hasSoldPapelito: "sim",
        instagram: "tabacaria.centro",
        storeName: "Tabacaria do Centro",
      },
    });
  });

  it("blocks the advance without CPF and birth date", async () => {
    const user = userEvent.setup();
    seedDraft({ cpf: "", birthDate: "" });

    render(<RevendedorHeroSection />);
    await waitFor(() => expect(screen.getByLabelText("Nome da Loja *")).toHaveValue(filled.storeName));
    await user.click(screen.getByRole("button", { name: ADVANCE_BUTTON }));

    expect(screen.getByText("Informe um CPF válido.")).toBeInTheDocument();
    expect(screen.getByText("Informe sua data de nascimento.")).toBeInTheDocument();
    expect(routerMock.push).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(CADASTRO_STORAGE_KEY)).toBeNull();
  });

  it("blocks owners under 18", async () => {
    const user = userEvent.setup();
    const underage = new Date();
    underage.setFullYear(underage.getFullYear() - 17);
    seedDraft({ birthDate: underage.toISOString().slice(0, 10) });

    render(<RevendedorHeroSection />);
    await waitFor(() => expect(screen.getByLabelText("Nome da Loja *")).toHaveValue(filled.storeName));
    await user.click(screen.getByRole("button", { name: ADVANCE_BUTTON }));

    expect(screen.getByText("Você precisa ter pelo menos 18 anos para se cadastrar.")).toBeInTheDocument();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it("shows the errors step 2 sent back, with the full name on the first name field", async () => {
    seedDraft({});
    window.sessionStorage.setItem(
      CADASTRO_STEP1_ERROR_KEY,
      JSON.stringify({ name: "Informe nome e sobrenome.", instagram: "Informe o Instagram da loja." }),
    );

    render(<RevendedorHeroSection />);

    await waitFor(() => expect(screen.getByText("Informe nome e sobrenome.")).toBeInTheDocument());
    expect(screen.getByText("Informe o Instagram da loja.")).toBeInTheDocument();
    expect(window.sessionStorage.getItem(CADASTRO_STEP1_ERROR_KEY)).toBeNull();
  });

  it("keeps a draft when the visitor leaves the page", () => {
    const view = render(<RevendedorHeroSection />);

    fireEvent.change(screen.getByLabelText("Nome da Loja *"), { target: { value: "Loja Nova" } });
    view.unmount();

    expect(JSON.parse(window.sessionStorage.getItem(REVENDEDOR_STEP1_DRAFT_KEY) ?? "{}")).toMatchObject({
      storeName: "Loja Nova",
    });
  });
});
