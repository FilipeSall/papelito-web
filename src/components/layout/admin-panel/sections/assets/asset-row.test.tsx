import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Compass } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { AssetIconThumb, AssetRow } from "./asset-row";
import { ASSET_STATUS } from "./assets-status";

function renderRow(onOpen = vi.fn()) {
  render(
    <ul>
      <AssetRow
        onOpen={onOpen}
        status={ASSET_STATUS.active}
        thumbnail={<AssetIconThumb icon={Compass} label="Card 1" />}
        title="Kits"
        where="Posição 1 · /kits"
      />
    </ul>,
  );

  return onOpen;
}

describe("AssetRow", () => {
  /**
   * O `Editar` já foi um `span` aria-hidden por cima de um overlay `absolute inset-0`, e o
   * contêiner das ações (`relative z-10`) cobria esse overlay: clicar no que parecia botão não
   * abria nada. jsdom não modela z-index nem hit-testing, então o que dá para travar aqui é a
   * estrutura — o alvo visível precisa ser o próprio controle.
   */
  it("o Editar visível é o botão, não um enfeite sobre um overlay", () => {
    renderRow();

    const visible = screen.getByText("Editar");

    expect(visible.tagName).toBe("BUTTON");
    expect(visible).not.toHaveAttribute("aria-hidden");
    expect(visible).toHaveAccessibleName("Editar Kits");
  });

  it("abre o editor pelo botão", async () => {
    const user = userEvent.setup();
    const onOpen = renderRow();

    await user.click(screen.getByText("Editar"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("não deixa um segundo controle para a mesma ação na linha", () => {
    renderRow();

    expect(screen.getAllByRole("button", { name: /editar kits/i })).toHaveLength(1);
  });
});
