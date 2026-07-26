import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildSession } from "../../../test/factories/session";
import { AuthErrorToastHost } from "./auth-error-toast-host";

let authState: {
  authIdentityError: boolean;
  session?: ReturnType<typeof buildSession> | null;
  status: "authenticated" | "loading" | "unauthenticated";
};

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => authState,
}));

describe("AuthErrorToastHost", () => {
  beforeEach(() => {
    authState = {
      authIdentityError: false,
      session: buildSession(),
      status: "authenticated",
    };
  });

  it("shows an error toast when the authentication identity lookup failed", async () => {
    authState = {
      authIdentityError: true,
      session: buildSession({ authIdentityError: true }),
      status: "authenticated",
    };

    render(<AuthErrorToastHost />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/autentica/i);
  });

  it("removes the toast when the user closes it", async () => {
    const user = userEvent.setup();
    authState = {
      authIdentityError: true,
      session: buildSession({ authIdentityError: true }),
      status: "authenticated",
    };

    render(<AuthErrorToastHost />);

    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: /fechar notifica/i }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("shows the toast again when a later identity lookup fails", async () => {
    const user = userEvent.setup();
    authState = {
      authIdentityError: true,
      session: buildSession({ authIdentityError: true }),
      status: "authenticated",
    };

    const { rerender } = render(<AuthErrorToastHost />);

    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: /fechar notifica/i }));

    authState = {
      authIdentityError: false,
      session: buildSession(),
      status: "authenticated",
    };
    rerender(<AuthErrorToastHost />);

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    authState = {
      authIdentityError: true,
      session: buildSession({ authIdentityError: true }),
      status: "authenticated",
    };
    rerender(<AuthErrorToastHost />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("does not show anything when there is no authentication error", async () => {
    render(<AuthErrorToastHost />);

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
