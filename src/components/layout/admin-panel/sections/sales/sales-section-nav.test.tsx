import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/admin/vendas";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

import { SalesSectionNav } from "./sales-section-nav";

// Recolhido e posição vivem num store de módulo carimbado com a rota: cada teste
// abre numa rota própria para começar da posição de origem, como uma visita nova.
let visit = 0;

beforeEach(() => {
  visit += 1;
  pathname = `/admin/vendas-${visit}`;
});

const SECTIONS = [
  { id: "resumo", label: "Resumo" },
  { id: "graficos", label: "Gráficos" },
  { id: "pedidos", label: "Pedidos" },
  { id: "exportar-vendas", label: "Exportações" },
] as const;

describe("SalesSectionNav", () => {
  it("expõe as seções como navegação nomeada e ancorada", () => {
    render(<SalesSectionNav sections={SECTIONS} />);

    const nav = screen.getByRole("navigation", { name: "Seções desta página" });
    const links = screen.getAllByRole("link");

    expect(nav).toBeInTheDocument();
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "#resumo",
      "#graficos",
      "#pedidos",
      "#exportar-vendas",
    ]);
  });

  it("marca a seção ativa com aria-current", () => {
    render(<SalesSectionNav sections={SECTIONS} />);

    expect(screen.getByRole("link", { name: "Resumo" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Pedidos" })).not.toHaveAttribute("aria-current");
  });

  it("marca a seção no clique, sem esperar o scroll", async () => {
    const user = userEvent.setup();
    render(<SalesSectionNav sections={SECTIONS} />);

    await user.click(screen.getByRole("link", { name: "Pedidos" }));

    expect(screen.getByRole("link", { name: "Pedidos" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Resumo" })).not.toHaveAttribute("aria-current");
  });

  it("some da tela ao ocultar, e nem o remonte a traz de volta", async () => {
    const user = userEvent.setup();
    const view = render(<SalesSectionNav sections={SECTIONS} />);

    await user.click(screen.getByRole("button", { name: "Ocultar" }));

    expect(screen.queryByRole("navigation", { name: "Seções desta página" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Pedidos" })).toBeNull();

    // Sem F5 não volta: trocar de rota ou remontar segue com a navegação oculta.
    view.unmount();
    pathname = "/admin/produtos";
    render(<SalesSectionNav sections={SECTIONS} />);

    expect(screen.queryByRole("navigation", { name: "Seções desta página" })).toBeNull();
  });

  it("guarda o ocultar na sessão, nunca em localStorage ou cookie", async () => {
    const user = userEvent.setup();
    const localBefore = Object.keys(window.localStorage);
    const cookieBefore = document.cookie;

    render(<SalesSectionNav sections={SECTIONS} />);

    await user.click(screen.getByRole("button", { name: "Ocultar" }));

    expect(window.sessionStorage.getItem("papelito.admin.sales.nav.hidden")).toBe("1");
    expect(Object.keys(window.localStorage)).toEqual(localBefore);
    expect(document.cookie).toBe(cookieBefore);
  });

  it("percorre os links por teclado, na ordem da página", async () => {
    const user = userEvent.setup();
    render(<SalesSectionNav sections={SECTIONS} />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Ocultar" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "Resumo" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "Gráficos" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "Pedidos" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "Exportações" })).toHaveFocus();
  });

  it("não fala mais em fita", () => {
    const { container } = render(<SalesSectionNav sections={SECTIONS} />);

    expect(container.textContent?.toLowerCase()).not.toContain("fita");
  });
})

const NAV_RECT = { height: 200, left: 1080, top: 300, width: 176 };

function stubNavRect() {
  window.innerWidth = 1280;
  window.innerHeight = 800;

  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () =>
      ({
        bottom: NAV_RECT.top + NAV_RECT.height,
        height: NAV_RECT.height,
        left: NAV_RECT.left,
        right: NAV_RECT.left + NAV_RECT.width,
        toJSON: () => ({}),
        top: NAV_RECT.top,
        width: NAV_RECT.width,
        x: NAV_RECT.left,
        y: NAV_RECT.top,
      }) as DOMRect,
  );
}

function pointer(type: string, clientX: number, clientY: number) {
  const event = new MouseEvent(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
    clientX,
    clientY,
  });

  Object.defineProperty(event, "pointerId", { value: 1 });

  return event;
}

function grip() {
  return screen.getByTitle("Arraste para mover");
}

function nav() {
  return screen.getByRole("navigation", { name: "Seções desta página" });
}

function dragFrom(target: Element, dx: number, dy: number) {
  const startX = NAV_RECT.left + 8;
  const startY = NAV_RECT.top + 6;

  fireEvent(target, pointer("pointerdown", startX, startY));
  fireEvent(window, pointer("pointermove", startX + dx, startY + dy));
  fireEvent(window, pointer("pointerup", startX + dx, startY + dy));
}

function placementOf() {
  const { left, top } = nav().style;

  return { left, top };
}

describe("SalesSectionNav — reposicionamento por arrasto", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("nasce ancorada na posição de origem, sem coordenada própria", () => {
    stubNavRect();
    render(<SalesSectionNav sections={SECTIONS} />);

    expect(placementOf()).toEqual({ left: "", top: "" });
    expect(nav().className).toContain("right-6");
  });

  it("arrasta pelo punho de seis pontos", () => {
    stubNavRect();
    render(<SalesSectionNav sections={SECTIONS} />);

    dragFrom(grip(), -300, -120);

    expect(placementOf()).toEqual({ left: "780px", top: "180px" });
    expect(nav().className).not.toContain("right-6");
  });

  it("não arrasta pelo corpo da navegação, só pelo punho", () => {
    stubNavRect();
    render(<SalesSectionNav sections={SECTIONS} />);

    dragFrom(screen.getByRole("button", { name: "Ocultar" }), -300, -120);
    dragFrom(screen.getByRole("link", { name: "Pedidos" }), -300, -120);

    expect(placementOf()).toEqual({ left: "", top: "" });
  });

  it("mantém o punho de seis pontos fora do alcance de leitores de tela", () => {
    stubNavRect();
    render(<SalesSectionNav sections={SECTIONS} />);

    expect(grip()).toHaveAttribute("aria-hidden", "true");
    expect(grip().firstElementChild?.childElementCount).toBe(6);
  });

  it("mantém a navegação dentro da viewport", () => {
    stubNavRect();
    render(<SalesSectionNav sections={SECTIONS} />);

    dragFrom(grip(), 5000, 5000);

    expect(placementOf()).toEqual({
      left: `${window.innerWidth - NAV_RECT.width - 8}px`,
      top: `${window.innerHeight - NAV_RECT.height - 8}px`,
    });
  });

  it("sobrevive ao remonte da mesma página, como no clique de filtro", () => {
    stubNavRect();
    const view = render(<SalesSectionNav sections={SECTIONS} />);

    dragFrom(grip(), -300, -120);
    view.unmount();
    render(<SalesSectionNav sections={SECTIONS} />);

    expect(placementOf()).toEqual({ left: "780px", top: "180px" });
  });

  it("volta à origem ao sair e voltar para a página", () => {
    stubNavRect();
    const view = render(<SalesSectionNav sections={SECTIONS} />);

    dragFrom(grip(), -300, -120);
    view.unmount();
    pathname = "/admin/produtos";
    render(<SalesSectionNav sections={SECTIONS} />);

    expect(placementOf()).toEqual({ left: "", top: "" });
  });

  it("não persiste a posição arrastada", () => {
    stubNavRect();
    const localBefore = Object.keys(window.localStorage);
    const sessionBefore = Object.keys(window.sessionStorage);
    const cookieBefore = document.cookie;

    render(<SalesSectionNav sections={SECTIONS} />);

    dragFrom(grip(), -300, -120);

    expect(Object.keys(window.localStorage)).toEqual(localBefore);
    expect(Object.keys(window.sessionStorage)).toEqual(sessionBefore);
    expect(document.cookie).toBe(cookieBefore);
  });
})
