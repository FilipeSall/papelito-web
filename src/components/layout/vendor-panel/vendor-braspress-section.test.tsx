import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { VendorBraspressIntegration } from "@/features/vendor-settings/types/vendor-braspress";

import { VendorBraspressSection } from "./vendor-braspress-section";

const integration: VendorBraspressIntegration = {
  provider: "braspress",
  enabled: true,
  status: "active",
  configurationVersion: 3,
  configured: true,
  credentialsConfigured: true,
  loadFailed: false,
  config: {
    senderCnpj: "12345678000195",
    originCep: "01310930",
  },
};

describe("VendorBraspressSection", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("requires the current password and explicit confirmation to remove credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...integration,
        enabled: false,
        credentialsConfigured: false,
        configurationVersion: 4,
        status: "unconfigured",
        config: {
          senderCnpj: "",
          originCep: "",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.click(screen.getByRole("button", { name: /remover integração e credenciais/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar remoção/i }));
    expect(screen.getByText(/confirme sua senha atual para remover/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/sua senha atual/i), { target: { value: "senha-atual" } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar remoção/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/vendor/braspress");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
    expect(fetchMock.mock.calls[0][1].body).toContain("senha-atual");
    expect(await screen.findByText(/integração braspress e credenciais removidas/i)).toBeInTheDocument();
  });

  it("shows a recoverable message when saving fails before a response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.change(screen.getByLabelText(/sua senha atual/i), { target: { value: "senha-atual" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    expect(await screen.findByText(/não foi possível falar com o servidor/i)).toBeInTheDocument();
  });

  it("explains the remaining fields and keeps the enable control directly operable", async () => {
    const user = userEvent.setup();
    render(<VendorBraspressSection initialIntegration={integration} />);

    expect(screen.getAllByRole("button", { name: "Mais informações" })).toHaveLength(6);
    expect(screen.getByRole("checkbox", { name: /habilitar braspress/i })).toHaveClass(
      "cursor-pointer",
    );

    await user.hover(screen.getAllByRole("button", { name: "Mais informações" })[2]!);

    expect(screen.getByRole("tooltip")).toHaveTextContent(/cep do local de onde a braspress coleta/i);
  });

  it("derives the contract from the store profile instead of asking the vendor to retype it", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(integration) });
    vi.stubGlobal("fetch", fetchMock);
    render(<VendorBraspressSection initialIntegration={integration} />);

    const senderCnpj = screen.getByLabelText(/cnpj remetente/i);

    expect(senderCnpj).toBeDisabled();
    expect(senderCnpj).toHaveValue("12.345.678/0001-95");
    expect(senderCnpj).toHaveClass(
      "border-[#a8a29e]",
      "bg-[#eeece5]",
      "text-[#57534e]",
      "disabled:border-[#a8a29e]",
      "disabled:bg-[#eeece5]",
      "disabled:text-[#57534e]",
    );
    expect(screen.queryByRole("combobox", { name: "Modal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Tipo de frete" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cnpj do tomador/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/unidade de peso/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/versão\s+\d+/i)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/sua senha atual/i), "senha-atual");
    await user.click(screen.getByRole("button", { name: /salvar braspress/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const payload = JSON.parse(fetchMock.mock.calls[0]![1].body as string) as Record<string, unknown>;
    expect(payload).toMatchObject({ originCep: "01310930" });
    expect(payload).not.toHaveProperty("senderCnpj");
    expect(payload).not.toHaveProperty("modal");
    expect(payload).not.toHaveProperty("freightType");
    expect(payload).not.toHaveProperty("weightUnit");
    expect(payload).not.toHaveProperty("quoteTimezone");
  });

  it("stops calling the integration active after the vendor turns it off", () => {
    render(
      <VendorBraspressSection initialIntegration={{ ...integration, enabled: false }} />,
    );

    expect(screen.getByText("Desabilitada")).toBeInTheDocument();
    expect(screen.queryByText("Ativa")).not.toBeInTheDocument();
    expect(screen.getByText(/não é oferecida no checkout/i)).toBeInTheDocument();
  });

  it("keeps the refused credential visible even with the integration turned off", () => {
    render(
      <VendorBraspressSection
        initialIntegration={{ ...integration, enabled: false, status: "invalid_credentials" }}
      />,
    );

    expect(screen.getByText("Credenciais inválidas")).toBeInTheDocument();
    expect(screen.queryByText("Desabilitada")).not.toBeInTheDocument();
  });

  it("separates saved from available in the checkout when the save succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ...integration, status: "ready" }),
      }),
    );
    render(<VendorBraspressSection initialIntegration={{ ...integration, status: "unconfigured" }} />);

    fireEvent.change(screen.getByLabelText(/sua senha atual/i), { target: { value: "senha-atual" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    const banner = await screen.findByRole("status");

    expect(banner).toHaveTextContent(/salva/i);
    expect(banner).toHaveTextContent(/ainda não/i);
    expect(banner).toHaveTextContent(/primeira cotação/i);
  });

  it("translates the error code instead of printing the backend response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: () => Promise.resolve({
          code: "papelito_vendor_integration_profile_incomplete",
          message: "SQLSTATE[HY000] wp_papelito_vendor_integrations",
        }),
      }),
    );
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.change(screen.getByLabelText(/sua senha atual/i), { target: { value: "senha-atual" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    expect(await screen.findByText(/complete o cnpj no cadastro/i)).toBeInTheDocument();
    expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
  });

  it("keeps the previous configuration on screen when the save is refused", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          code: "papelito_vendor_integration_current_password_invalid",
        }),
      }),
    );
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.change(screen.getByLabelText(/sua senha atual/i), { target: { value: "errada" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    expect(await screen.findByText(/senha da papelito/i)).toBeInTheDocument();
    expect(screen.getByText("Ativa")).toBeInTheDocument();
    expect(screen.getByLabelText(/cep de origem/i)).toHaveValue("01310930");
  });

  it("forgets the secret after saving and never sends it again", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...integration, status: "ready" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.change(screen.getByLabelText(/nova senha braspress/i), { target: { value: "s3nh4-braspress" } });
    fireEvent.change(screen.getByLabelText(/novo usuário braspress/i), { target: { value: "usuario-braspress" } });
    fireEvent.change(screen.getByLabelText(/sua senha atual/i), { target: { value: "senha-atual" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]![1].body).toContain("s3nh4-braspress");

    await waitFor(() => expect(screen.getByLabelText(/nova senha braspress/i)).toHaveValue(""));
    expect(screen.getByLabelText(/novo usuário braspress/i)).toHaveValue("");
    expect(screen.getByLabelText(/sua senha atual/i)).toHaveValue("");

    fireEvent.change(screen.getByLabelText(/sua senha atual/i), { target: { value: "senha-atual" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const second = JSON.parse(fetchMock.mock.calls[1]![1].body as string) as Record<string, unknown>;
    expect(second).toMatchObject({ password: "", username: "" });
    expect(fetchMock.mock.calls[1]![1].body).not.toContain("s3nh4-braspress");
  });

  it("offers an empty form and no removal block before anything is configured", () => {
    render(
      <VendorBraspressSection
        initialIntegration={{
          ...integration,
          enabled: false,
          status: "unconfigured",
          configured: false,
          credentialsConfigured: false,
          config: { senderCnpj: "", originCep: "" },
        }}
      />,
    );

    expect(screen.getByLabelText(/^usuário braspress$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^senha braspress$/i)).toHaveValue("");
    expect(screen.queryByRole("button", { name: /remover integração e credenciais/i })).not.toBeInTheDocument();
    expect(screen.getByText("Não configurada")).toBeInTheDocument();
  });

  it("says a credential exists without echoing any part of it", () => {
    render(<VendorBraspressSection initialIntegration={integration} />);

    const password = screen.getByLabelText(/nova senha braspress/i);

    expect(password).toHaveValue("");
    expect(password).not.toHaveAttribute("placeholder");
    expect(screen.getByText(/credencial salva/i)).toBeInTheDocument();
  });

  it("marks feedback with the same glyphs as the rest of the vendor panel", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ...integration, status: "ready" }),
      }),
    );
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/^⚠ /);

    fireEvent.change(screen.getByLabelText(/sua senha atual/i), { target: { value: "senha-atual" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));
    expect((await screen.findByRole("status")).textContent).toMatch(/^✓ /);
  });

  it("names the blocked account instead of blaming the credentials", () => {
    render(
      <VendorBraspressSection
        initialIntegration={{ ...integration, status: "provider_blocked" }}
      />,
    );

    expect(screen.getByText(/conta bloqueada na braspress/i)).toBeInTheDocument();
  });
});
