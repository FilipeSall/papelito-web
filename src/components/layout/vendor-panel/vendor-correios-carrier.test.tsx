import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type CorreiosLockReason, VendorCorreiosCarrier } from "./vendor-correios-carrier";

const SWITCH_NAME = /habilitar correios/i;
const LOCKED_TEXT = /configure primeiro sua conta da braspress/i;
const FALLBACK_TEXT = /mesmo desabilitados, os correios poderão ser utilizados automaticamente/i;
const INFO_BUTTON = "Mais informações";
const UNLOCKED_ON = { enabled: true, locked: false };

function jsonResponse(data: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { json: () => Promise.resolve(data), ok: init.ok ?? true, status: init.status ?? 200 };
}

type RenderOptions = {
  braspressEnabled?: boolean;
  loadFailed?: boolean;
  lockReason?: CorreiosLockReason;
};

function renderCarrier(
  preference = UNLOCKED_ON,
  { braspressEnabled = true, loadFailed = false, lockReason = "unconfigured" }: RenderOptions = {},
) {
  const onSaved = vi.fn();
  render(
    <VendorCorreiosCarrier
      braspressEnabled={braspressEnabled}
      disabled={false}
      loadFailed={loadFailed}
      lockReason={lockReason}
      onBusyChange={vi.fn()}
      onSaved={onSaved}
      preference={preference}
    />,
  );

  return onSaved;
}

function stubSettings(data: unknown, init: { ok?: boolean; status?: number } = {}) {
  const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(data, init)));
  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

describe("VendorCorreiosCarrier", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("trava os Correios em ON sem Braspress configurada e explica por quê", async () => {
    const user = userEvent.setup();
    renderCarrier({ enabled: true, locked: true });

    const toggle = screen.getByRole("switch", { name: SWITCH_NAME });
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(LOCKED_TEXT)).toBeInTheDocument();

    await user.hover(screen.getByRole("button", { name: INFO_BUTTON }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(LOCKED_TEXT);
    expect(screen.getByRole("tooltip")).toHaveTextContent(FALLBACK_TEXT);
  });

  it("mantém o aviso de contingência alcançável com os Correios desligados", async () => {
    const user = userEvent.setup();
    renderCarrier({ enabled: false, locked: false });

    expect(screen.getByRole("switch", { name: SWITCH_NAME })).toBeEnabled();
    expect(screen.getByRole("switch", { name: SWITCH_NAME })).toHaveAttribute("aria-checked", "false");

    await user.hover(screen.getByRole("button", { name: INFO_BUTTON }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(FALLBACK_TEXT);
  });

  it("grava a escolha e adota o estado confirmado pelo servidor", async () => {
    const user = userEvent.setup();
    const fetchMock = stubSettings({ braspress_enabled: true, correios_enabled: false, correios_locked: false });
    const onSaved = renderCarrier();

    await user.click(screen.getByRole("switch", { name: SWITCH_NAME }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ enabled: false, locked: false }, true, null));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/vendor/settings",
      expect.objectContaining({ body: JSON.stringify({ correios_enabled: false }), method: "PUT" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(/correios desabilitados/i);
  });

  it("volta a habilitar os Correios", async () => {
    const user = userEvent.setup();
    stubSettings({ braspress_enabled: true, correios_enabled: true, correios_locked: false });
    const onSaved = renderCarrier({ enabled: false, locked: false });

    await user.click(screen.getByRole("switch", { name: SWITCH_NAME }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(UNLOCKED_ON, true, null));
    expect(await screen.findByRole("status")).toHaveTextContent(/correios habilitados/i);
  });

  it("recusa da regra trava o cartão e não finge sucesso", async () => {
    const user = userEvent.setup();
    stubSettings({ code: "papelito_vendor_correios_locked" }, { ok: false, status: 422 });
    const onSaved = renderCarrier();

    await user.click(screen.getByRole("switch", { name: SWITCH_NAME }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ enabled: true, locked: true }, null, null));
    expect(await screen.findByRole("alert")).toHaveTextContent(LOCKED_TEXT);
  });

  it("avisa antes que desligar os Correios liga a Braspress desligada", () => {
    renderCarrier(UNLOCKED_ON, { braspressEnabled: false });

    expect(screen.getByText(/a braspress é habilitada automaticamente/i)).toBeInTheDocument();
  });

  it("confirma quando a Braspress foi ligada junto com o desligamento dos Correios", async () => {
    const user = userEvent.setup();
    stubSettings({ braspress_enabled: true, correios_enabled: false, correios_locked: false });
    const onSaved = renderCarrier(UNLOCKED_ON, { braspressEnabled: false });

    await user.click(screen.getByRole("switch", { name: SWITCH_NAME }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ enabled: false, locked: false }, true, null));
    expect(await screen.findByRole("status")).toHaveTextContent(/braspress habilitada/i);
  });

  it("não desliga os Correios quando a Braspress não pôde ser ligada", async () => {
    const user = userEvent.setup();
    stubSettings({ code: "papelito_vendor_integration_profile_incomplete" }, { ok: false, status: 422 });
    const onSaved = renderCarrier(UNLOCKED_ON, { braspressEnabled: false });

    await user.click(screen.getByRole("switch", { name: SWITCH_NAME }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível habilitar a braspress/i);
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("switch", { name: SWITCH_NAME })).toHaveAttribute("aria-checked", "true");
  });

  it("explica a trava quando a Braspress está cadastrada mas não liberada", () => {
    renderCarrier({ enabled: true, locked: true }, { lockReason: "unreleased" });

    expect(screen.getByText(/ainda não foi liberada para a sua loja/i)).toBeInTheDocument();
  });

  it.each([
    ["falha de persistência", () => Promise.resolve(jsonResponse({ code: "papelito_vendor_correios_save_failed" }, { ok: false, status: 500 }))],
    ["falha de rede", () => Promise.reject(new TypeError("Failed to fetch"))],
    ["resposta ilegível", () => Promise.resolve(jsonResponse("ok"))],
  ])("%s mantém o estado anterior e avisa", async (_label, respond) => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(respond));
    const onSaved = renderCarrier();

    await user.click(screen.getByRole("switch", { name: SWITCH_NAME }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("switch", { name: SWITCH_NAME })).toHaveAttribute("aria-checked", "true");
  });

  it("não libera o interruptor quando o estado não pôde ser lido", () => {
    renderCarrier(UNLOCKED_ON, { loadFailed: true });

    expect(screen.getByRole("switch", { name: SWITCH_NAME })).toBeDisabled();
  });
});
