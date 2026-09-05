import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildIncompleteB2bSession,
  buildSession,
} from "../../../../test/factories/session";
import { MissingCepModalHost } from "./missing-cep-modal-host";

const pushMock = vi.fn();
const fetchMock = vi.fn();

let authState: {
  role?: string;
  session?: ReturnType<typeof buildSession> | null;
  status: "authenticated" | "loading" | "unauthenticated";
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => authState,
}));

describe("MissingCepModalHost", () => {
  beforeEach(() => {
    authState = {
      role: "customer",
      session: buildSession(),
      status: "authenticated",
    };
    pushMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("opens for authenticated customers without CEP", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        customer: {
          meta: {
            cep: "",
          },
        },
      }),
    });

    render(<MissingCepModalHost />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profile/account",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("does not open when the customer already has a valid CEP", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        customer: {
          meta: {
            cep: "01310-930",
          },
        },
      }),
    });

    render(<MissingCepModalHost />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not open when the B2B company has a fiscal CEP", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        company: {
          fiscalAddress: {
            cep: "30130-010",
          },
        },
        customer: {
          meta: {
            cep: "",
          },
        },
      }),
    });

    render(<MissingCepModalHost />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not open when the customer only has the CEP on the saved address", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        customer: {
          billing: {
            postcode: "",
          },
          meta: {
            cep: "",
          },
          shipping: {
            postcode: "01310-930",
          },
        },
      }),
    });

    render(<MissingCepModalHost />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ignores unauthenticated users and non-customer roles", () => {
    authState = {
      role: undefined,
      session: null,
      status: "unauthenticated",
    };

    render(<MissingCepModalHost />);

    expect(fetchMock).not.toHaveBeenCalled();

    authState = {
      role: "seller",
      session: buildSession({ role: "seller" }),
      status: "authenticated",
    };

    render(<MissingCepModalHost />);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not reopen in the same browser session after dismiss", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        customer: {
          meta: {
            cep: null,
          },
        },
      }),
    });

    const user = userEvent.setup();
    const { unmount } = render(<MissingCepModalHost />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /agora não/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(
      window.sessionStorage.getItem("papelito:missing-cep-modal:dismissed:42"),
    ).toBe("1");

    unmount();
    render(<MissingCepModalHost />);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("navigates to the address editor on confirmation", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        customer: {
          meta: {
            cep: "",
          },
        },
      }),
    });

    const user = userEvent.setup();
    render(<MissingCepModalHost />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cadastrar cep/i }));

    expect(pushMock).toHaveBeenCalledWith("/perfil/enderecos?openEditor=1");
    expect(
      window.sessionStorage.getItem("papelito:missing-cep-modal:dismissed:42"),
    ).toBe("1");
  });

  it("stays out of the way during B2B onboarding, where CEP is a form field", () => {
    authState = {
      role: "customer",
      session: buildIncompleteB2bSession(),
      status: "authenticated",
    };

    render(<MissingCepModalHost />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("aborts when the session does not expose a stable account key", () => {
    authState = {
      role: "customer",
      session: buildSession({
        user: {
          id: "",
          email: null,
        },
      }),
      status: "authenticated",
    };

    render(<MissingCepModalHost />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
