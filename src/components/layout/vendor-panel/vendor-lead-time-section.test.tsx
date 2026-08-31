import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VendorLeadTimeSection } from "./vendor-lead-time-section";

describe("VendorLeadTimeSection", () => {
  it("shows the buyer-facing sentence the vendor is actually promising", () => {
    render(<VendorLeadTimeSection configured initialLeadTimeDays={4} loadFailed={false} />);

    expect(screen.getByText("Entrega em 4 dias úteis")).toBeInTheDocument();
  });

  it("updates that sentence as the vendor edits the field", () => {
    render(<VendorLeadTimeSection configured initialLeadTimeDays={4} loadFailed={false} />);

    fireEvent.change(screen.getByLabelText("Dias úteis de preparo"), { target: { value: "1" } });

    expect(screen.getByText("Entrega em 1 dia útil")).toBeInTheDocument();
  });

  it("says the default is inherited when the vendor never chose a lead time", () => {
    render(<VendorLeadTimeSection configured={false} initialLeadTimeDays={2} loadFailed={false} />);

    expect(screen.getByText(/ainda não definiu esse prazo/i)).toBeInTheDocument();
  });

  it("does not present an unread lead time as a vendor choice", () => {
    render(<VendorLeadTimeSection configured={false} initialLeadTimeDays={2} loadFailed />);

    expect(screen.queryByText(/ainda não definiu esse prazo/i)).not.toBeInTheDocument();
    expect(screen.getByText(/não foi possível ler o prazo salvo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar prazo" })).toBeDisabled();
  });

  it("blocks saving a lead time outside the accepted range", () => {
    render(<VendorLeadTimeSection configured initialLeadTimeDays={4} loadFailed={false} />);

    fireEvent.change(screen.getByLabelText("Dias úteis de preparo"), { target: { value: "45" } });

    expect(screen.getByRole("button", { name: "Salvar prazo" })).toBeDisabled();
  });
});
