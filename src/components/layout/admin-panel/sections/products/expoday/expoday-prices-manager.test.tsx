import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ADMIN_PITEIRA_ID, adminPricesSnapshot } from "@/features/expocannabis/test/admin-prices-fixtures";

import { ExpodayPricesManager } from "./expoday-prices-manager";

const PITEIRA_LABEL = "Preço do evento de Piteira Tradicional";
const PUBLISH_LABEL = /publicar no estande/i;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("ExpodayPricesManager", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mostra o que o estande vendeu e o que vai para a Cifal", () => {
    render(<ExpodayPricesManager initialSnapshot={adminPricesSnapshot()} />);

    const sales = screen.getByRole("region", { name: "Vendido no estande" });
    expect(within(sales).getByText("R$ 4.123,50")).toBeInTheDocument();
    expect(within(sales).getByText("62")).toBeInTheDocument();
    expect(within(sales).getByText("R$ 3.999,80")).toBeInTheDocument();
    expect(within(sales).getByText(/1 cobrança com taxa a conferir/)).toBeInTheDocument();
  });

  it("não mostra editor de níveis por unidade", () => {
    render(<ExpodayPricesManager initialSnapshot={adminPricesSnapshot()} />);

    expect(screen.queryByText(/níveis por unidade/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/PDV Perfeito/i)).not.toBeInTheDocument();
  });

  it("publica o preço novo e volta para tudo publicado", async () => {
    const user = userEvent.setup();
    const published = adminPricesSnapshot({ version: 4 });
    published.products = published.products.map((product) =>
      product.id === ADMIN_PITEIRA_ID ? { ...product, eventCents: 5990 } : product,
    );
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ snapshot: published }));

    render(<ExpodayPricesManager initialSnapshot={adminPricesSnapshot()} />);
    await user.type(screen.getByLabelText(PITEIRA_LABEL), "59,90");

    expect(screen.getByText("1 alteração sem publicar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: PUBLISH_LABEL }));

    await waitFor(() => expect(screen.getByText("Tudo publicado")).toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/expocannabis/prices");
    expect(JSON.parse(String(init?.body))).toEqual({
      version: 3,
      prices: { [String(ADMIN_PITEIRA_ID)]: 5990, "11841": 8900 },
      kitPctOff: 15,
    });
  });

  it("trava os campos enquanto a publicação não responde", async () => {
    const user = userEvent.setup();
    let respond: (value: Response) => void = () => undefined;
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      new Promise<Response>((resolve) => {
        respond = resolve;
      }),
    );

    render(<ExpodayPricesManager initialSnapshot={adminPricesSnapshot()} />);
    await user.type(screen.getByLabelText(PITEIRA_LABEL), "59,90");
    await user.click(screen.getByRole("button", { name: PUBLISH_LABEL }));

    expect(screen.getByLabelText(PITEIRA_LABEL)).toBeDisabled();
    expect(screen.getByLabelText("Desconto do kit")).toBeDisabled();

    respond(jsonResponse({ message: "Falhou." }, 500));
    await waitFor(() => expect(screen.getByLabelText(PITEIRA_LABEL)).toBeEnabled());
    expect(screen.getByLabelText(PITEIRA_LABEL)).toHaveValue("59,90");
  });

  it("bloqueia publicar com preço inválido", async () => {
    const user = userEvent.setup();
    render(<ExpodayPricesManager initialSnapshot={adminPricesSnapshot()} />);

    await user.type(screen.getByLabelText(PITEIRA_LABEL), "abc");

    expect(screen.getByText("Use um valor como 89,90.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PUBLISH_LABEL })).toBeDisabled();
  });

  it("recalcula o preço do kit ao mudar o desconto", async () => {
    const user = userEvent.setup();
    render(<ExpodayPricesManager initialSnapshot={adminPricesSnapshot()} />);

    const kitField = screen.getByLabelText("Desconto do kit");
    await user.clear(kitField);
    await user.type(kitField, "20");

    expect(screen.getByTestId("expoday-kit-price")).toHaveTextContent("R$ 617,36");
  });

  it("mantém o rascunho e mostra o conflito quando outra pessoa publicou antes", async () => {
    const user = userEvent.setup();
    const conflict = "Outra pessoa publicou preços enquanto você editava. Recarregue a página para ver a versão atual.";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ message: conflict }, 409));

    render(<ExpodayPricesManager initialSnapshot={adminPricesSnapshot()} />);
    await user.type(screen.getByLabelText(PITEIRA_LABEL), "59,90");
    await user.click(screen.getByRole("button", { name: PUBLISH_LABEL }));

    expect(await screen.findByText(conflict)).toBeInTheDocument();
    expect(screen.getByLabelText(PITEIRA_LABEL)).toHaveValue("59,90");
    expect(screen.getByText("1 alteração sem publicar")).toBeInTheDocument();
  });

  it("explica a falha quando o snapshot não carregou", () => {
    render(<ExpodayPricesManager initialSnapshot={null} />);

    expect(screen.getByText(/não foi possível carregar os preços do estande/i)).toBeInTheDocument();
  });
});
