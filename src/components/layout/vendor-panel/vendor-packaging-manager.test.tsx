import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VendorPackagingManager } from "./vendor-packaging-manager";
import type {
  VendorPackagingCatalogItem,
  VendorPackagingProfile,
  VendorPackagingSnapshot,
} from "@/features/vendor-packaging/types/vendor-packaging";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

type CatalogTuple = readonly [string, string, number, number, number, number | null];

const CUSTOM_BOX_ACTION = "Cadastrar caixa própria";
const SAVE_ACTION = "Salvar caixa";
const CODE_FIELD = "Código";
const NAME_FIELD = "Nome da caixa";
const LENGTH_FIELD = "Comprimento (cm)";
const WIDTH_FIELD = "Largura (cm)";
const HEIGHT_FIELD = "Altura (cm)";
const TARE_FIELD = "Tara (kg) — opcional";
const MAX_PAYLOAD_FIELD = "Carga máxima (kg)";
const NO_GAP = { capped: false, count: 0 };

const catalogTuples: CatalogTuple[] = [
  ["P04", "Pequena", 160, 120, 40, 1500],
  ["C08", "Comprida", 320, 120, 80, 3000],
  ["C12", "Comprida", 320, 120, 120, null],
  ["M08", "Média", 240, 160, 80, 3000],
  ["M12", "Média", 240, 160, 120, 4000],
  ["G08", "Grande", 320, 240, 80, 6000],
  ["G12", "Grande", 320, 240, 120, 9000],
  ["G16", "Grande", 320, 240, 160, 11000],
  ["G20", "Grande", 320, 240, 200, 14000],
  ["S04", "Super", 480, 320, 40, 6000],
  ["S08", "Super", 480, 320, 80, 11000],
  ["S12", "Super", 480, 320, 120, 17000],
  ["S16", "Super", 480, 320, 160, 22000],
  ["S20", "Super", 480, 320, 200, 28000],
  ["S24", "Super", 480, 320, 240, null],
  ["S28", "Super", 480, 320, 280, null],
  ["H12", "Híper", 640, 480, 120, null],
  ["H20", "Híper", 640, 480, 200, null],
  ["H28", "Híper", 640, 480, 280, null],
  ["H32", "Híper", 640, 480, 320, null],
  ["H48", "Híper", 640, 480, 480, null],
];

const catalog: VendorPackagingCatalogItem[] = catalogTuples.map(
  ([code, category, lengthMm, widthMm, heightMm, maxPayloadG]) => ({
    category,
    code,
    heightMm,
    label: `Caixa RPC ${code}`,
    lengthMm,
    maxPayloadG,
    widthMm,
  }),
);

const snapshot: VendorPackagingSnapshot = {
  catalog,
  items: [],
  loadFailed: false,
};

function profile(overrides: Partial<VendorPackagingProfile> = {}): VendorPackagingProfile {
  return {
    active: true,
    code: "M12",
    createdAt: "2026-09-01T10:00:00Z",
    heightMm: 120,
    id: 7,
    label: "Caixa RPC M12",
    lengthMm: 240,
    maxPayloadG: 4000,
    source: "rpc",
    tareWeightG: 300,
    updatedAt: "2026-09-01T10:00:00Z",
    version: 1,
    widthMm: 160,
    ...overrides,
  };
}

function fillCustomBox() {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(CUSTOM_BOX_ACTION, "i") }));
  fireEvent.change(screen.getByLabelText(NAME_FIELD), { target: { value: "Minha caixa" } });
  fireEvent.change(screen.getByLabelText(CODE_FIELD), { target: { value: "CX-01" } });
  fireEvent.change(screen.getByLabelText(LENGTH_FIELD), { target: { value: "16" } });
  fireEvent.change(screen.getByLabelText(WIDTH_FIELD), { target: { value: "12" } });
  fireEvent.change(screen.getByLabelText(HEIGHT_FIELD), { target: { value: "4" } });
  fireEvent.change(screen.getByLabelText(TARE_FIELD), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: SAVE_ACTION }));
}

const TEST_POLICY = { minimum: 2, recommended: 3 };

