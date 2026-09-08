import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CollectionNavItem } from "@/types/home-assets";

import { CollectionsNavGroup } from "./collections-nav-group";

const items: CollectionNavItem[] = [
  {
    collectionId: 46,
    collectionData: {
      id: 46,
      imageAttachmentId: 0,
      imageUrl: "/images/categorias/icons/kit.webp",
      indicatorOptions: [],
      indicatorPolicy: { allowed: ["ITEM_COUNT"], locked: true, required: "ITEM_COUNT" },
      name: "Kits",
      path: "/kits",
      slug: "kits",
      systemKey: "kits",
      isActive: true,
    },
    collection: "kits",
    href: "/kits",
    id: "kits",
    indicatorKey: "ITEM_COUNT",
    isActive: true,
    order: 1,
    subtitle: "Kits exclusivos",
    title: "Kits",
  },
  {
    collectionId: 44,
    collectionData: {
      id: 44,
      imageAttachmentId: 0,
      imageUrl: "/images/categorias/icons/promocoes.webp",
      indicatorOptions: [],
      indicatorPolicy: { allowed: ["MAX_DISCOUNT_PERCENT"], locked: true, required: "MAX_DISCOUNT_PERCENT" },
      name: "Promoções",
      path: "/promocoes",
      slug: "promocoes",
      systemKey: "promotions",
      isActive: true,
    },
    collection: "promocoes",
    href: "/promocoes",
    id: "promocoes",
    indicatorKey: "MAX_DISCOUNT_PERCENT",
    isActive: true,
    order: 2,
    subtitle: "Ofertas disponíveis",
    title: "Promoções",
    highlight: { label: "Maior desconto", value: 35, text: "Até 35% off" },
  },
];

function renderGroup(props: Partial<Parameters<typeof CollectionsNavGroup>[0]> = {}) {
  return render(
    <CollectionsNavGroup
      collectionOptions={[{ id: 99, imageAttachmentId: 0, imageUrl: "", indicatorOptions: [], indicatorPolicy: { allowed: ["ITEM_COUNT"], locked: false, required: null }, isActive: true, name: "Linha Eco", path: "/colecoes?colecao=linha-eco", slug: "linha-eco", systemKey: "" }]}
      isSaving={false}
      issues={[]}
      items={items}
      notice={null}
      onAdd={vi.fn(() => "novo")}
      onChange={vi.fn()}
      onMove={vi.fn()}
      onRemove={vi.fn()}
      onSave={vi.fn(async () => true)}
      persistedItems={items}
      {...props}
    />,
  );
}

describe("CollectionsNavGroup", () => {
  it("lista uma linha por card e abre o editor no clique", async () => {
    const user = userEvent.setup();
    renderGroup();

    expect(screen.getByText(/explore por coleção · 2 cards/i)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /editar kits/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/explore por coleção · card 1/i)).toBeInTheDocument();
  });

  it("exibe o destaque calculado para cada coleção", () => {
    renderGroup();

    expect(screen.getByText(/até 35% off/i)).toBeInTheDocument();
  });

  it("não marca o card sem coleção derivada", () => {
    const semNumero = [{ ...items[0], collection: "" }];
    renderGroup({ items: semNumero, persistedItems: semNumero });

    expect(screen.queryByText(/até 35% off/i)).not.toBeInTheDocument();
    expect(screen.getByText(/1 visível/i)).toBeInTheDocument();
  });

  it("conta na prévia só os cards ativos", () => {
    const umInativo = [items[0], { ...items[1], isActive: false }];
    renderGroup({ items: umInativo, persistedItems: umInativo });

    expect(screen.getByText(/1 visível/i)).toBeInTheDocument();
  });

  it("avisa que a seção some quando nenhum card está ativo", () => {
    renderGroup({
      items: items.map((item) => ({ ...item, isActive: false })),
      persistedItems: items.map((item) => ({ ...item, isActive: false })),
    });

    expect(screen.getByText(/a seção some da home sem card visível/i)).toBeInTheDocument();
  });

  it("bloqueia o salvamento sem coleção selecionada", () => {
    const broken = [{ ...items[0], collectionId: undefined, collectionData: undefined }];
    renderGroup({ items: broken, persistedItems: items });

    expect(screen.getByRole("alert")).toHaveTextContent(/selecione uma coleção/i);
    expect(screen.getByRole("button", { name: /salvar corredor/i })).toBeDisabled();
  });

  it("mantém a coleção vinculada ao editar um card", async () => {
    const user = userEvent.setup();
    renderGroup();

    await user.click(screen.getByRole("button", { name: /editar kits/i }));

    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText(/a coleção não pode ser trocada/i)).toBeInTheDocument();
    expect(dialog.queryByLabelText(/coleção \*/i)).not.toBeInTheDocument();
  });

  it("informa quando todas as coleções já estão no corredor", () => {
    renderGroup({ collectionOptions: [] });

    expect(screen.getAllByText(/todas as coleções já estão na tela/i)).toHaveLength(1);
    expect(screen.getByRole("button", { name: /novo card/i })).toBeDisabled();
  });

  it("bloqueia novos cards ao atingir seis coleções", () => {
    const sixItems = Array.from({ length: 6 }, (_, index) => ({
      ...items[0],
      id: `card-${index + 1}`,
      order: index + 1,
      title: `Coleção ${index + 1}`,
    }));
    renderGroup({ items: sixItems, persistedItems: sixItems });

    expect(screen.getByRole("button", { name: /novo card/i })).toBeDisabled();
    expect(screen.getByText(/limite de 6 coleções atingido/i)).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há card cadastrado", () => {
    renderGroup({ items: [], persistedItems: [] });

    expect(screen.getByText(/nenhum card cadastrado/i)).toBeInTheDocument();
  });

  it("pede confirmação antes de remover um card", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderGroup({ onRemove });

    await user.click(screen.getByRole("button", { name: /remover card 1/i }));
    expect(onRemove).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^remover card$/i }));
    expect(onRemove).toHaveBeenCalledWith("kits");
  });
});
