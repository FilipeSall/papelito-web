import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { VendorBraspressIntegration } from "@/features/vendor-settings/types/vendor-braspress";

import { VendorBraspressSection } from "./vendor-braspress-section";

const integration: VendorBraspressIntegration = {
  provider: "braspress",
  enabled: true,
  status: "active",
  configurationVersion: 3,
  configured: true,
  credentialsConfigured: true,
  loadFailed: false,
  config: {
    senderCnpj: "12345678000195",
    originCep: "01310930",
    modal: "R",
    freightType: "1",
    consigneeCnpj: "",
    weightUnit: "kg",
    quoteTimezone: "America/Sao_Paulo",
    trackingTomadorCnpj: "12345678000195",
  },
};

describe("VendorBraspressSection", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("requires the current password and explicit confirmation to remove credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...integration,
        enabled: false,
        credentialsConfigured: false,
        configurationVersion: 4,
        status: "unconfigured",
        config: {
          senderCnpj: "",
          originCep: "",
          modal: "",
          freightType: "",
          consigneeCnpj: "",
          weightUnit: "",
          quoteTimezone: "",
          trackingTomadorCnpj: "",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.click(screen.getByRole("button", { name: /remover integração e credenciais/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar remoção/i }));
    expect(screen.getByText(/confirme sua senha atual para remover/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/sua senha atual/i), { target: { value: "senha-atual" } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar remoção/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/vendor/braspress");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
    expect(fetchMock.mock.calls[0][1].body).toContain("senha-atual");
    expect(await screen.findByText(/integração braspress e credenciais removidas/i)).toBeInTheDocument();
  });

  it("shows a recoverable message when saving fails before a response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.change(screen.getByLabelText(/sua senha atual/i), { target: { value: "senha-atual" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    expect(await screen.findByText(/não foi possível falar com o servidor/i)).toBeInTheDocument();
  });
});
