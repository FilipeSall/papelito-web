import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { PhoneInput } from "./phone-input";

function Harness({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <>
      <PhoneInput onChange={setValue} value={value} />
      <output data-testid="stored">{value}</output>
    </>
  );
}

function phoneField() {
  return screen.getByLabelText("Número de telefone");
}

describe("PhoneInput", () => {
  it("starts on Brazil with the +55 calling code", () => {
    render(<Harness />);

    expect(screen.getByRole("button", { name: /\+55/ })).toBeInTheDocument();
  });

  it("masks digits as the user types and stores the E.164 value", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(phoneField(), "61999999999");

    expect(phoneField()).toHaveValue("(61) 99999-9999");
    expect(screen.getByTestId("stored")).toHaveTextContent("+5561999999999");
  });

  it("ignores formatting characters typed by the user", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(phoneField(), "(61) 3333-4444");

    expect(phoneField()).toHaveValue("(61) 3333-4444");
    expect(screen.getByTestId("stored")).toHaveTextContent("+556133334444");
  });

  it("loads an existing E.164 value already masked", () => {
    render(<Harness initialValue="+5561999999999" />);

    expect(phoneField()).toHaveValue("(61) 99999-9999");
    expect(screen.getByRole("button", { name: /\+55/ })).toBeInTheDocument();
  });

  it("loads a legacy value stored with separators without double masking or lost digits", () => {
    render(<Harness initialValue="+55 61 9836-4920" />);

    expect(phoneField()).toHaveValue("(61) 98364-920");
    expect(screen.getByRole("button", { name: /\+55/ })).toBeInTheDocument();
    expect(screen.getByTestId("stored")).toHaveTextContent("+55 61 9836-4920");
  });

  it("switches the calling code and remasks when another country is picked", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="+5561999999999" />);

    await user.click(screen.getByRole("button", { name: /\+55/ }));
    await user.click(screen.getByRole("button", { name: /Portugal/ }));

    expect(screen.getByRole("button", { name: /\+351/ })).toBeInTheDocument();
    expect(screen.getByTestId("stored")).toHaveTextContent("+35161999999999");
  });

  it("filters the country list through the dropdown search", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /\+55/ }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar país ou código" }), "portug");

    expect(screen.getByRole("button", { name: /Portugal/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Argentina/ })).not.toBeInTheDocument();
  });

  it("finds a country by unaccented name or calling code", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /\+55/ }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar país ou código" }), "belgica");

    expect(screen.getByRole("button", { name: /Bélgica/ })).toBeInTheDocument();
  });

  it("keeps the flag of the selected country visible", () => {
    render(<Harness initialValue="+351912345678" />);

    expect(screen.getByRole("button", { name: /🇵🇹/ })).toBeInTheDocument();
  });
});
