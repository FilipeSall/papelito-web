import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { VendorRegistrationStep1Data } from "@/features/revendedor";

import { RevendedorHeroSection } from "./revendedor-hero-section";

const initialValues: VendorRegistrationStep1Data = {
  storeName: "Loja Papelito",
  firstName: "Ana",
  lastName: "Souza",
  cnpj: "12.345.678/0001-95",
  phone: "(11) 98765-4321",
  email: "ana@example.com",
  instagram: "papelito",
  hasSoldPapelito: "sim",
  discoveryChannel: "",
};

function renderHero(isAuthenticated: boolean, role?: string) {
  return render(
    <RevendedorHeroSection
      interest={null}
      initialValues={initialValues}
      isAuthenticated={isAuthenticated}
      role={role}
    />,
  );
}

describe("RevendedorHeroSection", () => {
  it("allows a visitor to submit the triage", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ interest: { id: 1 } }), { status: 201 }),
    );

    renderHero(false);

    expect(screen.getByLabelText("Nome da Loja *")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Enviar interesse/i }));

    await waitFor(() => expect(screen.getByText("Recebemos seus dados")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/revendedor/interest",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("keeps the customer submission flow enabled", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ interest: { id: 2 } }), { status: 201 }),
    );

    renderHero(true, "customer");

    expect(screen.getByLabelText("E-mail *")).toHaveValue("ana@example.com");
    await user.click(screen.getByRole("button", { name: /Enviar interesse/i }));

    await waitFor(() => expect(screen.getByText("Recebemos seus dados")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps non-customer authenticated sessions blocked", () => {
    renderHero(true, "seller");

    expect(screen.queryByRole("button", { name: /Enviar interesse/i })).not.toBeInTheDocument();
    expect(screen.getByText(/somente para contas de customer/i)).toBeInTheDocument();
  });
});
