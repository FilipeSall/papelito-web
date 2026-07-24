import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompanyOnboardingForm } from "./company-onboarding-form";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("CompanyOnboardingForm", () => {
  afterEach(() => vi.restoreAllMocks());

  it("salva identidade e cria empresa", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response({ identityStatus: "verified" }))
      .mockResolvedValueOnce(response({ companyId: 10 }));
    const onComplete = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    render(<CompanyOnboardingForm onComplete={onComplete} />);
    fireEvent.change(screen.getByLabelText("CPF"), { target: { value: "52998224725" } });
    fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: "1990-01-01" } });
    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "01310000" } });
    fireEvent.change(screen.getByLabelText("CNPJ da empresa"), { target: { value: "11222333000181" } });
    fireEvent.submit(screen.getByRole("button", { name: "Continuar" }).closest("form")!);

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/company");
  });

  it("salva identidade e solicita acesso", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response({ identityStatus: "verified" }))
      .mockResolvedValueOnce(response({ status: "received" }));
    const onComplete = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    render(<CompanyOnboardingForm onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "Solicitar acesso" }));
    fireEvent.change(screen.getByLabelText("CPF"), { target: { value: "52998224725" } });
    fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: "1990-01-01" } });
    fireEvent.change(screen.getByLabelText("CEP"), { target: { value: "01310000" } });
    fireEvent.change(screen.getByLabelText("CNPJ da empresa"), { target: { value: "11222333000181" } });
    fireEvent.submit(screen.getByRole("button", { name: "Continuar" }).closest("form")!);

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/company/request-access");
  });
});
