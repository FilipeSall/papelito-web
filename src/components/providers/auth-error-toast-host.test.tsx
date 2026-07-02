import { render, screen, waitFor } from "@testing-library/react";
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

  it("does not show anything when there is no authentication error", async () => {
    render(<AuthErrorToastHost />);

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
