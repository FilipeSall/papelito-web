import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CompanyMembersSection } from "./company-members-section";

const listMembersMock = vi.fn();

vi.mock("@/features/company/client/company-client", () => ({
  listMembers: () => listMembersMock(),
  patchMember: vi.fn(),
  removeMember: vi.fn(),
  transferOwnership: vi.fn(),
}));

describe("CompanyMembersSection (permissões visuais)", () => {
  it("buyer não vê a lista de membros", () => {
    render(<CompanyMembersSection viewerRole="buyer" onChanged={() => {}} />);
    expect(screen.getByText(/somente titular e administrador/i)).toBeInTheDocument();
    expect(listMembersMock).not.toHaveBeenCalled();
  });

  it("viewer não vê a lista de membros", () => {
    render(<CompanyMembersSection viewerRole="viewer" onChanged={() => {}} />);
    expect(screen.getByText(/somente titular e administrador/i)).toBeInTheDocument();
  });

  it("owner carrega e renderiza membros; owner não pode ser suspenso/removido", async () => {
    listMembersMock.mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            memberId: 1,
            userId: 1,
            displayName: "Dona",
            email: "owner@acme.com",
            role: "owner",
            status: "active",
            origin: "owner_candidate",
            expiresAt: null,
          },
          {
            memberId: 2,
            userId: 2,
            displayName: "Comprador",
            email: "buyer@acme.com",
            role: "buyer",
            status: "active",
            origin: "invitation",
            expiresAt: null,
          },
        ],
      },
    });

    render(<CompanyMembersSection viewerRole="owner" onChanged={() => {}} />);

    await waitFor(() => expect(screen.getByText("owner@acme.com")).toBeInTheDocument());
    expect(screen.getByText("buyer@acme.com")).toBeInTheDocument();

    // O botão de suspender do owner (memberId 1) fica desabilitado (proteção do último owner).
    // O buyer (memberId 2) tem ações habilitadas.
    const suspendButtons = screen.getAllByRole("button", { name: /suspender/i });
    // Um dos suspend pertence ao owner e deve estar disabled.
    expect(suspendButtons.some((b) => (b as HTMLButtonElement).disabled)).toBe(true);
  });
});
