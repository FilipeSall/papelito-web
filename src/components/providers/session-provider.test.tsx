import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildIncompleteB2bSession } from "../../../test/factories/session";
import { SessionProvider } from "./session-provider";

const { replaceMock, refreshMock, useSessionMock, pathnameRef } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  refreshMock: vi.fn(),
  useSessionMock: vi.fn(),
  pathnameRef: { current: "/produtos" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameRef.current,
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSession: () => useSessionMock(),
}));

vi.mock("./auth-error-toast-host", () => ({ AuthErrorToastHost: () => null }));
vi.mock("./legacy-migration-notice", () => ({ LegacyMigrationNotice: () => null }));

describe("SessionProvider", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    refreshMock.mockReset();
    pathnameRef.current = "/produtos";
  });

  it("não redireciona usuário com onboarding incompleto em rota pública", async () => {
    // A proteção vive no gate server-side de proxy.ts. Um efeito de cliente aqui quicaria o
    // usuário para fora de páginas públicas depois do render.
    useSessionMock.mockReturnValue({
      data: buildIncompleteB2bSession(),
      status: "authenticated",
    });

    render(
      <SessionProvider>
        <p>catálogo</p>
      </SessionProvider>,
    );

    expect(await screen.findByText("catálogo")).toBeInTheDocument();
    await waitFor(() => expect(replaceMock).not.toHaveBeenCalled());
  });

  it("nunca manda ninguém para /perfil/empresa", async () => {
    useSessionMock.mockReturnValue({
      data: buildIncompleteB2bSession({ profileComplete: false }),
      status: "authenticated",
    });
    pathnameRef.current = "/perfil";

    render(
      <SessionProvider>
        <p>perfil</p>
      </SessionProvider>,
    );

    await waitFor(() => expect(screen.getByText("perfil")).toBeInTheDocument());
    expect(replaceMock).not.toHaveBeenCalledWith("/perfil/empresa");
  });
});
