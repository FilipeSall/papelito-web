import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_RICH_TEXT_CONTEXT } from "@/features/rich-text";
import type { AdminCategory } from "@/lib/server/admin-taxonomy";
import type {
  AdminBenefitGroup,
  AdminBenefitGroupsSnapshot,
  AdminBenefitItem,
} from "@/types/product-benefits";

import { ProductBenefitsSection } from "./product-benefits-section";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const fetchMock = vi.fn();

function benefitItem(overrides: Partial<AdminBenefitItem> = {}): AdminBenefitItem {
  return {
    id: 1,
    iconType: "emoji",
    iconEmoji: "🚚",
    iconAttachmentId: 0,
    iconUrl: "",
    title: "Frete Grátis",
    description: "Com cupom",
    descriptionContent: null,
    sortOrder: 0,
    isActive: true,
    ...overrides,
  };
}

function group(overrides: Partial<AdminBenefitGroup> = {}): AdminBenefitGroup {
  return {
    id: 1,
    name: "Padrão",
    isGlobal: true,
    isActive: true,
    items: [benefitItem()],
    targets: { products: [], collections: [], categories: [] },
    ...overrides,
  };
}

const CATEGORIES = [{ id: 3, name: "Sedas", slug: "sedas" } as unknown as AdminCategory];

function snapshot(overrides: Partial<AdminBenefitGroupsSnapshot> = {}): AdminBenefitGroupsSnapshot {
  return {
    groups: [group()],
    collections: ["premium", "kits"],
    issues: [],
    ...overrides,
  };
}

function renderManager(data = snapshot()) {
  return render(
    <ProductBenefitsSection
      categories={CATEGORIES}
      richTextContext={EMPTY_RICH_TEXT_CONTEXT}
      snapshot={data}
    />,
  );
}

function okResponse(body: unknown = {}) {
  return { ok: true, json: async () => body } as unknown as Response;
}

beforeEach(() => {
  refresh.mockReset();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(okResponse());
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProductBenefitsSection", () => {
  it("vive como aba própria de Produtos, sempre expandida", () => {
    renderManager();

    expect(
      screen.getByRole("heading", { name: /benefícios do produto/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /expandir benefícios do produto/i }),
    ).not.toBeInTheDocument();
  });

  it("mostra a prévia com o layout da página de produto, não com o da faixa da Home", () => {
    renderManager(
      snapshot({
        groups: [
          group({
            items: [
              benefitItem({ id: 1, title: "Frete Grátis", description: "Com cupom" }),
              benefitItem({ id: 2, title: "Pagamento", description: "100% seguro" }),
            ],
          }),
        ],
      }),
    );

    expect(screen.getByText(/prévia na página de produto/i)).toBeInTheDocument();
    expect(screen.getByText("Frete Grátis")).toBeInTheDocument();
    expect(screen.getByText("Com cupom")).toBeInTheDocument();

    const preview = screen.getByText("Frete Grátis").closest("ul");

    expect(preview?.className).toContain("grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))]");
  });

  it("avisa na prévia quando nenhum benefício está ativo", () => {
    renderManager(snapshot({ groups: [group({ items: [benefitItem({ isActive: false })] })] }));

    expect(screen.getByText(/a faixa não aparece na página de produto/i)).toBeInTheDocument();
  });

  it("marca a configuração global e não oferece excluí-la", () => {
    renderManager();

    expect(screen.getByText("global")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /excluir/i })).not.toBeInTheDocument();
  });

  it("cria uma configuração com os itens e alvos escolhidos", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole("button", { name: /nova configuração/i }));
    await user.type(screen.getByLabelText(/nome interno/i), "Premium");
    await user.click(screen.getByRole("button", { name: /adicionar benefício/i }));
    await user.type(screen.getByLabelText(/^título$/i), "Material sustentável");
    await user.click(screen.getByRole("checkbox", { name: /premium/i }));
    await user.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);

    expect(url).toBe("/api/admin/benefit-groups");
    expect((init as RequestInit).method).toBe("POST");
    expect(body.name).toBe("Premium");
    expect(body.items).toHaveLength(1);
    expect(body.items[0].title).toBe("Material sustentável");
    expect(body.targets.collections).toEqual(["premium"]);
    expect(refresh).toHaveBeenCalled();
  });

  it("edita a configuração existente pelo id", async () => {
    const user = userEvent.setup();
    renderManager(snapshot({ groups: [group({ id: 9, isGlobal: false, name: "Premium" })] }));

    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe("/api/admin/benefit-groups/9");
    expect((init as RequestInit).method).toBe("PUT");
  });

  it("envia os itens na ordem definida pelas setas", async () => {
    const user = userEvent.setup();
    renderManager(
      snapshot({
        groups: [
          group({
            id: 9,
            isGlobal: false,
            items: [
              benefitItem({ id: 1, title: "Primeiro" }),
              benefitItem({ id: 2, title: "Segundo" }),
            ],
          }),
        ],
      }),
    );

    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.click(screen.getByRole("button", { name: /subir benefício 2/i }));
    await user.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);

    expect(body.items.map((entry: { title: string }) => entry.title)).toEqual([
      "Segundo",
      "Primeiro",
    ]);
  });

  it("envia isActive false para o item desmarcado", async () => {
    const user = userEvent.setup();
    renderManager(
      snapshot({ groups: [group({ id: 9, isGlobal: false, items: [benefitItem({ id: 1 })] })] }),
    );

    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.click(screen.getByRole("checkbox", { name: /^ativo$/i }));
    await user.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);

    expect(body.items[0].isActive).toBe(false);
  });

  it("remove um benefício da configuração", async () => {
    const user = userEvent.setup();
    renderManager(
      snapshot({
        groups: [
          group({
            id: 9,
            isGlobal: false,
            items: [benefitItem({ id: 1, title: "Fica" }), benefitItem({ id: 2, title: "Sai" })],
          }),
        ],
      }),
    );

    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.click(screen.getByRole("button", { name: /remover benefício 2/i }));
    await user.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);

    expect(body.items.map((entry: { title: string }) => entry.title)).toEqual(["Fica"]);
  });

  it("exclui a configuração depois da confirmação", async () => {
    const user = userEvent.setup();
    renderManager(snapshot({ groups: [group({ id: 9, isGlobal: false, name: "Premium" })] }));

    await user.click(screen.getByRole("button", { name: /excluir/i }));
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole("button", { name: /^excluir$/i }).at(-1) as HTMLElement);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe("/api/admin/benefit-groups/9");
    expect((init as RequestInit).method).toBe("DELETE");
  });

  it("mostra o erro de alvo já usado que veio do backend", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        code: "papelito_benefit_target_taken",
        message: 'A coleção "premium" já pertence à configuração "Outra".',
      }),
    } as unknown as Response);

    renderManager(snapshot({ groups: [group({ id: 9, isGlobal: false })] }));

    await user.click(screen.getByRole("button", { name: /editar/i }));
    await user.click(screen.getByRole("button", { name: /^salvar$/i }));

    expect(await screen.findByText(/já pertence à configuração "Outra"/i)).toBeInTheDocument();
  });

  it("exibe os avisos vindos do snapshot", () => {
    renderManager(snapshot({ issues: ['"Premium" não tem nenhum benefício ativo.'] }));

    expect(screen.getByText(/não tem nenhum benefício ativo/i)).toBeInTheDocument();
  });
});
