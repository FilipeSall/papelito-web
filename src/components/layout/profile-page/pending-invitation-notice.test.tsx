import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { COMPANY_INVITATION_TOKEN } from "../../../../test/msw/handlers/company";

import { PendingInvitationNotice } from "./pending-invitation-notice";

const cookieStore = { value: undefined as string | undefined };

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "papelito_invite_token" && cookieStore.value !== undefined
          ? { name, value: cookieStore.value }
          : undefined,
    }),
}));

async function renderNotice() {
  render(await PendingInvitationNotice());
}

describe("PendingInvitationNotice", () => {
  beforeEach(() => {
    cookieStore.value = undefined;
  });

  it("não renderiza nada e não faz requisição quando não há cookie de convite", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await renderNotice();

    expect(screen.queryByText("Convite pendente")).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("mostra a empresa do convite quando o cookie existe", async () => {
    cookieStore.value = COMPANY_INVITATION_TOKEN;

    await renderNotice();

    expect(screen.getByText("Convite pendente")).toBeInTheDocument();
    expect(
      screen.getByText("Entre para concluir seu vínculo com Papelaria Central."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continuar convite" })).toHaveAttribute(
      "href",
      "/convite",
    );
  });

  it("não renderiza nada quando o convite do cookie não existe mais", async () => {
    cookieStore.value = "convite-expirado";

    await renderNotice();

    expect(screen.queryByText("Convite pendente")).not.toBeInTheDocument();
  });
});
