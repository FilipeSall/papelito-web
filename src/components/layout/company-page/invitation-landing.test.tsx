import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InvitationLanding } from "./invitation-landing";

const companyClient = vi.hoisted(() => ({
  previewInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
  declineInvitation: vi.fn(),
}));

const nextAuth = vi.hoisted(() => ({
  signIn: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock("@/features/company/client/company-client", () => companyClient);
vi.mock("next-auth/react", () => nextAuth);
vi.mock("@/features/auth/client/logout", () => ({ signOutAndClearSession: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

type PreviewOverrides = {
  accountExists?: boolean;
  authMethods?: Array<"password" | "google">;
};

function givenPreview({ accountExists = false, authMethods = [] }: PreviewOverrides = {}) {
  companyClient.previewInvitation.mockResolvedValue({
    ok: true,
    data: {
      invitationId: 1,
      companyName: "CERRADO PAPEIS",
      invitedRole: "buyer",
      invitedEmail: "convidado@test.com",
      accountExists,
      authMethods,
    },
  });
}

function givenSession(email: string | null) {
  nextAuth.useSession.mockReturnValue({
    data: email ? { user: { email } } : null,
    status: email ? "authenticated" : "unauthenticated",
    update: vi.fn(),
  });
}

describe("InvitationLanding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    givenSession(null);
  });

  it("offers only account creation when the invited e-mail has no account", async () => {
    givenPreview({ accountExists: false });
    render(<InvitationLanding token="tok" />);

    const create = await screen.findByRole("link", { name: /criar conta e aceitar/i });
    expect(create).toHaveAttribute("href", "/convite/cadastro");
    expect(screen.queryByRole("button", { name: /entrar para aceitar/i })).not.toBeInTheDocument();
  });

  it("offers only login when the invited e-mail already has a password account", async () => {
    givenPreview({ accountExists: true, authMethods: ["password"] });
    render(<InvitationLanding token="tok" />);

    expect(await screen.findByRole("button", { name: /entrar para aceitar/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /criar conta e aceitar/i })).not.toBeInTheDocument();
  });

  it("never offers password login for an account that only signs in with Google", async () => {
    givenPreview({ accountExists: true, authMethods: ["google"] });
    render(<InvitationLanding token="tok" />);

    expect(await screen.findByRole("button", { name: /entrar com google/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /entrar para aceitar/i })).not.toBeInTheDocument();
  });

  it("lets the invited user accept when the session e-mail matches the invitation", async () => {
    givenSession("convidado@test.com");
    givenPreview({ accountExists: true, authMethods: ["password"] });
    render(<InvitationLanding token="tok" />);

    expect(await screen.findByRole("button", { name: /aceitar convite/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /recusar convite/i })).toBeInTheDocument();
  });

  it("asks to switch accounts instead of letting the backend refuse a mismatched e-mail", async () => {
    givenSession("outra@test.com");
    givenPreview({ accountExists: true, authMethods: ["password"] });
    render(<InvitationLanding token="tok" />);

    expect(await screen.findByRole("button", { name: /entrar com outra conta/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /aceitar convite/i })).not.toBeInTheDocument();
  });

  it("keeps the token out of the URL after validating it", async () => {
    givenPreview({ accountExists: false });
    const replaceState = vi.spyOn(window.history, "replaceState");
    render(<InvitationLanding token="tok" />);

    await waitFor(() => expect(replaceState).toHaveBeenCalledWith(null, "", "/convite"));
  });
});
