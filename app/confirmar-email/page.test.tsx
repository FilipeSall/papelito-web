import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ConfirmarEmailPage from "./page";

const searchParams = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(searchParams.value),
}));

type FetchResponse = { ok: boolean; status?: number; body: unknown };

function stubFetch(response: FetchResponse) {
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 400),
      json: () => Promise.resolve(response.body),
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("ConfirmarEmailPage", () => {
  beforeEach(() => {
    searchParams.value = "email=ana%40empresa.test&token=token-do-link";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("não confirma o e-mail só por abrir o link", async () => {
    const fetchMock = stubFetch({ ok: true, body: { ok: true } });

    await act(async () => {
      render(<ConfirmarEmailPage />);
    });

    expect(screen.getByRole("button", { name: /confirmar e-mail/i })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("confirma ao clicar, enviando o e-mail e o token do link", async () => {
    const fetchMock = stubFetch({ ok: true, body: { ok: true } });
    render(<ConfirmarEmailPage />);

    fireEvent.click(await screen.findByRole("button", { name: /confirmar e-mail/i }));

    expect(
      await screen.findByText("E-mail confirmado com sucesso. Sua conta já pode entrar com senha."),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"email":"ana@empresa.test","token":"token-do-link"}',
    });
  });

  it("mostra o motivo do backend e oferece reenvio quando o link é recusado", async () => {
    stubFetch({
      ok: false,
      status: 410,
      body: {
        code: "papelito_verification_token_expired",
        message: "Link de confirmação expirado. Solicite um novo e-mail para continuar.",
      },
    });
    render(<ConfirmarEmailPage />);

    fireEvent.click(await screen.findByRole("button", { name: /confirmar e-mail/i }));

    expect(
      await screen.findByText("Link de confirmação expirado. Solicite um novo e-mail para continuar."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reenviar e-mail/i })).toBeInTheDocument();
  });

  it("sem token no link, oferece só o reenvio", async () => {
    searchParams.value = "email=ana%40empresa.test";
    stubFetch({ ok: true, body: { ok: true } });

    render(<ConfirmarEmailPage />);

    expect(await screen.findByRole("button", { name: /reenviar e-mail/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /confirmar e-mail/i })).not.toBeInTheDocument();
  });
});
