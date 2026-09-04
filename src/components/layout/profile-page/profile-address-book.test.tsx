import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyProfileCustomer } from "@/features/profile/utils/profile-customer-mappers";
import type { CompanyDetails } from "@/features/company/types/company";
import { ProfileAddressBook } from "./profile-address-book";

const refreshMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
    replace: replaceMock,
  }),
}));

vi.mock("@/features/auth/client/logout", () => ({
  signOutAndClearSession: vi.fn(),
}));

vi.mock("@/features/checkout", () => ({
  useCepLookup: () => ({
    isLoading: false,
    error: null,
    fetchCep: vi.fn(),
  }),
}));

describe("ProfileAddressBook", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    replaceMock.mockReset();
  });

  it("opens the editor automatically and clears the query hint", async () => {
    render(
      <ProfileAddressBook
        customer={createEmptyProfileCustomer()}
        openEditorOnMount
      />,
    );

    expect(await screen.findByRole("button", { name: /salvar endereço/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/perfil/enderecos");
    });
  });

  it("keeps the editor closed when the query hint is absent", () => {
    render(<ProfileAddressBook customer={createEmptyProfileCustomer()} />);

    expect(screen.queryByRole("button", { name: /salvar endereço/i })).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("shows the active company's fiscal address as a read-only option", () => {
    const company: CompanyDetails = {
      legalName: "Cerrado Papeis LTDA",
      tradeName: "CERRADO PAPEIS",
      cnpj: "12345678000199",
      registryStatus: "active",
      ownershipStatus: "approved",
      status: "active",
      fiscalAddress: {
        street: "Rua das Flores",
        number: "123",
        neighborhood: "Centro",
        city: "Goiânia",
        state: "GO",
        cep: "74000-000",
      },
      providerSource: null,
      providerCheckedAt: null,
      billingEmail: null,
      billingEmailStatus: "unverified",
      phone: null,
    };

    render(<ProfileAddressBook company={company} customer={createEmptyProfileCustomer()} />);

    expect(screen.getByRole("heading", { name: "CERRADO PAPEIS" })).toBeInTheDocument();
    expect(screen.getByText("Rua das Flores, 123")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
  });
});
