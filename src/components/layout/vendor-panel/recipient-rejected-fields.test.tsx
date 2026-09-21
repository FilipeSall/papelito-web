import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mapRejectedFields } from "@/features/vendor-recipient/utils/rejected-fields";

import { RecipientRejectedFields } from "./recipient-rejected-fields";

const HOLDER_FIELD = {
  detail: "holder_name | must have 30 characters or fewer",
  field: "bank_account.holder_name",
  group: "bank_account",
  hint: "Use a razão social como aparece no banco, com no máximo 30 caracteres.",
  label: "Nome do titular da conta",
};

const PARTNER_FIELD = {
  detail: "managing_partners[0].document | The document field is invalid",
  field: "partner.document",
  group: "partner",
  hint: "Informe o CPF da pessoa que responde pela empresa, com 11 dígitos.",
  label: "CPF do responsável legal",
};

describe("mapRejectedFields", () => {
  it("aceita a lista como o WordPress a devolve", () => {
    expect(mapRejectedFields([HOLDER_FIELD])).toEqual([HOLDER_FIELD]);
  });

  it("descarta o que não é lista e a entrada sem rótulo", () => {
    expect(mapRejectedFields(undefined)).toEqual([]);
    expect(mapRejectedFields("erro")).toEqual([]);
    expect(mapRejectedFields([{ field: "x" }, null, 3])).toEqual([]);
  });

  it("completa grupo e detalhe ausentes sem perder a linha", () => {
    expect(mapRejectedFields([{ field: "x", label: "Campo X" }])).toEqual([
      { detail: "", field: "x", group: "outros", hint: "", label: "Campo X" },
    ]);
  });
});

describe("RecipientRejectedFields", () => {
  it("não desenha nada sem campo recusado", () => {
    const { container } = render(<RecipientRejectedFields fields={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("mostra rótulo, orientação e a frase da Pagar.me", () => {
    render(<RecipientRejectedFields fields={[HOLDER_FIELD]} />);

    expect(screen.getByText("1 dado recusado")).toBeInTheDocument();
    expect(screen.getByText(HOLDER_FIELD.label)).toBeInTheDocument();
    expect(screen.getByText(HOLDER_FIELD.hint)).toBeInTheDocument();
    expect(screen.getByText(HOLDER_FIELD.detail)).toBeInTheDocument();
  });

  it("agrupa por bloco do cadastro, na ordem da conta antes do responsável", () => {
    render(<RecipientRejectedFields fields={[PARTNER_FIELD, HOLDER_FIELD]} />);

    const groups = screen.getAllByRole("region");

    expect(screen.getByText("2 dados recusados")).toBeInTheDocument();
    expect(groups.map((group) => group.getAttribute("aria-label"))).toEqual([
      "Conta bancária",
      "Responsável legal",
    ]);
    expect(within(groups[0]).getByText(HOLDER_FIELD.label)).toBeInTheDocument();
    expect(within(groups[1]).getByText(PARTNER_FIELD.label)).toBeInTheDocument();
  });

  it("encaixa grupo desconhecido em Outros dados", () => {
    render(
      <RecipientRejectedFields
        fields={[{ detail: "", field: "z", group: "marte", hint: "", label: "Campo Z" }]}
      />,
    );

    expect(screen.getByText("Outros dados")).toBeInTheDocument();
    expect(screen.getByText("Campo Z")).toBeInTheDocument();
  });
});
