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

const UNCONFIGURED: VendorBraspressIntegration = {
  ...integration,
  enabled: false,
  status: "unconfigured",
  configured: false,
  credentialsConfigured: false,
  config: { senderCnpj: "", originCep: "" },
};

const REAUTH_TICKET = "tiquete-de-teste";
const ACCOUNT_PASSWORD = "senha-da-conta-papelito";
const BRASPRESS_SECRET = "s3nh4-braspress";
const BRASPRESS_USERNAME = "usuario-braspress";
const WRITE_URL = "/api/vendor/braspress";
const REAUTH_URL = "/api/vendor/braspress/reauth";
const WRONG_PASSWORD_CODE = "papelito_vendor_integration_current_password_invalid";

const UNUSABLE_BODIES: ReadonlyArray<[string, () => Promise<unknown>]> = [
  ["não é JSON", () => Promise.reject(new SyntaxError("Unexpected token < in JSON at position 0"))],
  ["é um JSON que não é objeto", () => Promise.resolve("ok")],
  ["é uma lista", () => Promise.resolve([])],
];

function jsonResponse(data: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    json: () => Promise.resolve(data),
    ok: init.ok ?? true,
    status: init.status ?? 200,
  };
}

const TICKET_RESPONSE = () => Promise.resolve(jsonResponse({ expiresIn: 300, ticket: REAUTH_TICKET }));
const WRONG_PASSWORD_RESPONSE = () =>
  Promise.resolve(jsonResponse({ code: WRONG_PASSWORD_CODE }, { ok: false, status: 403 }));

/**
 * Roteia o `fetch` entre confirmar a senha e escrever a integração, porque o
 * fluxo passou a ter dois destinos e o teste precisa distinguir um do outro.
 */
function stubBraspress(
  write: () => Promise<unknown>,
  reauth: () => Promise<unknown> = TICKET_RESPONSE,
) {
  const fetchMock = vi.fn((url: unknown) => (String(url) === REAUTH_URL ? reauth() : write()));
  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

/** Chamadas de escrita da integração, sem as de confirmação de senha. */
function writeCalls(fetchMock: ReturnType<typeof stubBraspress>) {
  return fetchMock.mock.calls.filter(([url]) => String(url) === WRITE_URL);
}

/** Corpo enviado na n-ésima escrita, já desserializado. */
function writeBody(fetchMock: ReturnType<typeof stubBraspress>, index = 0) {
  const [, init] = writeCalls(fetchMock)[index] as unknown as [string, { body: string }];

  return JSON.parse(init.body) as Record<string, unknown>;
}

/** Preenche e confirma o diálogo de senha, como o vendor faz. */
function confirmAccountPassword(password = ACCOUNT_PASSWORD) {
  fireEvent.change(screen.getByLabelText(/senha da sua conta papelito/i), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: /^confirmar/i }));
}

/** Abre o diálogo de alteração e libera o formulário de credencial. */
async function unlockCredentialForm() {
  fireEvent.click(screen.getByRole("button", { name: /alterar dados braspress/i }));
  confirmAccountPassword();

  await screen.findByLabelText(/novo usuário braspress/i);
}

function credentialFieldsPresent() {
  return screen.queryByLabelText(/usuário braspress/i) !== null;
}

