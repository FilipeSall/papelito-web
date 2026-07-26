import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NewNotificationToast } from "./new-notification-toast";

// O toast fica montado o tempo todo e some só por opacidade/translate, então um card com
// pointer-events ativo enquanto invisível vira um bloqueador transparente fixo por cima da
// página (regressão real: header do painel admin ficou inclicável).
describe("NewNotificationToast", () => {
  it("does not capture pointer events while hidden", () => {
    render(<NewNotificationToast onClose={vi.fn()} visible={false} />);

    const card = screen.getByRole("status").firstElementChild;

    expect(card).toHaveClass("pointer-events-none");
    expect(card).not.toHaveClass("pointer-events-auto");
  });

  it("captures pointer events while visible so the close button is clickable", () => {
    render(<NewNotificationToast onClose={vi.fn()} visible />);

    expect(screen.getByRole("status").firstElementChild).toHaveClass("pointer-events-auto");
  });
});
