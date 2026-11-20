import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { EventLevel } from "@/features/expocannabis/types/context";

import { LevelToast } from "./level-toast";

/** Escada com o degrau do PDV Perfeito, que o convite do programa procura. */
const COM_PDV: EventLevel[] = [
  { key: "lojista", name: "Lojista", minCents: 0, pctBp: 0 },
  { key: "parceiro", name: "Parceiro", minCents: 100000, pctBp: 500 },
  { key: "pdv_perfeito", name: "PDV Perfeito", minCents: 200000, pctBp: 800 },
  { key: "lenda", name: "Lenda", minCents: 350000, pctBp: 1200 },
];

/** Escada pedida pelo CEO em 19/11: a faixa do meio sai e o topo vira 10% em R$ 1.500. */
const SEM_MEIO: EventLevel[] = [
  { key: "lojista", name: "Lojista", minCents: 0, pctBp: 0 },
  { key: "parceiro", name: "Parceiro", minCents: 100000, pctBp: 500 },
  { key: "lenda", name: "Lenda", minCents: 150000, pctBp: 1000 },
];

function mostrar(levels: EventLevel[], levelIndex: number) {
  render(<LevelToast levels={levels} levelIndex={levelIndex} lead={false} onLead={vi.fn()} onClose={vi.fn()} />);
}

describe("LevelToast", () => {
  it("fala o desconto publicado, e não um número fixo na posição", () => {
    mostrar(COM_PDV, 2);

    expect(screen.getByText("Você é PDV Perfeito!")).toBeInTheDocument();
    expect(screen.getByText("8%")).toBeInTheDocument();
  });

  it("acompanha a escada quando a faixa do meio sai", () => {
    mostrar(SEM_MEIO, 2);

    expect(screen.getByText("Você é Lenda!")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.queryByText("8%")).not.toBeInTheDocument();
    expect(screen.queryByText("Você é PDV Perfeito!")).not.toBeInTheDocument();
  });

  it("leva o convite do PDV Perfeito para o topo quando esse degrau não existe", () => {
    mostrar(SEM_MEIO, 2);

    expect(screen.getByRole("button", { name: "Quero saber" })).toBeInTheDocument();
    expect(screen.getByText(/Quer conhecer o programa PDV Perfeito\?/)).toBeInTheDocument();
  });

  it("não oferece o convite num degrau que não é o dele", () => {
    mostrar(COM_PDV, 1);

    expect(screen.queryByRole("button", { name: "Quero saber" })).not.toBeInTheDocument();
    expect(screen.getByText("5% off em tudo + bandeja chaveiro e merch liberados.")).toBeInTheDocument();
  });
});
