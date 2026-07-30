import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CompanyInvitationsSection } from "./company-invitations-section";

const companyClient = vi.hoisted(() => ({
  createInvitation: vi.fn(),
  listInvitations: vi.fn(),
  resendInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
}));

vi.mock("@/features/company/client/company-client", () => companyClient);

describe("CompanyInvitationsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    companyClient.listInvitations.mockResolvedValue({ ok: true, data: { items: [] } });
  });

  it("allows an invitation for an e-mail that may already have an account", async () => {
    companyClient.createInvitation.mockResolvedValue({ ok: true, data: { invitationId: 1 } });
    render(<CompanyInvitationsSection viewerRole="owner" />);

    fireEvent.change(screen.getByLabelText("E-mail *"), {
      target: { value: "admin@papelito.test" },
    });

    const button = screen.getByRole("button", { name: "Convidar" });
    fireEvent.click(button);
    expect(companyClient.createInvitation).toHaveBeenCalledWith({
      invited_email: "admin@papelito.test",
      invited_role: "buyer",
    });
    expect(screen.queryByLabelText(/CPF/i)).not.toBeInTheDocument();
  });
});
