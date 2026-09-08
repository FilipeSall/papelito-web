import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CollectionNavItem } from "@/types/home-assets";

import { CollectionsNavGroup } from "./collections-nav-group";

const items: CollectionNavItem[] = [
  {
    collection: "kits",
    href: "/kits",
    id: "kits",
    isActive: true,
    order: 1,
    subtitle: "Kits exclusivos",
    title: "Kits",
  },
  {
    collection: "promocoes",
    href: "/promocoes",
    id: "promocoes",
    isActive: true,
    order: 2,
    subtitle: "Ofertas disponíveis",
    title: "Promoções",
  },
];

function renderGroup(props: Partial<Parameters<typeof CollectionsNavGroup>[0]> = {}) {
  return render(
    <CollectionsNavGroup
      collectionOptions={[{ name: "Linha Eco", slug: "linha-eco" }]}
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

  it("avisa que o card ligado a uma coleção troca o texto na Home", () => {
    renderGroup();

    expect(screen.getAllByText(/nº ao vivo na home/i)).toHaveLength(2);
  });

  it("não marca o card sem coleção derivada", () => {
    const semNumero = [{ ...items[0], collection: "" }];
    renderGroup({ items: semNumero, persistedItems: semNumero });

    expect(screen.queryByText(/nº ao vivo na home/i)).not.toBeInTheDocument();
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

  it("bloqueia o salvamento com destino externo", () => {
    const broken = [{ ...items[0], href: "https://exemplo.com" }];
    renderGroup({ items: broken, persistedItems: items });

    expect(screen.getByRole("alert")).toHaveTextContent(/destino interno começando com barra/i);
    expect(screen.getByRole("button", { name: /salvar corredor/i })).toBeDisabled();
  });

  it("oferece as coleções cadastradas como destino do card", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderGroup({ onChange });

    await user.click(screen.getByRole("button", { name: /editar kits/i }));

    const destination = within(screen.getByRole("dialog")).getByLabelText(/destino \*/i);
    await user.selectOptions(destination, "linha-eco");

    expect(onChange).toHaveBeenCalledWith("kits", { href: "/colecoes?colecao=linha-eco" });
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
