import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { VendorEligibility } from "@/features/vendor-eligibility/types/vendor-eligibility";
import { readVendorPendencies } from "@/features/vendor-eligibility/utils/vendor-eligibility";

import { VendorEligibilityNotice } from "./vendor-eligibility-notice";
import { VendorShell } from "./vendor-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/vendor/dashboard",
}));

vi.mock("@/components/layout/private-header/logout-button", () => ({
  PrivateHeaderLogoutButton: () => <button type="button">Sair</button>,
}));

vi.mock("@/components/layout/site-header", () => ({
  NotificationBell: () => <span>Notificações</span>,
}));

const SIDEBAR_NAV = "Navegacao do vendor";
const MOBILE_NAV = "Seções do painel";

function eligibility(overrides: Partial<VendorEligibility> = {}): VendorEligibility {
  return {
    canSell: true,
    loadFailed: false,
    minimumBoxes: 2,
    recommendedBoxes: 3,
    requirements: [
      { advisory: false, blocking: false, id: "account", reason: "", satisfied: true },
      { advisory: false, blocking: false, id: "pagarme", reason: "", satisfied: true },
      { activeCount: 3, advisory: false, blocking: false, id: "boxes", reason: "", satisfied: true },
    ],
    ...overrides,
  };
}

function renderShell(verdict: VendorEligibility) {
  return render(
    <VendorShell pendencies={readVendorPendencies(verdict)}>
      <p>conteúdo</p>
    </VendorShell>,
  );
}

const BLOCKED_BY_BOXES = eligibility({
  canSell: false,
  requirements: [
    { advisory: false, blocking: false, id: "account", reason: "", satisfied: true },
    { advisory: false, blocking: false, id: "pagarme", reason: "", satisfied: true },
    {
      activeCount: 1,
      advisory: false,
      blocking: true,
      id: "boxes",
      reason: "below_minimum",
      satisfied: false,
    },
  ],
});

const BLOCKED_BY_PAGARME = eligibility({
  canSell: false,
  requirements: [
    { advisory: false, blocking: false, id: "account", reason: "", satisfied: true },
    {
      advisory: false,
      blocking: true,
      id: "pagarme",
      reason: "never_synced",
      satisfied: false,
    },
    { activeCount: 3, advisory: false, blocking: false, id: "boxes", reason: "", satisfied: true },
  ],
});

describe("indicador de pendências na navegação do vendor", () => {
  it("não desenha indicador algum quando a loja está apta", () => {
    renderShell(eligibility());

    expect(screen.queryByText("Sua loja não vende")).not.toBeInTheDocument();
    expect(screen.queryByText(/pendência/i)).not.toBeInTheDocument();
  });

  it("cala quando o veredito não pôde ser lido", () => {
    renderShell(eligibility({ canSell: false, loadFailed: true }));

    expect(screen.queryByText("Sua loja não vende")).not.toBeInTheDocument();
  });

  it("anuncia o bloqueio na sidebar e na barra de seções", () => {
    renderShell(BLOCKED_BY_BOXES);

    expect(screen.getByText("Sua loja não vende")).toBeInTheDocument();
    expect(screen.getByText("1 pendência a resolver")).toBeInTheDocument();
    expect(
      within(screen.getByLabelText(MOBILE_NAV)).getByText("1 pendência"),
    ).toBeInTheDocument();
  });

  it("marca só o item de navegação que resolve a pendência", () => {
    renderShell(BLOCKED_BY_BOXES);

    const sidebar = within(screen.getByLabelText(SIDEBAR_NAV));
    const cubagem = sidebar.getByRole("link", { name: /cubagem/i });

    expect(within(cubagem).getByText(/^Pendência: /)).toHaveTextContent(
      "Pendência: Caixas abaixo do mínimo",
    );
    expect(
      within(sidebar.getByRole("link", { name: /configuracoes/i })).queryByText(/^Pendência: /),
    ).not.toBeInTheDocument();
  });

  it("leva a pendência da Pagar.me para configurações", () => {
    renderShell(BLOCKED_BY_PAGARME);

    const sidebar = within(screen.getByLabelText(SIDEBAR_NAV));

    expect(
      within(sidebar.getByRole("link", { name: /configuracoes/i })).getByText(/^Pendência: /),
    ).toHaveTextContent("Recebedor Pagar.me ainda não criado");
    expect(
      within(sidebar.getByRole("link", { name: /cubagem/i })).queryByText(/^Pendência: /),
    ).not.toBeInTheDocument();
  });

  it("não marca a navegação por recomendação de caixas", () => {
    renderShell(
      eligibility({
        requirements: [
          {
            activeCount: 2,
            advisory: true,
            blocking: false,
            id: "boxes",
            reason: "below_recommended",
            satisfied: true,
          },
        ],
      }),
    );

    expect(screen.queryByText("Sua loja não vende")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Pendência: /)).not.toBeInTheDocument();
  });

  it("soma os bloqueios num único marcador por item", () => {
    renderShell(
      eligibility({
        canSell: false,
        requirements: [
          { advisory: false, blocking: true, id: "account", reason: "suspended", satisfied: false },
          { advisory: false, blocking: true, id: "pagarme", reason: "rejected", satisfied: false },
        ],
      }),
    );

    const sidebar = within(screen.getByLabelText(SIDEBAR_NAV));

    expect(screen.getByText("2 pendências a resolver")).toBeInTheDocument();
    expect(
      within(sidebar.getByRole("link", { name: /configuracoes/i })).getAllByText(/^Pendência: /),
    ).toHaveLength(1);
  });
});

describe("painel de pendências do dashboard", () => {
  it("fica fora do dashboard quando só há recomendação", () => {
    const { container } = render(
      <VendorEligibilityNotice
        pendencies={readVendorPendencies(
          eligibility({
            requirements: [
              {
                activeCount: 2,
                advisory: true,
                blocking: false,
                id: "boxes",
                reason: "below_recommended",
                satisfied: true,
              },
            ],
          }),
        )}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("separa o que impede a venda do que é recomendação", () => {
    render(
      <VendorEligibilityNotice
        pendencies={readVendorPendencies(
          eligibility({
            canSell: false,
            requirements: [
              {
                advisory: false,
                blocking: true,
                id: "pagarme",
                reason: "never_synced",
                satisfied: false,
              },
              {
                activeCount: 2,
                advisory: true,
                blocking: false,
                id: "boxes",
                reason: "below_recommended",
                satisfied: true,
              },
            ],
          }),
        )}
      />,
    );

    expect(screen.getByText("Impede a venda")).toBeInTheDocument();
    expect(screen.getByText("Recomendação")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resolver" })).toHaveAttribute(
      "href",
      "/vendor/configuracoes#pagamentos",
    );
    expect(screen.getByRole("link", { name: "Ver caixas" })).toHaveAttribute(
      "href",
      "/vendor/cubagem",
    );
  });
});
