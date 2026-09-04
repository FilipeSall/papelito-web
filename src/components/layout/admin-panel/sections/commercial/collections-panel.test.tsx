import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CollectionsPanel } from "./collections-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const DEFAULT_CONFIG = {
  newArrivals: { expirationDays: 0, limit: 10 },
  promotions: { limit: 0 },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CollectionsPanel", () => {
  it("abre com o padrão: dez produtos e sem prazo", () => {
    render(<CollectionsPanel initialConfig={DEFAULT_CONFIG} initialIssues={[]} />);

    expect(screen.getByLabelText(/quantidade de produtos/i)).toHaveValue(10);
    expect(screen.getByRole("radio", { name: /sem prazo de expiração/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /sem teto/i })).toBeChecked();
  });

  it("envia prazo zero quando a opção sem prazo está ativa", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => DEFAULT_CONFIG, ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<CollectionsPanel initialConfig={DEFAULT_CONFIG} initialIssues={[]} />);
    await user.click(screen.getByRole("button", { name: /salvar coleções/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/collections-config", {
      body: JSON.stringify({
        newArrivals: { expirationDays: 0, limit: 10 },
        promotions: { limit: 0 },
      }),
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      method: "PUT",
    });
  });

  it("envia o prazo em dias quando o administrador escolhe expirar", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ ...DEFAULT_CONFIG, newArrivals: { expirationDays: 30, limit: 10 } }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CollectionsPanel initialConfig={DEFAULT_CONFIG} initialIssues={[]} />);

    await user.click(screen.getByRole("radio", { name: /expira em/i }));
    await user.click(screen.getByRole("button", { name: /salvar coleções/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/collections-config",
      expect.objectContaining({
        body: JSON.stringify({
          newArrivals: { expirationDays: 30, limit: 10 },
          promotions: { limit: 0 },
        }),
      }),
    );
  });

  it("recusa quantidade fora da faixa antes de chamar a API", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<CollectionsPanel initialConfig={DEFAULT_CONFIG} initialIssues={[]} />);

    const limit = screen.getByLabelText(/quantidade de produtos/i);
    await user.clear(limit);
    await user.type(limit, "90");
    await user.click(screen.getByRole("button", { name: /salvar coleções/i }));

    expect(screen.getByText(/entre 1 e 60 produtos em recém-chegados/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envia o teto de promoções quando ele é ativado", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ ...DEFAULT_CONFIG, promotions: { limit: 12 } }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CollectionsPanel initialConfig={DEFAULT_CONFIG} initialIssues={[]} />);

    await user.click(screen.getByRole("radio", { name: /no máximo/i }));
    await user.click(screen.getByRole("button", { name: /salvar coleções/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/collections-config",
      expect.objectContaining({
        body: JSON.stringify({
          newArrivals: { expirationDays: 0, limit: 10 },
          promotions: { limit: 12 },
        }),
      }),
    );
  });

  it("mostra a mensagem que o backend devolveu", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ message: "Informe entre 1 e 60 produtos em Recém-chegados." }),
        ok: false,
      }),
    );

    render(<CollectionsPanel initialConfig={DEFAULT_CONFIG} initialIssues={[]} />);
    await user.click(screen.getByRole("button", { name: /salvar coleções/i }));

    expect(
      await screen.findByText(/informe entre 1 e 60 produtos em recém-chegados/i),
    ).toBeInTheDocument();
  });
});
