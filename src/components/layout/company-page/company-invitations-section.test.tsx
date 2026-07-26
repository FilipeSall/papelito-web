import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CompanyInvitationsSection } from "./company-invitations-section";

const companyClient = vi.hoisted(() => ({
  checkInvitationEligibility: vi.fn(),
  createInvitation: vi.fn(),
  listInvitations: vi.fn(),
  resendInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { email: "admin@papelito.test" } } }),
}));

vi.mock("@/features/company/client/company-client", () => companyClient);

describe("CompanyInvitationsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    companyClient.listInvitations.mockResolvedValue({ ok: true, data: { items: [] } });
  });

  it("blocks an invitation to the signed-in email before making an eligibility request", async () => {
    render(<CompanyInvitationsSection viewerRole="owner" />);

    fireEvent.change(screen.getByLabelText("E-mail *"), {
      target: { value: "admin@papelito.test" },
    });

    const button = screen.getByRole("button", { name: "Convidar" });
    expect(button).toBeDisabled();
    expect(companyClient.checkInvitationEligibility).not.toHaveBeenCalled();
    expect(screen.getByText("Este e-mail já está cadastrado na Papelito.")).toBeInTheDocument();
  });
});
