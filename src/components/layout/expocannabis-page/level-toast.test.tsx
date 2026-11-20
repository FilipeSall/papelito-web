import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { EventLevel } from "@/features/expocannabis/types/context";

import { LevelToast } from "./level-toast";

/** Escada publicada hoje no WordPress. */
const HOJE: EventLevel[] = [
  { key: "lojista", name: "Lojista", minUnits: 0, pctBp: 0 },
  { key: "parceiro", name: "Parceiro", minUnits: 10, pctBp: 500 },
  { key: "pdv_perfeito", name: "PDV Perfeito", minUnits: 20, pctBp: 800 },
  { key: "lenda", name: "Lenda", minUnits: 40, pctBp: 1200 },
];

/** Escada pedida pelo CEO em 19/11: a faixa do meio sai e o topo vira 10% em 15 un. */
const SEM_MEIO: EventLevel[] = [
  { key: "lojista", name: "Lojista", minUnits: 0, pctBp: 0 },
  { key: "parceiro", name: "Parceiro", minUnits: 10, pctBp: 500 },
  { key: "lenda", name: "Lenda", minUnits: 15, pctBp: 1000 },
];

function mostrar(levels: EventLevel[], levelIndex: number) {
  render(<LevelToast levels={levels} levelIndex={levelIndex} lead={false} onLead={vi.fn()} onClose={vi.fn()} />);
}

describe("LevelToast", () => {
  it("fala o desconto publicado, e não um número fixo na posição", () => {
    mostrar(HOJE, 2);

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
    mostrar(HOJE, 1);

    expect(screen.queryByRole("button", { name: "Quero saber" })).not.toBeInTheDocument();
    expect(screen.getByText("5% off em tudo + bandeja chaveiro e merch liberados.")).toBeInTheDocument();
  });
});
