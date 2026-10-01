import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "../../../../test/msw/server";
import { customizationResponse } from "../../../../test/msw/handlers/vendor-product-customization";
import { VendorProductDescriptionModal } from "./vendor-product-description-modal";

const ENDPOINT = "*/api/vendor/products/:productId/customization";

function modal(productId = 123) {
  const onClose = vi.fn();
  const onUpdated = vi.fn();
  const view = render(
    <VendorProductDescriptionModal productId={productId} productName="Seda" onClose={onClose} onUpdated={onUpdated} />,
  );
  return { ...view, onClose, onUpdated };
}

describe("VendorProductDescriptionModal", () => {
  it("conta caracteres Unicode do texto, aceita o limite e bloqueia excesso sem truncar", async () => {
    modal();
    const editor = await screen.findByLabelText("Sua descrição");
    fireEvent.change(editor, { target: { value: "😀".repeat(20000) } });
    expect(screen.getByText("20.000 / 20.000 caracteres")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar descrição" })).toBeEnabled();
    fireEvent.change(editor, { target: { value: "😀".repeat(20001) } });
    expect(editor).toHaveValue("😀".repeat(20001));
    expect(screen.getByRole("button", { name: "Salvar descrição" })).toBeDisabled();
    expect(screen.getByText(/Limite excedido/)).toBeInTheDocument();
  });
  it("preserva especificações fora dos parágrafos na referência e no editor", async () => {
    const canonical = "<p>Intro</p><ul><li>Specification</li></ul><p>Fim</p>";
    server.use(http.get(ENDPOINT, () => HttpResponse.json({
      ...customizationResponse(), canonical_description: canonical, effective_description: canonical,
    })));
    modal();
    expect(await screen.findByLabelText("Sua descrição")).toHaveValue("Intro\n\nSpecification\n\nFim");
    expect(screen.getByText("Intro Specification Fim", { selector: "p" })).toBeInTheDocument();
  });

  it("preserva texto permitido fora de p e quebras simples depois de salvar", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json(customizationResponse(123, "Before<p>Paragraph</p>After"))));
    const { onUpdated } = modal();
    const editor = await screen.findByLabelText("Sua descrição");
    expect(editor).toHaveValue("Before\n\nParagraph\n\nAfter");
    fireEvent.change(editor, { target: { value: "Line one\nLine two\n\nOutro parágrafo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar descrição" }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledOnce());
    expect(editor).toHaveValue("Line one\nLine two\n\nOutro parágrafo");
  });

  it("abrir e cancelar não cria cópia; texto igual exige intenção explícita", async () => {
    const put = vi.fn();
    server.use(http.put(ENDPOINT, () => { put(); return HttpResponse.json(customizationResponse()); }));
    const { onClose } = modal();
    expect(await screen.findByLabelText("Sua descrição")).toHaveValue("Descrição Papelito.");
    expect(screen.getByRole("button", { name: "Salvar descrição" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(put).not.toHaveBeenCalled();
  });

  it("permite criar override igual ao canônico deliberadamente", async () => {
    const { onUpdated } = modal();
    await screen.findByLabelText("Sua descrição");
    fireEvent.click(screen.getByLabelText(/personalizar mesmo mantendo/i));
    fireEvent.click(screen.getByRole("button", { name: "Salvar descrição" }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({
      productId: 123, descriptionSource: "vendor", vendorDescription: "<p>Descrição Papelito.</p>",
    })));
  });

  it("salva parágrafos escapados e aplica resposta sanitizada", async () => {
    let received: unknown;
    server.use(http.put(ENDPOINT, async ({ request }) => {
      received = await request.json();
      return HttpResponse.json(customizationResponse(123, "<p>Resposta sanitizada.</p>"));
    }));
    const { onUpdated } = modal();
    const editor = await screen.findByLabelText("Sua descrição");
    fireEvent.change(editor, { target: { value: "Texto & seguro\n\nOutro parágrafo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar descrição" }));
    await waitFor(() => expect(editor).toHaveValue("Resposta sanitizada."));
    expect(screen.getByText("Descrição salva.")).toBeInTheDocument();
    expect(received).toEqual({ description: "<p>Texto &amp; seguro</p>\n<p>Outro parágrafo</p>" });
    expect(onUpdated).toHaveBeenCalledOnce();
  });

  it("restaura via DELETE e aplica canônico atual", async () => {
    server.use(
      http.get(ENDPOINT, () => HttpResponse.json(customizationResponse(123, "<p>Personalizada.</p>"))),
      http.delete(ENDPOINT, () => HttpResponse.json({
        ...customizationResponse(), canonical_description: "<p>Canônico V2.</p>", effective_description: "<p>Canônico V2.</p>",
      })),
    );
    const { onUpdated } = modal();
    fireEvent.click(await screen.findByRole("button", { name: "Restaurar descrição da Papelito" }));
    await waitFor(() => expect(screen.getByLabelText("Sua descrição")).toHaveValue("Canônico V2."));
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ vendorDescription: null, descriptionSource: "papelito" }));
    expect(screen.queryByRole("button", { name: "Restaurar descrição da Papelito" })).not.toBeInTheDocument();
  });

  it("erro preserva rascunho e impede duplo envio e fechamento em voo", async () => {
    const put = vi.fn();
    server.use(http.put(ENDPOINT, async () => {
      put();
      await delay(60);
      return HttpResponse.json({ message: "Falha ao gravar." }, { status: 500 });
    }));
    const { onClose } = modal();
    const editor = await screen.findByLabelText("Sua descrição");
    fireEvent.change(editor, { target: { value: "Meu rascunho" } });
    const save = screen.getByRole("button", { name: "Salvar descrição" });
    fireEvent.click(save);
    fireEvent.click(save);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao gravar.");
    expect(editor).toHaveValue("Meu rascunho");
    expect(put).toHaveBeenCalledOnce();
  });

  it("produto anterior não sobrescreve outro produto", async () => {
    server.use(http.get(ENDPOINT, async ({ params }) => {
      if (params.productId === "123") await delay(80);
      return HttpResponse.json(customizationResponse(Number(params.productId), "<p>Produto " + params.productId + "</p>"));
    }));
    const { rerender, onClose, onUpdated } = modal();
    rerender(<VendorProductDescriptionModal productId={456} productName="Kit" onClose={onClose} onUpdated={onUpdated} />);
    await waitFor(() => expect(screen.getByLabelText("Sua descrição")).toHaveValue("Produto 456"));
    await delay(100);
    expect(screen.getByLabelText("Sua descrição")).toHaveValue("Produto 456");
  });

  it("seller suspenso lê referência, mas não pode salvar/restaurar", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ ...customizationResponse(123, "Existente"), can_edit: false })));
    modal();
    expect(await screen.findByLabelText("Sua descrição")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Restaurar descrição da Papelito" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Salvar descrição" })).toBeDisabled();
  });
});
