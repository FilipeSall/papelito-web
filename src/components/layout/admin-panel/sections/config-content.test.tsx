import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import {
  getContactConfigPhone,
  getContactConfigSocial,
  setContactConfigPhone,
  setContactConfigSocial,
} from "../../../../../test/msw/handlers/contact-config";
import { server } from "../../../../../test/msw/server";
import { ConfigContent } from "./config-content";

describe("ConfigContent", () => {
  it("always requires the current password", () => {
    render(<ConfigContent />);

    expect(screen.getByText("Senha atual")).toBeInTheDocument();
    expect(screen.getByText("Nova senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /atualizar senha/i })).toBeInTheDocument();
  });

  it("loads the stored contact phone already masked and defaulted to Brazil", async () => {
    setContactConfigPhone("+5561999999999");
    render(<ConfigContent />);

    await waitFor(() => {
      expect(screen.getByLabelText("Número de telefone")).toHaveValue("(61) 99999-9999");
    });
    expect(screen.getByRole("button", { name: /🇧🇷 \+55/ })).toBeInTheDocument();
  });

  it("saves the phone normalized to E.164", async () => {
    setContactConfigPhone("+5561999999999");
    const user = userEvent.setup();
    render(<ConfigContent />);

    const field = await screen.findByLabelText("Número de telefone");
    await user.clear(field);
    await user.type(field, "6133334444");

    expect(field).toHaveValue("(61) 3333-4444");

    await user.click(screen.getByRole("button", { name: /salvar telefone/i }));

    expect(await screen.findByText("Telefone salvo.")).toBeInTheDocument();
    expect(getContactConfigPhone()).toBe("+556133334444");
  });

  it("does not let a failed load overwrite the stored phone with the default", async () => {
    server.use(
      http.get("*/api/admin/contact-config", () =>
        HttpResponse.json({ message: "Falha temporária" }, { status: 500 }),
      ),
    );
    setContactConfigPhone("+5561999999999");
    const user = userEvent.setup();
    render(<ConfigContent />);

    expect(
      await screen.findByText("Não foi possível carregar o telefone."),
    ).toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: /salvar telefone/i });
    expect(saveButton).toBeDisabled();

    await user.click(saveButton);

    // O campo ficou com DEFAULT_CONTACT_PHONE porque a leitura falhou; salvar publicaria esse
    // padrão por cima do número real que está no ar.
    expect(getContactConfigPhone()).toBe("+5561999999999");
  });

  it("loads the stored social profile links", async () => {
    setContactConfigSocial({ instagram: "https://www.instagram.com/outra/" });
    render(<ConfigContent />);

    await waitFor(() => {
      expect(screen.getByLabelText("Instagram")).toHaveValue("https://www.instagram.com/outra/");
    });
    expect(screen.getByLabelText("TikTok")).toHaveValue("https://www.tiktok.com/@papelitobrasil");
  });

  it("saves an emptied social link as hidden instead of restoring the default", async () => {
    setContactConfigSocial({});
    const user = userEvent.setup();
    render(<ConfigContent />);

    const field = await screen.findByLabelText("X");
    await user.clear(field);
    await user.click(screen.getByRole("button", { name: /salvar redes sociais/i }));

    expect(await screen.findByText("Redes sociais salvas.")).toBeInTheDocument();
    expect(getContactConfigSocial().x).toBe("");
  });

  it("refuses a social link that is not http or https", async () => {
    setContactConfigSocial({});
    const user = userEvent.setup();
    render(<ConfigContent />);

    const field = await screen.findByLabelText("YouTube");
    await user.clear(field);
    await user.type(field, "youtube.com/papelito");
    await user.click(screen.getByRole("button", { name: /salvar redes sociais/i }));

    expect(
      await screen.findByText(/Informe uma URL http ou https para YouTube/),
    ).toBeInTheDocument();
    expect(getContactConfigSocial().youtube).toBe("https://www.youtube.com/c/PapelitoBrasil");
  });

  it("does not allow saving defaults when the social config cannot be loaded", async () => {
    server.use(
      http.get("*/api/admin/contact-config", () =>
        HttpResponse.json({ message: "Falha temporária" }, { status: 500 }),
      ),
    );
    setContactConfigSocial({ instagram: "https://www.instagram.com/outra/" });
    render(<ConfigContent />);

    // Telefone e redes sociais leem a mesma rota: as duas seções entram em "Carregando" juntas.
    expect(screen.getAllByRole("button", { name: /carregando/i })).toHaveLength(2);
    for (const loadingButton of screen.getAllByRole("button", { name: /carregando/i })) {
      expect(loadingButton).toBeDisabled();
    }
    expect(await screen.findByText("Não foi possível carregar as redes sociais.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /salvar redes sociais/i })).toBeDisabled();

    expect(screen.getByLabelText("Instagram")).toHaveValue(
      "https://www.instagram.com/papelitobrasil/",
    );
  });

  it("preserves an edit made while the social config request is pending", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get("*/api/admin/contact-config", async () => {
        await pending;

        return HttpResponse.json({
          phone: "+556198364920",
          social: { instagram: "https://www.instagram.com/outra/" },
        });
      }),
    );
    const user = userEvent.setup();
    render(<ConfigContent />);

    const field = screen.getByLabelText("Instagram");
    await user.clear(field);
    await user.type(field, "https://www.instagram.com/editado/");
    release();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /salvar redes sociais/i })).not.toBeDisabled();
    });
    expect(field).toHaveValue("https://www.instagram.com/editado/");
  });

  it("shows only masked integration metadata", async () => {
    render(<ConfigContent />);

    expect(await screen.findByText("ID de medição do GA4")).toBeInTheDocument();
    expect(screen.getByText(/termina em 1234/i)).toBeInTheDocument();
    expect(screen.queryByText("GA4_MEASUREMENT_ID")).not.toBeInTheDocument();
  });
});
