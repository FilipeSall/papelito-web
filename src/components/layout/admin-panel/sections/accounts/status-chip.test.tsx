import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AccountStatusChip,
  ApplicationStatusChip,
  CompanyStatusChip,
  EntityMark,
} from "./status-chip";

describe("status com ícone", () => {
  it("mantém o texto do status, não só a cor", () => {
    render(<AccountStatusChip status="suspended" />);

    expect(screen.getByText("Suspensa")).toBeInTheDocument();
  });

  it("acompanha o texto de um ícone escondido de tecnologias assistivas", () => {
    const { container } = render(<AccountStatusChip status="active" />);
    const icon = container.querySelector("svg");

    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden");
    expect(screen.getByText("Ativa")).toBeInTheDocument();
  });

  it("usa o rótulo recebido quando o status é desconhecido", () => {
    render(<AccountStatusChip fallbackLabel="Sob análise" status="algo_novo" />);

    expect(screen.getByText("Sob análise")).toBeInTheDocument();
  });

  it("traduz os estados de empresa e de candidatura", () => {
    const { rerender } = render(<CompanyStatusChip status="onboarding" />);
    expect(screen.getByText("Em cadastro")).toBeInTheDocument();

    rerender(<ApplicationStatusChip status="rejected" />);
    expect(screen.getByText("Reprovada")).toBeInTheDocument();
  });

  it("dá nome acessível ao ícone da entidade", () => {
    render(<EntityMark kind="vendor" label="Vendor" />);

    expect(screen.getByText("Vendor")).toHaveClass("sr-only");
  });
});
