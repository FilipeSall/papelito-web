import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "../../../../test/msw/server";
import { customizationResponse } from "../../../../test/msw/handlers/vendor-product-customization";
import { VendorProductDescriptionModal } from "./vendor-product-description-modal";

const ENDPOINT = "*/api/vendor/products/:productId/customization";
const FIELD_LABEL = "Descrição personalizada";
const RESTORE_LABEL = "Restaurar original";
const SWITCH_LABEL = "Mostrar a descrição personalizada na loja";

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
    const editor = await screen.findByLabelText(FIELD_LABEL);
    fireEvent.change(editor, { target: { value: "😀".repeat(20000) } });
    expect(screen.getByText("20.000 / 20.000 caracteres")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar descrição" })).toBeEnabled();
    fireEvent.change(editor, { target: { value: "😀".repeat(20001) } });
    expect(editor).toHaveValue("😀".repeat(20001));
    expect(screen.getByRole("button", { name: "Salvar descrição" })).toBeDisabled();
    expect(screen.getByText(/limite excedido/)).toBeInTheDocument();
    expect(editor).toHaveAttribute("aria-invalid", "true");
  });
  it("preserva especificações fora dos parágrafos na referência e no editor", async () => {
    const canonical = "<p>Intro</p><ul><li>Specification</li></ul><p>Fim</p>";
    server.use(http.get(ENDPOINT, () => HttpResponse.json({
      ...customizationResponse(), canonical_description: canonical, effective_description: canonical,
    })));
    modal();
    expect(await screen.findByLabelText(FIELD_LABEL)).toHaveValue("Intro\n\nSpecification\n\nFim");
    expect(screen.getByText("Intro Specification Fim", { selector: "p" })).toBeInTheDocument();
  });

  it("copia a descrição da Papelito e avisa abaixo da referência", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    modal();
    await screen.findByLabelText(FIELD_LABEL);
    fireEvent.click(screen.getByRole("button", { name: /Ver original/ }));
    fireEvent.click(screen.getByRole("button", { name: "Copiar descrição da Papelito" }));
    await waitFor(() => expect(screen.getByText("Texto copiado")).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith("Descrição Papelito.");
  });

  it("preserva texto permitido fora de p e quebras simples depois de salvar", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json(customizationResponse(123, "Before<p>Paragraph</p>After"))));
    const { onUpdated } = modal();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    expect(editor).toHaveValue("Before\n\nParagraph\n\nAfter");
    fireEvent.change(editor, { target: { value: "Line one\nLine two\n\nOutro parágrafo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar descrição" }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledOnce());
    expect(editor).toHaveValue("Line one\nLine two\n\nOutro parágrafo");
  });

  it("mostra o loading padrão antes do formulário e foca o campo ao carregar", async () => {
    server.use(http.get(ENDPOINT, async () => {
      await delay(30);
      return HttpResponse.json(customizationResponse());
    }));
    modal();
    expect(screen.getByRole("status")).toHaveTextContent("Carregando descrição");
    expect(screen.queryByLabelText(FIELD_LABEL)).not.toBeInTheDocument();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    expect(editor).toHaveFocus();
    expect(screen.getByRole("switch", { name: SWITCH_LABEL })).not.toBeChecked();
  });

  it("abrir e cancelar não cria cópia; texto igual ao da Papelito não habilita salvar", async () => {
    const put = vi.fn();
    server.use(http.put(ENDPOINT, () => { put(); return HttpResponse.json(customizationResponse()); }));
    const { onClose } = modal();
    expect(await screen.findByLabelText(FIELD_LABEL)).toHaveValue("Descrição Papelito.");
    expect(screen.getByRole("button", { name: "Salvar descrição" })).toBeDisabled();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: RESTORE_LABEL })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(put).not.toHaveBeenCalled();
  });

  it("voltar ao texto original desabilita salvar de novo", async () => {
    modal();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    fireEvent.change(editor, { target: { value: "Outro texto" } });
    expect(screen.getByRole("button", { name: "Salvar descrição" })).toBeEnabled();
    fireEvent.change(editor, { target: { value: "Descrição Papelito." } });
    expect(screen.getByRole("button", { name: "Salvar descrição" })).toBeDisabled();
  });

  it("a primeira edição liga a personalizada e desfazer desliga", async () => {
    modal();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    fireEvent.change(editor, { target: { value: "Minha versão" } });
    expect(screen.getByRole("switch", { name: SWITCH_LABEL })).toBeChecked();
    fireEvent.change(editor, { target: { value: "Descrição Papelito." } });
    expect(screen.getByRole("switch", { name: SWITCH_LABEL })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Salvar descrição" })).toBeDisabled();
  });

  it("ligar a personalizada sem mudar o texto habilita salvar", async () => {
    let received: unknown;
    server.use(http.put(ENDPOINT, async ({ request }) => {
      received = await request.json();
      return HttpResponse.json(customizationResponse(123, "<p>Descrição Papelito.</p>"));
    }));
    const { onUpdated } = modal();
    await screen.findByLabelText(FIELD_LABEL);
    fireEvent.click(screen.getByRole("switch", { name: SWITCH_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar descrição" }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledOnce());
    expect(received).toEqual({ description: "<p>Descrição Papelito.</p>", use_vendor_description: true });
  });

  it("desligar a personalizada guarda o texto", async () => {
    let received: unknown;
    server.use(
      http.get(ENDPOINT, () => HttpResponse.json(customizationResponse(123, "<p>Minha versão.</p>"))),
      http.put(ENDPOINT, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(customizationResponse(123, "<p>Minha versão.</p>", false));
      }),
    );
    const { onUpdated } = modal();
    expect(await screen.findByLabelText(FIELD_LABEL)).toHaveValue("Minha versão.");
    expect(screen.getByRole("button", { name: "Salvar descrição" })).toBeDisabled();
    fireEvent.click(screen.getByRole("switch", { name: SWITCH_LABEL }));
    expect(screen.getByText(/Este texto fica guardado/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Salvar descrição" }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({
      descriptionSource: "papelito", vendorDescription: "<p>Minha versão.</p>", vendorDescriptionEnabled: false,
    })));
    expect(received).toEqual({ description: "<p>Minha versão.</p>", use_vendor_description: false });
  });

  it("Cancelar e Esc fecham na hora, mesmo com alterações", async () => {
    const put = vi.fn();
    server.use(http.put(ENDPOINT, () => { put(); return HttpResponse.json(customizationResponse()); }));
    const { onClose } = modal();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    fireEvent.change(editor, { target: { value: "Rascunho" } });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/Descartar/)).not.toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
  });

  it("salva parágrafos escapados e aplica resposta sanitizada", async () => {
    let received: unknown;
    server.use(http.put(ENDPOINT, async ({ request }) => {
      received = await request.json();
      return HttpResponse.json(customizationResponse(123, "<p>Resposta sanitizada.</p>"));
    }));
    const { onUpdated } = modal();
    const editor = await screen.findByLabelText(FIELD_LABEL);
    fireEvent.change(editor, { target: { value: "Texto & seguro\n\nOutro parágrafo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar descrição" }));
    await waitFor(() => expect(editor).toHaveValue("Resposta sanitizada."));
    expect(received).toEqual({ description: "<p>Texto &amp; seguro</p>\n<p>Outro parágrafo</p>", use_vendor_description: true });
    expect(onUpdated).toHaveBeenCalledOnce();
  });

  it("com texto guardado não oferece mais restaurar o original", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json(customizationResponse(123, "<p>Personalizada.</p>"))));
    modal();
    expect(await screen.findByLabelText(FIELD_LABEL)).toHaveValue("Personalizada.");
    expect(screen.queryByRole("button", { name: RESTORE_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Confirmar restauração/ })).not.toBeInTheDocument();
  });

  it("erro preserva rascunho e impede duplo envio e fechamento em voo", async () => {
    const put = vi.fn();
    server.use(http.put(ENDPOINT, async () => {
      put();
      await delay(60);
      return HttpResponse.json({ message: "Falha ao gravar." }, { status: 500 });
    }));
    const { onClose } = modal();
    const editor = await screen.findByLabelText(FIELD_LABEL);
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
    await waitFor(() => expect(screen.getByLabelText(FIELD_LABEL)).toHaveValue("Produto 456"));
    await delay(100);
    expect(screen.getByLabelText(FIELD_LABEL)).toHaveValue("Produto 456");
  });

  it("seller suspenso lê referência, mas não pode salvar", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ ...customizationResponse(123, "Existente"), can_edit: false })));
    modal();
    expect(await screen.findByLabelText(FIELD_LABEL)).toBeDisabled();
    expect(screen.getByText("Sua conta não pode alterar descrições no momento.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: RESTORE_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar descrição" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Fechar" })).toHaveLength(2);
  });
});
