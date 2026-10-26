import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "../../../../../../test/msw/server";
import { EXPORT_REPORTS, withCategoryChoice } from "./export-report-config";
import { ExportReportBlock } from "./export-report-block";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("ExportReportBlock", () => {
  it("mostra quantas linhas sairiam antes de exportar", async () => {
    render(<ExportReportBlock definition={EXPORT_REPORTS.sales} />);
    expect(await screen.findByRole("button", { name: "Exportar 3 pedidos pagos" })).toBeEnabled();
  });

  it("período sem dados bloqueia o download e explica por quê", async () => {
    server.use(http.get("*/api/admin/reports/users/count", () => HttpResponse.json({ count: 0 })));
    render(<ExportReportBlock definition={EXPORT_REPORTS.users} />);
    expect(await screen.findByText("Nada para exportar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeDisabled();
  });

  it("período personalizado invertido mostra o erro e não consulta a contagem", async () => {
    const user = userEvent.setup();
    render(<ExportReportBlock definition={EXPORT_REPORTS.sales} />);
    await user.click(screen.getByRole("radio", { name: "Personalizado" }));
    const [from] = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    await user.clear(from);
    await user.type(from, "2099-01-01");
    expect(await screen.findByText(/A data inicial vem depois da final/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeDisabled();
  });

  it("usuários levam o papel para a contagem", async () => {
    let role = "";
    server.use(
      http.get("*/api/admin/reports/users/count", ({ request }) => {
        role = new URL(request.url).searchParams.get("role") ?? "";
        return HttpResponse.json({ count: 2 });
      }),
    );
    const user = userEvent.setup();
    render(<ExportReportBlock definition={EXPORT_REPORTS.users} />);
    await user.click(screen.getByRole("radio", { name: "Vendors" }));
    expect(await screen.findByRole("button", { name: "Exportar 2 contas" })).toBeEnabled();
    expect(role).toBe("seller");
  });

  it("produtos não têm período e levam situação e categoria para a contagem", async () => {
    let query = "";
    server.use(
      http.get("*/api/admin/reports/products/count", ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json({ count: 8 });
      }),
    );
    const user = userEvent.setup();
    render(<ExportReportBlock definition={withCategoryChoice(EXPORT_REPORTS.products, [{ name: "Sedas", slug: "sedas" }])} />);
    expect(screen.queryByRole("radio", { name: "30 dias" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Rascunhos" }));
    await user.click(screen.getByRole("radio", { name: "Sedas" }));
    expect(await screen.findByRole("button", { name: "Exportar 8 produtos" })).toBeEnabled();
    expect(query).toBe("?status=draft&category=sedas");
  });
});