describe("VendorPackagingManager", () => {
  it("abre na grade de modelos, sem formulário permanente", () => {
    render(<VendorPackagingManager policy={TEST_POLICY} gap={NO_GAP} snapshot={snapshot} />);

    expect(screen.getByRole("button", { name: new RegExp(CUSTOM_BOX_ACTION, "i") })).toBeInTheDocument();
    expect(screen.queryByLabelText(NAME_FIELD)).not.toBeInTheDocument();
  });

  it.each(catalog)("abre a bancada já preenchida com o modelo $code, sem tara", (item) => {
    render(<VendorPackagingManager policy={TEST_POLICY} gap={NO_GAP} snapshot={snapshot} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${item.code}`) }));

    expect(screen.getByLabelText(CODE_FIELD)).toHaveValue(item.code);
    expect(screen.getByLabelText(NAME_FIELD)).toHaveValue(item.label);
    expect(screen.getByLabelText(LENGTH_FIELD)).toHaveValue(
      String(item.lengthMm / 10).replace(".", ","),
    );
    expect(screen.getByLabelText(WIDTH_FIELD)).toHaveValue(
      String(item.widthMm / 10).replace(".", ","),
    );
    expect(screen.getByLabelText(HEIGHT_FIELD)).toHaveValue(
      String(item.heightMm / 10).replace(".", ","),
    );
    expect(screen.getByLabelText(TARE_FIELD)).toHaveValue("");
    expect(screen.getByLabelText(MAX_PAYLOAD_FIELD)).toHaveValue(
      item.maxPayloadG === null ? "" : String(item.maxPayloadG / 1000).replace(".", ","),
    );
  });

  it("abre a caixa já cadastrada em vez de duplicar o código", () => {
    render(
      <VendorPackagingManager policy={TEST_POLICY} gap={NO_GAP} snapshot={{ ...snapshot, items: [profile()] }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^M12/ }));

    expect(screen.getByRole("heading", { name: "Conferir M12" })).toBeInTheDocument();
    expect(screen.getByLabelText(TARE_FIELD)).toHaveValue("0,3");
  });

  it("volta da bancada para a grade sem salvar", () => {
    render(<VendorPackagingManager policy={TEST_POLICY} gap={NO_GAP} snapshot={snapshot} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(CUSTOM_BOX_ACTION, "i") }));
    fireEvent.click(screen.getByRole("button", { name: /voltar aos modelos/i }));

    expect(screen.queryByLabelText(NAME_FIELD)).not.toBeInTheDocument();
  });

  it("marca o marco de conferência enquanto a caixa RPC segue na versão 1", () => {
    render(
      <VendorPackagingManager policy={TEST_POLICY} gap={NO_GAP} snapshot={{ ...snapshot, items: [profile()] }} />,
    );

    expect(screen.getByText("1 caixa ainda pede conferência.")).toBeInTheDocument();
    expect(
      screen.getByText("Falta 1 caixa para seus produtos voltarem à vitrine."),
    ).toBeInTheDocument();
  });

  it("oferece reativar a caixa desativada", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ items: [] }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <VendorPackagingManager policy={TEST_POLICY}
        gap={NO_GAP}
        snapshot={{ ...snapshot, items: [profile({ active: false })] }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /reativar/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/vendor/packaging-profiles/7/reactivate",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("oferece excluir só a caixa desativada", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ items: [] }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <VendorPackagingManager policy={TEST_POLICY}
        gap={NO_GAP}
        snapshot={{ ...snapshot, items: [profile({ active: false }), profile({ code: "G12", id: 8 })] }}
      />,
    );

    expect(screen.getAllByRole("button", { name: /excluir/i })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /^excluir$/i }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir caixa" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/vendor/packaging-profiles/7",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
  });

  it("barra o cadastro ao bater o teto de caixas ativas", () => {
    const items = Array.from({ length: 24 }, (_, index) =>
      profile({ code: `CX${index}`, id: index + 1, version: 2 }),
    );
    render(<VendorPackagingManager policy={TEST_POLICY} gap={NO_GAP} snapshot={{ ...snapshot, items }} />);

    expect(screen.getByText(/limite de 24 caixas ativas/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cadastrar outra caixa/i })).not.toBeInTheDocument();
  });

  it("recolhe a grade quando o setup fecha e a reabre sob demanda", () => {
    const items = [1, 2, 3].map((id) => profile({ code: `CX${id}`, id, version: 2 }));
    render(<VendorPackagingManager policy={TEST_POLICY} gap={NO_GAP} snapshot={{ ...snapshot, items }} />);

    expect(screen.getByText("Embalagem em dia")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: new RegExp(CUSTOM_BOX_ACTION, "i") })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cadastrar outra caixa/i }));

    expect(screen.getByRole("button", { name: new RegExp(CUSTOM_BOX_ACTION, "i") })).toBeInTheDocument();
  });

  it("mantém a conferência de caixa já cadastrada mesmo no teto", () => {
    const items = Array.from({ length: 24 }, (_, index) =>
      profile({ code: index === 0 ? "M12" : `CX${index}`, id: index + 1, version: 2 }),
    );
    render(<VendorPackagingManager policy={TEST_POLICY} gap={NO_GAP} snapshot={{ ...snapshot, items }} />);
    fireEvent.click(screen.getByRole("button", { name: /ver os modelos/i }));

    expect(screen.getByRole("button", { name: /^M12,/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /^P04,/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: new RegExp(CUSTOM_BOX_ACTION, "i") })).toBeDisabled();
  });

  it("mostra a lacuna de peso e medida na barra de prontidão", () => {
    render(<VendorPackagingManager policy={TEST_POLICY} gap={{ capped: true, count: 12 }} snapshot={snapshot} />);

    expect(screen.getByText("12+")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver no estoque/i })).toHaveAttribute(
      "href",
      "/vendor/estoque?filter=incomplete",
    );
  });

  it("mostra erro de validação da API no campo indicado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          code: "papelito_packaging_profile_code_conflict",
          field: "code",
          message: "Código já usado.",
        }),
        ok: false,
        status: 409,
      }),
    );
    render(<VendorPackagingManager policy={TEST_POLICY} gap={NO_GAP} snapshot={snapshot} />);

    fillCustomBox();

    await waitFor(() => expect(screen.getByText("Código já usado.")).toBeInTheDocument());
    expect(screen.getByLabelText(CODE_FIELD)).toHaveAccessibleDescription(/Código já usado\./);
  });

  it("mostra erro de rede ao salvar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Falha de rede.")));
    render(<VendorPackagingManager policy={TEST_POLICY} gap={NO_GAP} snapshot={snapshot} />);

    fillCustomBox();

    await waitFor(() => expect(screen.getByText("Falha de rede.")).toBeInTheDocument());
  });
});
