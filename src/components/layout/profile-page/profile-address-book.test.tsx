import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyProfileCustomer } from "@/features/profile/utils/profile-customer-mappers";
import { ProfileAddressBook } from "./profile-address-book";

const refreshMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
    replace: replaceMock,
  }),
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
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

    expect(await screen.findByRole("button", { name: /salvar endereco/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/perfil/enderecos");
    });
  });

  it("keeps the editor closed when the query hint is absent", () => {
    render(<ProfileAddressBook customer={createEmptyProfileCustomer()} />);

    expect(screen.queryByRole("button", { name: /salvar endereco/i })).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
