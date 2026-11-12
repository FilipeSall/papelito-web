import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExpoEventStrip } from "./expo-event-strip";

function at(date: string) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(date));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ExpoEventStrip", () => {
  it("antes da janela mostra as datas e já leva ao tablet em aba nova", () => {
    at("2026-11-19T10:00:00-03:00");
    render(<ExpoEventStrip />);

    expect(screen.getByText("Venda no estande de 20/11 a 22/11")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Abrir estande/ });
    expect(link).toHaveAttribute("href", "/expocannabis");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("durante a janela diz até quando a venda vai", () => {
    at("2026-11-21T10:00:00-03:00");
    render(<ExpoEventStrip />);

    expect(screen.getByText("Venda aberta no estande até 22/11")).toBeInTheDocument();
  });

  it("some sozinha quando o evento termina", () => {
    at("2026-11-23T00:00:01-03:00");
    const { container } = render(<ExpoEventStrip />);

    expect(container).toBeEmptyDOMElement();
  });
});
