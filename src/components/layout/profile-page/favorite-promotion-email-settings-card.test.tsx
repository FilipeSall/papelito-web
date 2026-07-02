import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FavoritePromotionEmailSettingsCard } from "./favorite-promotion-email-settings-card";

const fetchMock = vi.fn();
const signOutAndClearSessionMock = vi.fn();

vi.mock("@/features/auth/client/logout", () => ({
  signOutAndClearSession: (...args: unknown[]) => signOutAndClearSessionMock(...args),
}));

describe("FavoritePromotionEmailSettingsCard", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    signOutAndClearSessionMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("persists the toggle and shows success feedback", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        preferences: {
          favoritePromotionEmailEnabled: true,
        },
      }),
    });

    const user = userEvent.setup();
    render(<FavoritePromotionEmailSettingsCard initialEnabled={false} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/profile/preferences",
        expect.objectContaining({
          method: "PATCH",
        }),
      );
    });

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByText(/voce passara a receber e-mails/i),
    ).toBeInTheDocument();
  });

  it("reverts the optimistic state when the request fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        message: "Falha ao salvar.",
      }),
    });

    const user = userEvent.setup();
    render(<FavoritePromotionEmailSettingsCard initialEnabled={true} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Falha ao salvar.");
    });

    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("signs out when the session is no longer valid", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        message: "Nao autenticado.",
      }),
    });

    const user = userEvent.setup();
    render(<FavoritePromotionEmailSettingsCard initialEnabled={false} />);

    await user.click(screen.getByRole("switch"));

    await waitFor(() => {
      expect(signOutAndClearSessionMock).toHaveBeenCalledWith({ callbackUrl: "/entrar" });
    });
  });
});
