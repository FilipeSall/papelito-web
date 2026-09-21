import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminCompanyApplicationDetail, AdminOwnerApplications } from "@/lib/server/admin-users";

import { CompanyApplicationReview } from "./company-application-review";

const detail: AdminCompanyApplicationDetail = {
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
    documentPurgeStatus: "retained",
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

type ApplicationOverrides = Partial<AdminCompanyApplicationDetail["application"]>;

const AUTO_APPROVAL_TITLE = "✓ Documento não necessário";
const AUTO_APPROVAL_BODY =
  "Não foi necessário enviar um documento. Os dados informados foram validados automaticamente com os dados cadastrais e societários da empresa.";
const PURGED_BODY = "O documento não está disponível. Arquivos são eliminados após uma decisão terminal.";
const PURGED_FILE_NAME = "Nome removido após a decisão";

function renderApplication(overrides: ApplicationOverrides) {
  const current = { ...detail, application: { ...detail.application, ...overrides } };
  render(<CompanyApplicationReview initialData={{ current, history: [current] }} />);
}


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

  it("exibe o CNPJ com máscara e a data de nascimento por extenso sem perder o dia", () => {
    const originalTz = process.env.TZ;
    process.env.TZ = "America/Sao_Paulo";

    try {
      const current = {
        ...detail,
        person: { ...detail.person, birthDate: "1975-05-22" },
        company: { ...detail.company, cnpj: "99999003000148" },
      };

      render(<CompanyApplicationReview initialData={{ current, history: [current] }} />);

      expect(screen.getByText("99.999.003/0001-48")).toBeInTheDocument();
      expect(screen.getByText("22 de maio de 1975")).toBeInTheDocument();
      expect(screen.queryByText("1975-05-22")).not.toBeInTheDocument();
    } finally {
      process.env.TZ = originalTz;
    }
  });

  it("mantém o traço quando a data de nascimento não foi informada", () => {
    render(<CompanyApplicationReview initialData={initialData} />);

    const birthDate = screen.getByText("Data de nascimento").nextElementSibling;
    expect(birthDate).toHaveTextContent("—");
  });

  it("explica que o documento não foi necessário quando o CNPJ foi aprovado pelo QSA", () => {
    renderApplication({
      status: "auto_approved",
      decidedAt: "2026-09-01T12:00:00+00:00",
      documentAvailable: false,
      documentMime: null,
      documentPurgeStatus: "not_applicable",
      documentSize: null,
      fileName: null,
      submittedAt: null,
    });

    expect(screen.getByText(AUTO_APPROVAL_TITLE)).toBeInTheDocument();
    expect(screen.getByText(AUTO_APPROVAL_BODY)).toBeInTheDocument();
    expect(screen.queryByText(PURGED_BODY)).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(PURGED_FILE_NAME))).not.toBeInTheDocument();
  });

  it("usa a mesma explicação na pré-conta aprovada pelo QSA, que nunca teve arquivo", () => {
    renderApplication({
      status: "approved",
      decidedAt: "2026-09-01T12:00:00+00:00",
      documentAvailable: false,
      documentMime: null,
      documentPurgeStatus: "not_applicable",
      documentSize: null,
      fileName: null,
      submittedAt: null,
    });

    expect(screen.getByText(AUTO_APPROVAL_BODY)).toBeInTheDocument();
    expect(screen.queryByText(PURGED_BODY)).not.toBeInTheDocument();
  });

  it("mantém o aviso de arquivo eliminado quando o documento existiu e foi removido", () => {
    renderApplication({
      status: "approved",
      decidedAt: "2026-09-01T12:00:00+00:00",
      documentAvailable: false,
      documentPurgeStatus: "deleted",
      fileName: null,
    });

    expect(screen.getByText(PURGED_BODY)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(PURGED_FILE_NAME))).toBeInTheDocument();
    expect(screen.queryByText(AUTO_APPROVAL_TITLE)).not.toBeInTheDocument();
  });

  it("mantém o aviso de arquivo eliminado na candidatura reprovada com documento", () => {
    renderApplication({
      status: "rejected",
      decidedAt: "2026-09-01T12:00:00+00:00",
      documentAvailable: false,
      documentPurgeStatus: "deleted",
      fileName: null,
      rejectionReason: "Divergência no QSA.",
    });

    expect(screen.getByText(PURGED_BODY)).toBeInTheDocument();
    expect(screen.queryByText(AUTO_APPROVAL_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(AUTO_APPROVAL_BODY)).not.toBeInTheDocument();
  });

  it("não promete aprovação automática enquanto a candidatura aguarda o documento", () => {
    renderApplication({
      status: "document_required",
      canUpload: true,
      documentAvailable: false,
      documentMime: null,
      documentPurgeStatus: "not_applicable",
      documentSize: null,
      fileName: null,
      submittedAt: null,
    });

    expect(screen.getByText("Aguardando o documento")).toBeInTheDocument();
    expect(screen.queryByText(AUTO_APPROVAL_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(PURGED_BODY)).not.toBeInTheDocument();
  });

  it("não promete aprovação automática na candidatura reprovada que nunca teve documento", () => {
    renderApplication({
      status: "rejected",
      decidedAt: "2026-09-01T12:00:00+00:00",
      documentAvailable: false,
      documentMime: null,
      documentPurgeStatus: "not_applicable",
      documentSize: null,
      fileName: null,
      rejectionReason: "Divergência no QSA.",
      submittedAt: null,
    });

    expect(screen.getByText("Sem documento na candidatura")).toBeInTheDocument();
    expect(screen.queryByText(AUTO_APPROVAL_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(PURGED_BODY)).not.toBeInTheDocument();
  });

  it("mostra o documento e nenhum aviso enquanto a análise manual está aberta", () => {
    renderApplication({});

    expect(screen.getByRole("link", { name: "Abrir em nova aba" })).toBeInTheDocument();
    expect(screen.queryByText(PURGED_BODY)).not.toBeInTheDocument();
    expect(screen.queryByText(AUTO_APPROVAL_TITLE)).not.toBeInTheDocument();
  });

  it("mantém a reprovação desabilitada enquanto o motivo interno for curto demais", () => {
    render(<CompanyApplicationReview initialData={initialData} />);

    const rejectButton = screen.getByRole("button", { name: /reprovar e encerrar/i });
    expect(rejectButton).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "curto" } });
    expect(rejectButton).toBeDisabled();

    fireEvent.click(rejectButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("espaço em branco não conta para o mínimo do motivo interno", () => {
    render(<CompanyApplicationReview initialData={initialData} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "   qsa    " } });

    expect(screen.getByRole("button", { name: /reprovar e encerrar/i })).toBeDisabled();
  });

  it("libera a reprovação a partir de dez caracteres de motivo interno", async () => {
    render(<CompanyApplicationReview initialData={initialData} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "CPF diverge" } });

    const rejectButton = screen.getByRole("button", { name: /reprovar e encerrar/i });
    expect(rejectButton).toBeEnabled();

    fireEvent.click(rejectButton);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Confirmar reprovação");
  });
});
