import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminOwnerApplications } from "@/lib/server/admin-users";

import { CompanyApplicationReview } from "./company-application-review";

const detail: AdminOwnerApplications["current"] = {
  application: {
    applicationId: 42,
    companyId: 7,
    attemptNumber: 1,
    status: "pending_manual_review",
    fileName: "contrato.pdf",
    submittedAt: "2026-08-30T12:00:00+00:00",
    decidedAt: null,
    canUpload: false,
    canRestart: false,
    documentMime: "application/pdf",
    documentSize: 1024,
    documentAvailable: true,
    documentPurgeStatus: "kept",
    rejectionReason: null,
    decidedByUserId: null,
  },
  person: {
    userId: 3,
    fullName: "Titular de Teste",
    email: "titular@example.test",
    cpf: "***.456.789-**",
    birthDate: null,
    phone: null,
  },
  company: {
    id: 7,
    cnpj: "00.000.000/0000-00",
    legalName: "Papelaria Teste LTDA",
    tradeName: "Papelaria Teste",
    registryStatus: "active",
    ownershipStatus: "confirmed",
    companyStatus: "pending",
    providerSource: "provider",
    providerCheckedAt: "2026-09-01T00:09:14+00:00",
    fiscalAddress: {
      cep: "70000-000",
      state: "DF",
      city: "Brasília",
      neighborhood: "Asa Norte",
      street: "Quadra 1",
      number: "10",
      complement: null,
    },
  },
  membership: { role: "owner", status: "active" },
  evidence: { mei_confirmed: false },
};

const initialData: AdminOwnerApplications = { current: detail, history: [detail] };

describe("CompanyApplicationReview", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("pede a confirmação da aprovação em um modal, não no alert do navegador", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => detail,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CompanyApplicationReview initialData={initialData} />);

    fireEvent.click(screen.getByRole("button", { name: /aprovar cadastro/i }));

    expect(window.confirm).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Confirmar aprovação");
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Aprovar cadastro" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toContain("/42/approve");

    vi.unstubAllGlobals();
  });

  it("cancelar fecha o modal sem decidir a candidatura", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<CompanyApplicationReview initialData={initialData} />);

    fireEvent.click(screen.getByRole("button", { name: /aprovar cadastro/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("não abre o modal de reprovação sem o motivo interno", () => {
    render(<CompanyApplicationReview initialData={initialData} />);

    fireEvent.click(screen.getByRole("button", { name: /reprovar e encerrar/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Informe o motivo interno da reprovação.")).toBeInTheDocument();
  });
});
