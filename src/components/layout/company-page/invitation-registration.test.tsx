import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InvitationRegistration } from "./invitation-registration";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

type FetchStep = { ok: boolean; status?: number; body: unknown };

function stubFetch(...steps: FetchStep[]) {
  const calls: string[] = [];
  let index = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      calls.push(url);
      const step = steps[Math.min(index, steps.length - 1)];
      index += 1;
      return Promise.resolve({
        ok: step.ok,
        status: step.status ?? (step.ok ? 200 : 400),
        json: () => Promise.resolve(step.body),
      });
    }),
  );
  return calls;
}

function invitation(accountExists: boolean, authMethods: Array<"password" | "google"> = []) {
  return {
    ok: true,
    body: {
      invitedEmail: "convidado@test.com",
      companyName: "CERRADO PAPEIS",
      companyCnpj: "99999003000148",
      accountExists,
      authMethods,
    },
  } satisfies FetchStep;
}

async function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText(/^nome/i), { target: { value: "Ana" } });
  fireEvent.change(screen.getByLabelText(/sobrenome/i), { target: { value: "Silva" } });
  fireEvent.change(screen.getByLabelText(/^cpf/i), { target: { value: "52998224725" } });
  fireEvent.change(screen.getByLabelText(/^senha/i), { target: { value: "SenhaForte123" } });
  fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
    target: { value: "SenhaForte123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));
}

describe("InvitationRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks for a password when the invited e-mail has no account yet", async () => {
    stubFetch(invitation(false));
    render(<InvitationRegistration />);

    expect(await screen.findByLabelText(/^senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^cpf/i)).toBeInTheDocument();
  });

  it("shows the inviting company's CNPJ read-only, and never sends it back", async () => {
    const calls = stubFetch(invitation(false), {
      ok: true,
      status: 201,
      body: { email: "convidado@test.com", requiresEmailVerification: true },
    });
    render(<InvitationRegistration />);

    const cnpj = await screen.findByLabelText(/cnpj da empresa/i);
    expect(cnpj).toHaveValue("99.999.003/0001-48");
    expect(cnpj).toBeDisabled();
    expect(cnpj).toHaveAttribute("readonly");

    // Alterar o campo na marra não muda nada: ele não tem `name`, então nunca entra no payload,
    // e a empresa continua vindo do convite (cookie do token) no backend.
    fireEvent.change(cnpj, { target: { value: "11.111.111/1111-11" } });
    await fillAndSubmit();

    await vi.waitFor(() => expect(calls).toContain("/api/auth/register-invitation"));
    const submitted = JSON.parse(
      (vi.mocked(fetch).mock.calls[1][1] as RequestInit).body as string,
    ) as Record<string, unknown>;
    expect(submitted).not.toHaveProperty("cnpj");
    expect(submitted).not.toHaveProperty("companyId");
    expect(submitted.cpf).toBe("529.982.247-25");
  });

  it("reveals each password field independently", async () => {
    stubFetch(invitation(false));
    render(<InvitationRegistration />);

    const password = await screen.findByLabelText(/^senha/i);
    const confirmation = screen.getByLabelText(/confirmar senha/i);
    const showButtons = screen.getAllByRole("button", { name: "Mostrar senha" });

    fireEvent.click(showButtons[0]);
    expect(password).toHaveAttribute("type", "text");
    expect(confirmation).toHaveAttribute("type", "password");

    fireEvent.click(showButtons[1]);
    expect(confirmation).toHaveAttribute("type", "text");

    fireEvent.click(screen.getAllByRole("button", { name: "Ocultar senha" })[0]);
    expect(password).toHaveAttribute("type", "password");
    expect(confirmation).toHaveAttribute("type", "text");
  });

  it("sends an existing account to login instead of failing the registration", async () => {
    stubFetch(invitation(true, ["password"]));
    render(<InvitationRegistration />);

    const login = await screen.findByRole("link", { name: /entrar para aceitar/i });
    expect(login).toHaveAttribute("href", "/entrar?callbackUrl=%2Fconvite");
    expect(screen.queryByLabelText(/confirmar senha/i)).not.toBeInTheDocument();
  });

  it("offers Google for an account that only signs in with Google", async () => {
    stubFetch(invitation(true, ["google"]));
    render(<InvitationRegistration />);

    expect(await screen.findByRole("link", { name: /entrar com google/i })).toBeInTheDocument();
  });

  it("routes to login when the backend reports the account is already verified", async () => {
    stubFetch(invitation(false), { ok: true, body: { requiresLogin: true } });
    render(<InvitationRegistration />);

    await screen.findByLabelText(/^senha/i);
    await fillAndSubmit();

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/entrar?callbackUrl=%2Fconvite"));
  });

  it("goes to e-mail confirmation when a new account is created", async () => {
    stubFetch(invitation(false), {
      ok: true,
      status: 201,
      body: { email: "convidado@test.com", requiresEmailVerification: true },
    });
    render(<InvitationRegistration />);

    await screen.findByLabelText(/^senha/i);
    await fillAndSubmit();

    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        "/confirmar-email?email=convidado%40test.com&callbackUrl=%2Fconvite",
      ),
    );
  });
});
