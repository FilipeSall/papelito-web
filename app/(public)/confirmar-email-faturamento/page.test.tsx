import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ConfirmBillingEmailPage from "./page";

const searchParams = { current: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.current,
}));

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  searchParams.current = new URLSearchParams();
});

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("página de confirmação do e-mail de faturamento", () => {
  it("confirma com token válido", async () => {
    searchParams.current = new URLSearchParams({ token: "valido" });
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    render(<ConfirmBillingEmailPage />);

    expect(await screen.findByText(/E-mail de faturamento confirmado/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/company/billing-email/confirm",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ token: "valido" }) }),
    );
  });

  it("explica que o link expirou e como resolver", async () => {
    searchParams.current = new URLSearchParams({ token: "expirado" });
    fetchMock.mockResolvedValue(
      jsonResponse(410, { code: "papelito_b2b_billing_token_expired", message: "expirado" }),
    );

    render(<ConfirmBillingEmailPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/Este link expirou/i);
  });

  it("distingue link já utilizado de link expirado", async () => {
    searchParams.current = new URLSearchParams({ token: "usado" });
    fetchMock.mockResolvedValue(
      jsonResponse(404, { code: "papelito_b2b_invalid_billing_token", message: "invalido" }),
    );

    render(<ConfirmBillingEmailPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/já ter sido usado ou substituído/i);
  });

  it("encerra o loading em falha de rede", async () => {
    searchParams.current = new URLSearchParams({ token: "valido" });
    fetchMock.mockRejectedValue(new Error("offline"));

    render(<ConfirmBillingEmailPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/Erro de rede/i);
    expect(screen.queryByText(/Estamos validando/i)).not.toBeInTheDocument();
  });

  it("não chama a API quando o token está ausente", async () => {
    render(<ConfirmBillingEmailPage />);

    expect(
      await screen.findByText(/precisa ser aberto pelo link que enviamos/i),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // O token é de uso único: uma segunda chamada consumiria o já consumido e mostraria erro.
  it("não consome o token duas vezes", async () => {
    searchParams.current = new URLSearchParams({ token: "valido" });
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    const { rerender } = render(<ConfirmBillingEmailPage />);
    rerender(<ConfirmBillingEmailPage />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("oferece o caminho de volta para a empresa em erro e em sucesso", async () => {
    searchParams.current = new URLSearchParams({ token: "valido" });
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    render(<ConfirmBillingEmailPage />);

    const link = await screen.findByRole("link", { name: /Ir para a empresa/i });
    expect(link).toHaveAttribute("href", "/perfil/empresa");
  });
});
