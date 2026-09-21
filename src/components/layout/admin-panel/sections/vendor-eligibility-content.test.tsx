import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  getVendorEligibilityConfig,
  setVendorEligibilityConfig,
} from "../../../../../test/msw/handlers/vendor-eligibility";

import { VendorEligibilityContent } from "./vendor-eligibility-content";

const MINIMUM_LABEL = "Mínimo de caixas ativas";
const RECOMMENDED_LABEL = "Caixas ativas recomendadas";

async function typeInto(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.type(field, value);
}

describe("VendorEligibilityContent", () => {
  it("carrega os valores vigentes, que nascem em 2 e 3", async () => {
    render(<VendorEligibilityContent />);

    await waitFor(() => {
      expect(screen.getByLabelText(MINIMUM_LABEL)).toHaveValue(2);
    });
    expect(screen.getByLabelText(RECOMMENDED_LABEL)).toHaveValue(3);
  });

  it("deixa claro que o mínimo exige e o recomendado só sugere", async () => {
    render(<VendorEligibilityContent />);

    await screen.findByLabelText(MINIMUM_LABEL);

    expect(screen.getByText(/sai da vitrine/i)).toBeInTheDocument();
    expect(screen.getByText(/Nunca bloqueia/i)).toBeInTheDocument();
  });

  it("salva os dois números", async () => {
    const user = userEvent.setup();
    render(<VendorEligibilityContent />);

    await screen.findByLabelText(MINIMUM_LABEL);
    await typeInto(user, MINIMUM_LABEL, "3");
    await typeInto(user, RECOMMENDED_LABEL, "5");
    await user.click(screen.getByRole("button", { name: /salvar regra/i }));

    expect(await screen.findByText("Regra de caixas salva.")).toBeInTheDocument();
    expect(getVendorEligibilityConfig()).toEqual({ minimumBoxes: 3, recommendedBoxes: 5 });
  });

  it("mostra a recusa do WordPress quando o recomendado fica abaixo do mínimo", async () => {
    const user = userEvent.setup();
    render(<VendorEligibilityContent />);

    await screen.findByLabelText(MINIMUM_LABEL);
    await typeInto(user, MINIMUM_LABEL, "4");
    await typeInto(user, RECOMMENDED_LABEL, "2");
    await user.click(screen.getByRole("button", { name: /salvar regra/i }));

    expect(
      await screen.findByText("O recomendado de caixas não pode ser menor que o mínimo."),
    ).toBeInTheDocument();
    expect(getVendorEligibilityConfig()).toEqual({ minimumBoxes: 2, recommendedBoxes: 3 });
  });

  it("não sobrescreve o que está no ar quando a leitura falha", async () => {
    setVendorEligibilityConfig({ minimumBoxes: 4, recommendedBoxes: 6 });
    render(<VendorEligibilityContent />);

    await waitFor(() => {
      expect(screen.getByLabelText(MINIMUM_LABEL)).toHaveValue(4);
    });
    expect(screen.getByRole("button", { name: /salvar regra/i })).toBeEnabled();
  });
});
