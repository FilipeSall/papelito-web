import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VendorOrderActions } from "./vendor-order-actions";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const defaultProps = {
  generationErrorCode: "",
  generationStatus: "not_started" as const,
  hasShipment: false,
  manualFallbackAvailable: false,
  manualRegistrationEnabled: true,
  orderId: 11887,
  shippingService: "PAC CONTRATO AG",
  status: "em_separacao" as const,
  supportReviewRequired: false,
};

describe("VendorOrderActions manual fallback", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("starts with only automatic generation and reveals manual input after a safe failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        code: "papelito_correios_service_not_contracted",
        manual_fallback_available: true,
        message: "Contrato sem Pre-Postagem.",
      }),
      ok: false,
    }));
    render(<VendorOrderActions {...defaultProps} />);

    expect(screen.getByRole("button", { name: /gerar etiqueta dos correios/i })).toBeInTheDocument();
    expect(screen.getByText(/antes de gerar a etiqueta/i)).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /codigo de rastreamento/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /gerar etiqueta dos correios/i }));

    expect(await screen.findByRole("textbox", { name: /codigo de rastreamento/i })).toBeInTheDocument();
    expect(screen.getByText(/gere a postagem no portal dos correios/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /gerar etiqueta dos correios/i })).not.toBeInTheDocument();
  });

  it("does not reveal manual input for an uncertain creation result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        code: "papelito_correios_generation_uncertain",
        manual_fallback_available: false,
      }),
      ok: false,
    }));
    render(<VendorOrderActions {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /gerar etiqueta dos correios/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.queryByRole("textbox", { name: /codigo de rastreamento/i })).not.toBeInTheDocument();
  });

  it("explains an uncertain persisted generation without exposing manual input", () => {
    render(
      <VendorOrderActions
        {...defaultProps}
        generationStatus="uncertain"
        hasShipment
      />,
    );

    expect(screen.getByText(/verificando a solicitacao enviada/i)).toBeInTheDocument();
    expect(screen.getByText(/temporariamente bloqueada para evitar etiquetas duplicadas/i)).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /codigo de rastreamento/i })).not.toBeInTheDocument();
  });

  it("restores a persisted safe fallback after refresh", () => {
    render(
      <VendorOrderActions
        {...defaultProps}
        generationErrorCode="papelito_correios_dev_health_unhealthy"
        generationStatus="failed"
        manualFallbackAvailable
      />,
    );

    expect(screen.getByRole("textbox", { name: /codigo de rastreamento/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tentar geracao simulada novamente/i })).toBeInTheDocument();
    expect(screen.getByText(/cadastro manual liberado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/observacao/i)).toBeInTheDocument();
  });
});
