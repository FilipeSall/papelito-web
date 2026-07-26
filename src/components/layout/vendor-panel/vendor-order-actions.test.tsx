import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VendorOrderActions } from "./vendor-order-actions";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

const props = {
  manualRegistrationEnabled: true,
  orderId: 11887,
  shipments: [],
  shippingService: "PAC",
  status: "em_separacao" as const,
};

describe("VendorOrderActions manual shipping", () => {
  beforeEach(() => { refreshMock.mockReset(); vi.unstubAllGlobals(); });

  it("shows manual shipping without automatic label generation", () => {
    render(<VendorOrderActions {...props} />);
    expect(screen.getByText(/enviar pelos correios/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /código de rastreamento/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /gerar etiqueta/i })).not.toBeInTheDocument();
  });

  it("rejects an empty or invalid tracking code before requesting the API", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<VendorOrderActions {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /revisar envio/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/código s10 válido/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires a review before confirming the shipment", () => {
    render(<VendorOrderActions {...props} />);
    fireEvent.change(screen.getByRole("textbox", { name: /código de rastreamento/i }), { target: { value: "AA123456789BR" } });
    fireEvent.click(screen.getByRole("button", { name: /revisar envio/i }));
    expect(screen.getByRole("button", { name: /confirmar envio/i })).toBeInTheDocument();
  });

  it("confirms a valid code through the manual endpoint only once", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchMock);
    render(<VendorOrderActions {...props} />);
    fireEvent.change(screen.getByRole("textbox", { name: /código de rastreamento/i }), { target: { value: "AA123456789BR" } });
    fireEvent.click(screen.getByRole("button", { name: /revisar envio/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar envio/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/vendor/orders/11887/shipments/manual");
  });

  it("preserves the shipment posting date while correcting its code", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchMock);
    render(<VendorOrderActions {...props} shipments={[{
      creationOutcome: "created", deliveredAt: "", generationStatus: "generated", hasError: false, id: 4,
      isTest: false, labelAvailable: false, lastEventAt: "", lastEventCode: "", lastEventDescription: "", lastEventLocation: "", lastEventType: "",
      nextReconciliationAt: "", postedAt: "2026-07-10", provider: "manual", reconciliationAttempts: 0, reconciliationStatus: "none", serviceCode: "PAC", status: "posted", supportReviewRequired: false, trackingCode: "AA123456789BR",
    }]} status="enviado" />);
    fireEvent.click(screen.getByRole("button", { name: /corrigir código/i }));
    fireEvent.change(screen.getByDisplayValue("AA123456789BR"), { target: { value: "BB123456789BR" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar correção/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][1].body).toContain("2026-07-10");
  });
});
