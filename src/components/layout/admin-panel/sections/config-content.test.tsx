import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import {
  getContactConfigPhone,
  setContactConfigPhone,
} from "../../../../../test/msw/handlers/contact-config";
import { ConfigContent } from "./config-content";

describe("ConfigContent", () => {
  it("always requires the current password", () => {
    render(<ConfigContent />);

    expect(screen.getByText("Senha atual")).toBeInTheDocument();
    expect(screen.getByText("Nova senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /atualizar senha/i })).toBeInTheDocument();
  });

  it("loads the stored contact phone already masked and defaulted to Brazil", async () => {
    setContactConfigPhone("+5561999999999");
    render(<ConfigContent />);

    await waitFor(() => {
      expect(screen.getByLabelText("Número de telefone")).toHaveValue("(61) 99999-9999");
    });
    expect(screen.getByRole("button", { name: /🇧🇷 \+55/ })).toBeInTheDocument();
  });

  it("saves the phone normalized to E.164", async () => {
    setContactConfigPhone("+5561999999999");
    const user = userEvent.setup();
    render(<ConfigContent />);

    const field = await screen.findByLabelText("Número de telefone");
    await user.clear(field);
    await user.type(field, "6133334444");

    expect(field).toHaveValue("(61) 3333-4444");

    await user.click(screen.getByRole("button", { name: /salvar telefone/i }));

    expect(await screen.findByText("Telefone salvo.")).toBeInTheDocument();
    expect(getContactConfigPhone()).toBe("+556133334444");
  });

  it("shows only masked integration metadata", async () => {
    render(<ConfigContent />);

    expect(await screen.findByText("ID de medição do GA4")).toBeInTheDocument();
    expect(screen.getByText(/termina em 1234/i)).toBeInTheDocument();
    expect(screen.queryByText("GA4_MEASUREMENT_ID")).not.toBeInTheDocument();
  });
});