describe("VendorBraspressSection", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("troca o formulário permanente por duas ações quando já há credencial", () => {
    render(<VendorBraspressSection initialIntegration={integration} />);

    expect(credentialFieldsPresent()).toBe(false);
    expect(screen.queryByLabelText(/senha braspress/i)).not.toBeInTheDocument();

    const change = screen.getByRole("button", { name: /alterar dados braspress/i });
    const remove = screen.getByRole("button", { name: /^remover integração$/i });

    expect(change).toBeInTheDocument();
    expect(remove).toBeInTheDocument();
    expect(change.compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(change).toHaveAttribute("aria-haspopup", "dialog");
    expect(remove).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("não abre o formulário direto: pede a senha da conta antes", () => {
    stubBraspress(() => Promise.resolve(jsonResponse(integration)));
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.click(screen.getByRole("button", { name: /alterar dados braspress/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/senha da sua conta papelito/i)).toHaveValue("");
    expect(credentialFieldsPresent()).toBe(false);
  });

  it("senha errada permanece no diálogo e não revela o formulário", async () => {
    const fetchMock = stubBraspress(
      () => Promise.resolve(jsonResponse(integration)),
      WRONG_PASSWORD_RESPONSE,
    );
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.click(screen.getByRole("button", { name: /alterar dados braspress/i }));
    confirmAccountPassword("errada");

    expect(await screen.findByRole("alert")).toHaveTextContent(/senha da papelito/i);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(credentialFieldsPresent()).toBe(false);
    expect(writeCalls(fetchMock)).toHaveLength(0);
  });

  it("o diálogo cobra a senha antes de chamar o servidor", () => {
    const fetchMock = stubBraspress(() => Promise.resolve(jsonResponse(integration)));
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.click(screen.getByRole("button", { name: /alterar dados braspress/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar senha/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/digite a senha da sua conta/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("senha certa libera a edição e a gravação viaja com o tíquete, não com a senha", async () => {
    const fetchMock = stubBraspress(() =>
      Promise.resolve(jsonResponse({ ...integration, status: "ready" })),
    );
    render(<VendorBraspressSection initialIntegration={integration} />);

    await unlockCredentialForm();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fetchMock.mock.calls[0]![0]).toBe(REAUTH_URL);

    fireEvent.change(screen.getByLabelText(/novo usuário braspress/i), {
      target: { value: BRASPRESS_USERNAME },
    });
    fireEvent.change(screen.getByLabelText(/nova senha braspress/i), {
      target: { value: BRASPRESS_SECRET },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar credenciais/i }));

    await waitFor(() => expect(writeCalls(fetchMock)).toHaveLength(1));
    const payload = writeBody(fetchMock);

    expect(writeCalls(fetchMock)[0]![1]).toMatchObject({ method: "PUT" });
    expect(payload).toMatchObject({
      password: BRASPRESS_SECRET,
      reauthTicket: REAUTH_TICKET,
      username: BRASPRESS_USERNAME,
    });
    expect(payload).not.toHaveProperty("currentPassword");
  });

  it("fecha o formulário depois de salvar e volta às duas ações", async () => {
    const fetchMock = stubBraspress(() =>
      Promise.resolve(jsonResponse({ ...integration, status: "ready" })),
    );
    render(<VendorBraspressSection initialIntegration={integration} />);

    await unlockCredentialForm();

    fireEvent.change(screen.getByLabelText(/novo usuário braspress/i), {
      target: { value: BRASPRESS_USERNAME },
    });
    fireEvent.change(screen.getByLabelText(/nova senha braspress/i), {
      target: { value: BRASPRESS_SECRET },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar credenciais/i }));

    expect(await screen.findByRole("button", { name: /alterar dados braspress/i })).toBeInTheDocument();
    expect(credentialFieldsPresent()).toBe(false);

    fireEvent.click(await screen.findByRole("button", { name: /salvar braspress/i }));

    await waitFor(() => expect(writeCalls(fetchMock)).toHaveLength(2));
    const second = writeBody(fetchMock, 1);

    expect(second).not.toHaveProperty("password");
    expect(second).not.toHaveProperty("reauthTicket");
    expect(JSON.stringify(second)).not.toContain(BRASPRESS_SECRET);
  });

  it("remover exige confirmação com senha e devolve a tela ao cadastro inicial", async () => {
    const fetchMock = stubBraspress(() => Promise.resolve(jsonResponse(UNCONFIGURED)));
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.click(screen.getByRole("button", { name: /^remover integração$/i }));

    expect(screen.getByRole("dialog")).toHaveTextContent(/deixa de ser oferecida no checkout/i);
    expect(writeCalls(fetchMock)).toHaveLength(0);

    confirmAccountPassword();

    await waitFor(() => expect(writeCalls(fetchMock)).toHaveLength(1));
    expect(writeCalls(fetchMock)[0]![1]).toMatchObject({ method: "DELETE" });
    expect(writeBody(fetchMock)).toEqual({ reauthTicket: REAUTH_TICKET });

    expect(await screen.findByText(/integração braspress e credenciais removidas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^usuário braspress$/i)).toHaveValue("");
    expect(screen.queryByRole("button", { name: /alterar dados braspress/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^remover integração$/i })).not.toBeInTheDocument();
  });

  it("salvar apenas parâmetros não pede senha nenhuma", async () => {
    const fetchMock = stubBraspress(() => Promise.resolve(jsonResponse(integration)));
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.change(screen.getByLabelText(/cep de origem/i), { target: { value: "01001000" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    await waitFor(() => expect(writeCalls(fetchMock)).toHaveLength(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url) === REAUTH_URL)).toBe(false);
    expect(writeBody(fetchMock)).toEqual({ enabled: true, originCep: "01001000" });
  });

  it("shows a recoverable message when saving fails before a response", async () => {
    stubBraspress(() => Promise.reject(new Error("offline")));
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    expect(await screen.findByText(/não foi possível falar com o servidor/i)).toBeInTheDocument();
  });

  it("explains the remaining fields and keeps the enable control directly operable", async () => {
    const user = userEvent.setup();
    render(<VendorBraspressSection initialIntegration={integration} />);

    expect(screen.getAllByRole("button", { name: "Mais informações" })).toHaveLength(3);
    expect(screen.getByRole("checkbox", { name: /habilitar braspress/i })).toHaveClass(
      "cursor-pointer",
    );

    await user.hover(screen.getAllByRole("button", { name: "Mais informações" })[2]!);

    expect(screen.getByRole("tooltip")).toHaveTextContent(/cep do local de onde a braspress coleta/i);
  });

  it("derives the contract from the store profile instead of asking the vendor to retype it", async () => {
    const user = userEvent.setup();
    const fetchMock = stubBraspress(() => Promise.resolve(jsonResponse(integration)));
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

    await user.click(screen.getByRole("button", { name: /salvar braspress/i }));

    await waitFor(() => expect(writeCalls(fetchMock)).toHaveLength(1));
    const payload = writeBody(fetchMock);

    expect(payload).toMatchObject({ originCep: "01310930" });
    expect(payload).not.toHaveProperty("senderCnpj");
    expect(payload).not.toHaveProperty("modal");
    expect(payload).not.toHaveProperty("freightType");
    expect(payload).not.toHaveProperty("weightUnit");
    expect(payload).not.toHaveProperty("quoteTimezone");
  });

  it("stops calling the integration active after the vendor turns it off", () => {
    render(<VendorBraspressSection initialIntegration={{ ...integration, enabled: false }} />);

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
    stubBraspress(() => Promise.resolve(jsonResponse({ ...integration, status: "ready" })));
    render(<VendorBraspressSection initialIntegration={{ ...integration, status: "unconfigured" }} />);

    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    const banner = await screen.findByRole("status");

    expect(banner).toHaveTextContent(/salva/i);
    expect(banner).toHaveTextContent(/ainda não/i);
    expect(banner).toHaveTextContent(/primeira cotação/i);
  });

  it("translates the error code instead of printing the backend response", async () => {
    stubBraspress(() =>
      Promise.resolve(
        jsonResponse(
          {
            code: "papelito_vendor_integration_profile_incomplete",
            message: "SQLSTATE[HY000] wp_papelito_vendor_integrations",
          },
          { ok: false, status: 422 },
        ),
      ),
    );
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    expect(await screen.findByText(/complete o cnpj no cadastro/i)).toBeInTheDocument();
    expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
  });

  it("keeps the previous configuration on screen when the save is refused", async () => {
    stubBraspress(() =>
      Promise.resolve(
        jsonResponse(
          { code: "papelito_vendor_integration_rate_limited" },
          { ok: false, status: 429 },
        ),
      ),
    );
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    expect(await screen.findByText(/alguns minutos/i)).toBeInTheDocument();
    expect(screen.getByText("Ativa")).toBeInTheDocument();
    expect(screen.getByLabelText(/cep de origem/i)).toHaveValue("01310930");
  });

  it("pede a senha de novo quando o tíquete vence antes do envio", async () => {
    let expired = true;
    const fetchMock = stubBraspress(() => {
      if (expired) {
        expired = false;

        return Promise.resolve(
          jsonResponse(
            { code: "papelito_vendor_integration_reauth_ticket_invalid" },
            { ok: false, status: 403 },
          ),
        );
      }

      return Promise.resolve(jsonResponse({ ...integration, status: "ready" }));
    });
    render(<VendorBraspressSection initialIntegration={integration} />);

    await unlockCredentialForm();

    fireEvent.change(screen.getByLabelText(/novo usuário braspress/i), {
      target: { value: BRASPRESS_USERNAME },
    });
    fireEvent.change(screen.getByLabelText(/nova senha braspress/i), {
      target: { value: BRASPRESS_SECRET },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar credenciais/i }));

    expect(await screen.findByRole("dialog")).toHaveTextContent(/confirme sua senha/i);

    confirmAccountPassword();

    await waitFor(() => expect(writeCalls(fetchMock)).toHaveLength(2));
    expect(writeBody(fetchMock, 1)).toMatchObject({ username: BRASPRESS_USERNAME });
  });

  it("offers an empty form and no removal block before anything is configured", () => {
    render(<VendorBraspressSection initialIntegration={UNCONFIGURED} />);

    expect(screen.getByLabelText(/^usuário braspress$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^senha braspress$/i)).toHaveValue("");
    expect(screen.queryByRole("button", { name: /^remover integração$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /alterar dados braspress/i })).not.toBeInTheDocument();
    expect(screen.getByText("Não configurada")).toBeInTheDocument();
  });

  it("o cadastro inicial também confirma a identidade antes de gravar a credencial", async () => {
    const fetchMock = stubBraspress(() =>
      Promise.resolve(jsonResponse({ ...integration, status: "ready" })),
    );
    render(<VendorBraspressSection initialIntegration={UNCONFIGURED} />);

    fireEvent.change(screen.getByLabelText(/^usuário braspress$/i), {
      target: { value: BRASPRESS_USERNAME },
    });
    fireEvent.change(screen.getByLabelText(/^senha braspress$/i), {
      target: { value: BRASPRESS_SECRET },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(writeCalls(fetchMock)).toHaveLength(0);

    confirmAccountPassword();

    await waitFor(() => expect(writeCalls(fetchMock)).toHaveLength(1));
    expect(writeBody(fetchMock)).toMatchObject({ reauthTicket: REAUTH_TICKET });
  });

  it("recusa credencial pela metade antes de cobrar a senha", () => {
    const fetchMock = stubBraspress(() => Promise.resolve(jsonResponse(integration)));
    render(<VendorBraspressSection initialIntegration={UNCONFIGURED} />);

    fireEvent.change(screen.getByLabelText(/^usuário braspress$/i), {
      target: { value: BRASPRESS_USERNAME },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/usuário e senha juntos/i);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says a credential exists without echoing any part of it", () => {
    render(<VendorBraspressSection initialIntegration={integration} />);

    expect(screen.getByText(/salvos e criptografados/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/senha braspress/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain(BRASPRESS_SECRET);
  });

  it("marks feedback with the same glyphs as the rest of the vendor panel", async () => {
    let refuse = true;
    stubBraspress(() => {
      if (refuse) {
        refuse = false;

        return Promise.resolve(
          jsonResponse({ code: "papelito_vendor_integration_save_failed" }, { ok: false, status: 500 }),
        );
      }

      return Promise.resolve(jsonResponse({ ...integration, status: "ready" }));
    });
    render(<VendorBraspressSection initialIntegration={integration} />);

    fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/^⚠ /);

    fireEvent.click(await screen.findByRole("button", { name: /salvar braspress/i }));
    expect((await screen.findByRole("status")).textContent).toMatch(/^✓ /);
  });

  it("names the blocked account instead of blaming the credentials", () => {
    render(<VendorBraspressSection initialIntegration={{ ...integration, status: "provider_blocked" }} />);

    expect(screen.getByText(/conta bloqueada na braspress/i)).toBeInTheDocument();
  });

  it.each(UNUSABLE_BODIES)(
    "não afirma nada sobre a Braspress quando a resposta do salvar %s",
    async (_label, json) => {
      stubBraspress(() => Promise.resolve({ json, ok: true, status: 200 }));
      render(<VendorBraspressSection initialIntegration={integration} />);

      fireEvent.click(screen.getByRole("button", { name: /salvar braspress/i }));

      expect(await screen.findByText("Estado não lido")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(/recarregue a página/i);
      expect(screen.queryByText("Desabilitada")).not.toBeInTheDocument();
      expect(screen.queryByText(/continua desabilitada/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/cnpj remetente/i)).toHaveValue("12.345.678/0001-95");
    },
  );

  it.each(UNUSABLE_BODIES)(
    "não afirma nada sobre a Braspress quando a resposta da remoção %s",
    async (_label, json) => {
      stubBraspress(() => Promise.resolve({ json, ok: true, status: 200 }));
      render(<VendorBraspressSection initialIntegration={integration} />);

      fireEvent.click(screen.getByRole("button", { name: /^remover integração$/i }));
      confirmAccountPassword();

      expect(await screen.findByText("Estado não lido")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(/recarregue a página/i);
      expect(screen.queryByText("Desabilitada")).not.toBeInTheDocument();
      expect(screen.queryByText(/credenciais removidas/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/cnpj remetente/i)).toHaveValue("12.345.678/0001-95");
    },
  );
});
