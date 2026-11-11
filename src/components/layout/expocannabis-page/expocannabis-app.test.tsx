import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { initialAttendance } from "@/features/expocannabis/hooks/attendance-reducer";
import { ATTENDANCE_STORAGE_KEY } from "@/features/expocannabis/hooks/use-attendance";
import { buildEventContext } from "@/features/expocannabis/test/fixtures";

import { ExpocannabisApp } from "./expocannabis-app";

describe("ExpocannabisApp", () => {
  it("renderiza no servidor sem ler o atendimento salvo, para a hidratação bater", () => {
    window.localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify({ ...initialAttendance(), screen: 2, buyer: null }));

    const html = renderToString(<ExpocannabisApp context={buildEventContext()} />);

    expect(html).not.toContain("Buscar produtos");
    expect(html).not.toContain("Qual o CNPJ");
  });
});
