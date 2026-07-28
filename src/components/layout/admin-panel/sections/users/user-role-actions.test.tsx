import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserRoleActions } from "./user-role-actions";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const postJson = vi.fn();
vi.mock("@/lib/client/post-json", () => ({
  postJson: (...args: unknown[]) => postJson(...args),
}));

const availableActions = {
  canConvertSellerToCustomer: false,
  canDemoteAdministrator: false,
  canPromoteToAdministrator: false,
  canUseVendorRedirect: false,
  currentRole: "customer",
  isSelf: false,
};

function renderActions(emailVerificationStatus: string) {
  return render(
    <UserRoleActions
      availableActions={availableActions}
      emailVerificationStatus={emailVerificationStatus}
      userId={42}
      userName="Fulano de Tal"
    />,
  );
}

const BUTTON = /ativar sem confirmar e-mail/i;

afterEach(() => {
  vi.clearAllMocks();
});

describe("UserRoleActions - manual email activation", () => {
  it("hides the activation button when the email is already verified", () => {
    renderActions("verified");

    expect(screen.queryByRole("button", { name: BUTTON })).not.toBeInTheDocument();
  });

  it("shows the activation button when the email is pending", () => {
    renderActions("pending");

    expect(screen.getByRole("button", { name: BUTTON })).toBeInTheDocument();
  });

  it("opens the confirmation dialog without calling postJson yet", async () => {
    const user = userEvent.setup();
    renderActions("pending");

    await user.click(screen.getByRole("button", { name: BUTTON }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(postJson).not.toHaveBeenCalled();
  });

  it("closes the dialog and does not call postJson when canceling", async () => {
    const user = userEvent.setup();
    renderActions("pending");

    await user.click(screen.getByRole("button", { name: BUTTON }));
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(postJson).not.toHaveBeenCalled();
  });

  it("calls postJson with the activate-email endpoint when confirming", async () => {
    postJson.mockResolvedValue({});
    const user = userEvent.setup();
    renderActions("pending");

    await user.click(screen.getByRole("button", { name: BUTTON }));
    await user.click(screen.getByRole("button", { name: /confirmar ativacao/i }));

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith("/api/admin/users/42/activate-email");
    });
  });

  it("refreshes the router and shows a success status after activation succeeds", async () => {
    postJson.mockResolvedValue({});
    const user = userEvent.setup();
    renderActions("pending");

    await user.click(screen.getByRole("button", { name: BUTTON }));
    await user.click(screen.getByRole("button", { name: /confirmar ativacao/i }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/usuário ativado/i);
  });

  it("shows the error message when activation fails", async () => {
    postJson.mockRejectedValue(new Error("Conta não esta com e-mail pendente."));
    const user = userEvent.setup();
    renderActions("pending");

    await user.click(screen.getByRole("button", { name: BUTTON }));
    await user.click(screen.getByRole("button", { name: /confirmar ativacao/i }));

    await waitFor(() => {
      expect(screen.getByText("Conta não esta com e-mail pendente.")).toBeInTheDocument();
    });
  });
});
