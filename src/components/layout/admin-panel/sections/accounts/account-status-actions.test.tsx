import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountStatusActions } from "./account-status-actions";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const postJson = vi.fn();
vi.mock("@/lib/client/post-json", () => ({
  postJson: (...args: unknown[]) => postJson(...args),
}));

function renderActions(overrides: Partial<Parameters<typeof AccountStatusActions>[0]> = {}) {
  return render(
    <AccountStatusActions
      accountStatus="active"
      canReactivate={false}
      canSuspend
      reactivateEndpoint="/api/admin/users/7/reactivate"
      statusHistory={[]}
      subjectLabel="Conta"
      subjectName="Maria Souza"
      suspendBlockedReason=""
      suspendEndpoint="/api/admin/users/7/suspend"
      suspension={null}
      {...overrides}
    />,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("AccountStatusActions", () => {
  it("não envia suspensão sem justificativa", async () => {
    const user = userEvent.setup();
    renderActions();

    await user.click(screen.getByRole("button", { name: /suspender/i }));

    const confirm = screen.getByRole("button", { name: "Confirmar suspensão" });
    expect(confirm).toBeDisabled();
    expect(postJson).not.toHaveBeenCalled();
  });

  it("continua bloqueado com justificativa curta demais", async () => {
    const user = userEvent.setup();
    renderActions();

    await user.click(screen.getByRole("button", { name: /suspender/i }));
    await user.type(screen.getByRole("textbox"), "abc");

    expect(screen.getByRole("button", { name: "Confirmar suspensão" })).toBeDisabled();
    expect(screen.getByText(/precisa descrever o motivo/i)).toBeInTheDocument();
  });

  it("envia a justificativa ao suspender", async () => {
    const user = userEvent.setup();
    postJson.mockResolvedValueOnce({ status: "suspended" });
    renderActions();

    await user.click(screen.getByRole("button", { name: /suspender/i }));
    await user.type(screen.getByRole("textbox"), "Fraude confirmada no pedido 1234.");
    await user.click(screen.getByRole("button", { name: "Confirmar suspensão" }));

    await waitFor(() =>
      expect(postJson).toHaveBeenCalledWith("/api/admin/users/7/suspend", {
        reason: "Fraude confirmada no pedido 1234.",
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("reativa sem exigir justificativa", async () => {
    const user = userEvent.setup();
    postJson.mockResolvedValueOnce({ status: "active" });
    renderActions({
      accountStatus: "suspended",
      canReactivate: true,
      canSuspend: false,
      suspension: {
        actorName: "Admin",
        actorUserId: 1,
        at: "2026-09-02 12:00:00",
        reason: "Fraude confirmada.",
      },
    });

    await user.click(screen.getByRole("button", { name: /reativar/i }));
    await user.click(screen.getByRole("button", { name: "Confirmar reativação" }));

    await waitFor(() =>
      expect(postJson).toHaveBeenCalledWith("/api/admin/users/7/reactivate", { reason: "" }),
    );
  });

  it("mostra o motivo do bloqueio quando a suspensão não é permitida", () => {
    renderActions({
      canSuspend: false,
      suspendBlockedReason: "Esta pessoa é o único titular ativo de uma empresa.",
    });

    expect(screen.queryByRole("button", { name: /suspender/i })).not.toBeInTheDocument();
    expect(screen.getByText(/único titular ativo/i)).toBeInTheDocument();
  });

  it("lista o histórico de suspensões", () => {
    renderActions({
      statusHistory: [
        {
          action: "reactivate",
          actorName: "Admin",
          actorUserId: 1,
          createdAt: "2026-09-02 15:00:00",
          reason: "Análise concluída.",
        },
        {
          action: "suspend",
          actorName: "Admin",
          actorUserId: 1,
          createdAt: "2026-09-01 10:00:00",
          reason: "Fraude confirmada.",
        },
      ],
    });

    expect(screen.getByText("Reativação")).toBeInTheDocument();
    expect(screen.getByText("Suspensão")).toBeInTheDocument();
    expect(screen.getByText("Análise concluída.")).toBeInTheDocument();
  });
});
