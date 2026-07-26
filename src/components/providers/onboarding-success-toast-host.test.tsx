import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ONBOARDING_SUCCESS_TOAST_KEY,
  OnboardingSuccessToastHost,
} from "./onboarding-success-toast-host";

let pathname = "/cadastro/completar";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

describe("OnboardingSuccessToastHost", () => {
  beforeEach(() => {
    pathname = "/cadastro/completar";
    window.sessionStorage.clear();
  });

  it("shows the welcome toast once after the onboarding redirect", async () => {
    const view = render(<OnboardingSuccessToastHost />);
    window.sessionStorage.setItem(ONBOARDING_SUCCESS_TOAST_KEY, "Filipe");
    pathname = "/";
    view.rerender(<OnboardingSuccessToastHost />);

    const toast = await screen.findByRole("status");

    expect(toast).toHaveTextContent("Conta criada com sucesso");
    expect(toast).toHaveTextContent("Bem-vindo, Filipe");
    expect(window.sessionStorage.getItem(ONBOARDING_SUCCESS_TOAST_KEY)).toBeNull();
  });
});
