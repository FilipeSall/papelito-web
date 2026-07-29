import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingSuccessToastHost } from "./onboarding-success-toast-host";

type SessionShape = {
  user?: { id?: string };
  accessToken?: string;
  b2b?: { onboardingStatus?: string };
};

let sessionData: SessionShape | null = null;
let sessionStatus = "authenticated";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: sessionData, status: sessionStatus }),
}));

function authenticatedSession(onboardingStatus: string, id = "42"): SessionShape {
  return { user: { id }, accessToken: "token", b2b: { onboardingStatus } };
}

function mockClaim(shown: boolean, firstName = "Filipe") {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ shown, firstName: shown ? firstName : "" }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("OnboardingSuccessToastHost", () => {
  beforeEach(() => {
    sessionData = null;
    sessionStatus = "authenticated";
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("não exibe nada nem reivindica quando o usuário não está autenticado", async () => {
    const fetchMock = mockClaim(true);
    sessionStatus = "unauthenticated";
    sessionData = null;

    render(<OnboardingSuccessToastHost />);

    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("não reivindica enquanto o cadastro está incompleto (e-mail pendente)", async () => {
    const fetchMock = mockClaim(true);
    sessionData = authenticatedSession("incomplete");

    render(<OnboardingSuccessToastHost />);

    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("não reivindica quando a conta ainda não foi aprovada", async () => {
    const fetchMock = mockClaim(true);
    sessionData = authenticatedSession("pending");

    render(<OnboardingSuccessToastHost />);

    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("exibe o toast quando o servidor concede o claim", async () => {
    const fetchMock = mockClaim(true);
    sessionData = authenticatedSession("complete");

    render(<OnboardingSuccessToastHost />);

    const toast = await screen.findByRole("status");

    expect(toast).toHaveTextContent("Conta criada com sucesso");
    expect(toast).toHaveTextContent("Bem-vindo, Filipe");
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/welcome-toast", { method: "POST" });
  });

  it("não exibe quando o servidor nega o claim (refresh, novo login, outro dispositivo)", async () => {
    const fetchMock = mockClaim(false);
    sessionData = authenticatedSession("complete");

    render(<OnboardingSuccessToastHost />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  });

  it("não exibe quando o claim falha na rede", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    sessionData = authenticatedSession("complete");

    render(<OnboardingSuccessToastHost />);

    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  });

  it("não reivindica de novo em um novo mount depois de uma negativa", async () => {
    const fetchMock = mockClaim(false);
    sessionData = authenticatedSession("complete");

    const view = render(<OnboardingSuccessToastHost />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    view.unmount();

    render(<OnboardingSuccessToastHost />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("reivindica uma única vez quando a aprovação chega na sessão já aberta", async () => {
    const fetchMock = mockClaim(true);
    sessionData = authenticatedSession("pending");

    const view = render(<OnboardingSuccessToastHost />);
    expect(fetchMock).not.toHaveBeenCalled();

    sessionData = authenticatedSession("complete");
    view.rerender(<OnboardingSuccessToastHost />);

    await screen.findByRole("status");

    view.rerender(<OnboardingSuccessToastHost />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
