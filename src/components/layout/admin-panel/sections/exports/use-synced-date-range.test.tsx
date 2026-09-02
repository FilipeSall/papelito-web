import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { useSyncedDateRange } from "./use-synced-date-range";

function Probe({ from, to }: { from: string; to: string }) {
  const { isOverridden, range, setRange } = useSyncedDateRange(from, to);

  return (
    <div>
      <output data-testid="range">{`${range.from}..${range.to}`}</output>
      <output data-testid="overridden">{String(isOverridden)}</output>
      <button onClick={() => setRange({ from: "2026-07-01", to: "2026-07-31" })} type="button">
        sobrescrever
      </button>
    </div>
  );
}

describe("useSyncedDateRange", () => {
  it("inicializa com o filtro da pagina", () => {
    render(<Probe from="2026-08-01" to="2026-08-31" />);

    expect(screen.getByTestId("range").textContent).toBe("2026-08-01..2026-08-31");
    expect(screen.getByTestId("overridden").textContent).toBe("false");
  });

  it("mantem o override local sem mexer no filtro da pagina", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Probe from="2026-08-01" to="2026-08-31" />);

    await user.click(screen.getByRole("button", { name: "sobrescrever" }));

    expect(screen.getByTestId("range").textContent).toBe("2026-07-01..2026-07-31");
    expect(screen.getByTestId("overridden").textContent).toBe("true");

    // A pagina nao mudou: rerender com as mesmas datas preserva o override.
    rerender(<Probe from="2026-08-01" to="2026-08-31" />);
    expect(screen.getByTestId("range").textContent).toBe("2026-07-01..2026-07-31");
  });

  it("uma mudanca posterior no filtro da pagina sobrescreve o override", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Probe from="2026-08-01" to="2026-08-31" />);

    await user.click(screen.getByRole("button", { name: "sobrescrever" }));
    rerender(<Probe from="2026-06-01" to="2026-06-30" />);

    expect(screen.getByTestId("range").textContent).toBe("2026-06-01..2026-06-30");
    expect(screen.getByTestId("overridden").textContent).toBe("false");
  });

  it("remontagem (F5 / nova entrada) volta ao filtro da pagina", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Probe from="2026-08-01" to="2026-08-31" />);

    await user.click(screen.getByRole("button", { name: "sobrescrever" }));
    expect(screen.getByTestId("range").textContent).toBe("2026-07-01..2026-07-31");
    unmount();

    render(<Probe from="2026-08-01" to="2026-08-31" />);
    expect(screen.getByTestId("range").textContent).toBe("2026-08-01..2026-08-31");
  });
});
