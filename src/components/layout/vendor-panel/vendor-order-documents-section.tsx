"use client";

import { useRouter } from "next/navigation";
import { Download, Eye, EyeOff, FileText, FileUp, History, Info, Lock, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { FOCUS_RING, StatusChip } from "@/components/layout/operational-panel";
import { ConfirmModal } from "@/components/ui";
import {
  deleteVendorFiscalDocument,
  uploadVendorFiscalFile,
  VendorFiscalError,
} from "@/features/vendor-orders/services/vendor-fiscal-client";
import { parseUtcDate } from "@/features/vendor-orders/utils/order-dates";
import type { VendorOrderFiscal, VendorOrderReceipt } from "@/features/vendor-orders/types/vendor-orders";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";
import {
  FISCAL_ATTACHED_SHAPE,
  FISCAL_PENDING_SHAPE,
  fiscalActorLabel,
  fiscalBlockMessage,
  fiscalEventLabel,
} from "./order-status";

const FILE_ACCEPT = ".pdf,.xml,application/pdf,application/xml,text/xml";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatStamp(value: string): string {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) return value;

  const date = parseUtcDate(value);
  return date ? dateTimeFormatter.format(date) : value;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function megabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/** O PDF abre no visualizador; o XML só faz sentido baixado. */
function isPdf(mime: string): boolean {
  return mime.includes("pdf");
}

const darkActionClassName = [
  "inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-brand-yellow bg-transparent px-4 text-[10px] font-black uppercase tracking-[0.14em] text-brand-yellow transition hover:bg-brand-yellow hover:text-[#1a1a1a]",
  FOCUS_RING,
].join(" ");

const actionClassName = [
  "inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

const dangerActionClassName = [
  "inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#c0392b] bg-white px-4 text-[10px] font-black uppercase tracking-[0.14em] text-[#c0392b] transition hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

const primaryClassName = [
  "inline-flex h-11 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
  FOCUS_RING,
].join(" ");

function DocumentBlock({
  children,
  title,
  trailing,
}: {
  children: React.ReactNode;
  title: string;
  trailing: React.ReactNode;
}) {
  return (
    <section className="border-2 border-[#1a1a1a]/15 bg-white">
      <div className="flex flex-col gap-2 border-b-2 border-[#1a1a1a]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
          {title}
        </h3>
        {trailing}
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

/**
 * Documentos do pedido, na visão do vendor: o recibo da Papelito e a nota
 * fiscal que o vendor anexa.
 *
 * A nota é **só o arquivo**. A Papelito não emite nota, não lê o conteúdo do
 * documento e não guarda chave de acesso, número, série, emissão nem valor —
 * por isso não há formulário aqui, só anexar, trocar e remover.
 */
export function VendorOrderDocumentsSection({
  initialFiscal,
  orderId,
  receipt,
}: {
  initialFiscal: VendorOrderFiscal;
  orderId: number;
  receipt: VendorOrderReceipt;
}) {
  const router = useRouter();
  const [fiscal, setFiscal] = useState(initialFiscal);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  // Nenhum dos dois frames carrega sozinho. Gerar o PDF do recibo é uma
  // requisição que **emite** o recibo quando ele ainda não existe, então montar
  // o frame junto com a página faria abrir o detalhe criar um documento
  // numerado do comprador sem o vendor pedir nada. `mounted` guarda "já foi
  // carregado alguma vez": depois do primeiro load o frame nunca é desmontado,
  // então fechar e reabrir não custa request nenhuma.
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptMounted, setReceiptMounted] = useState(false);
  const [receiptLoaded, setReceiptLoaded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteMounted, setNoteMounted] = useState(false);
  const [noteLoaded, setNoteLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const current = fiscal.document;
  const fiscalShape = current ? FISCAL_ATTACHED_SHAPE : FISCAL_PENDING_SHAPE;

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function reportError(error: unknown) {
    const message =
      error instanceof VendorFiscalError
        ? error.message
        : "Não foi possível falar com o servidor. Verifique a conexão e tente de novo.";

    setFeedback({
      error: true,
      hint:
        error instanceof VendorFiscalError && error.status === 409
          ? "Recarregue a página: a situação do pedido mudou."
          : undefined,
      message: `⚠ ${message}`,
    });
  }

  /**
   * O backend recusa de novo por MIME e conteúdo; aqui é só para o vendor não
   * esperar um upload de 10 MB para descobrir que o arquivo não serve.
   */
  function rejectFile(candidate: File): string {
    const extension = candidate.name.toLowerCase().split(".").pop() ?? "";

    if (extension !== "pdf" && extension !== "xml") {
      return "Envie a nota em PDF ou XML.";
    }

    const limit = extension === "xml" ? fiscal.limits.xml : fiscal.limits.pdf;

    if (candidate.size > limit) {
      return `O arquivo excede o limite de ${megabytes(limit)} para ${extension.toUpperCase()}.`;
    }

    return "";
  }

  async function send(candidate: File) {
    setBusy(true);
    setFeedback(null);

    try {
      const next = await uploadVendorFiscalFile({ file: candidate, orderId });

      setFiscal(next);
      setFeedback({
        error: false,
        message: current ? "✓ Nota fiscal substituída." : "✓ Nota fiscal anexada ao pedido.",
      });
      clearFile();
      // O arquivo trocou de id: o frame precisa recarregar em vez de mostrar o anterior.
      setNoteOpen(false);
      setNoteMounted(false);
      setNoteLoaded(false);
      router.refresh();
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  }

  function handleAttach() {
    if (busy || !file) return;

    const problem = rejectFile(file);

    if (problem !== "") {
      setFeedback({ error: true, message: `⚠ ${problem}` });
      return;
    }

    if (current) {
      setConfirmReplace(true);
      return;
    }

    void send(file);
  }

  function confirmReplaceNow() {
    setConfirmReplace(false);
    if (file) void send(file);
  }

  async function handleRemove() {
    setConfirmRemove(false);
    setBusy(true);
    setFeedback(null);

    try {
      const next = await deleteVendorFiscalDocument(orderId);

      setFiscal(next);
      setFeedback({ error: false, message: "✓ Nota fiscal removida do pedido." });
      clearFile();
      setNoteOpen(false);
      setNoteMounted(false);
      setNoteLoaded(false);
      router.refresh();
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <h2 className="border-b-2 border-[#1a1a1a] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55">
        Documentos do pedido
      </h2>

      <div className="space-y-4 px-5 py-5 md:px-6">
        {/*
          O recibo é o documento principal da página, então sai do formato de
          bloco igual aos outros: ganha a chapa escura, o número em tamanho de
          identificação e as ações à direita. A nota fiscal continua um bloco
          normal — a diferença de peso é o que separa "o documento do pedido"
          de "um anexo opcional".
        */}
        <section className="border-2 border-[#1a1a1a] bg-white">
          <div className="flex flex-col gap-4 border-b-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="inline-flex size-12 shrink-0 items-center justify-center border-2 border-brand-yellow bg-brand-yellow text-[#1a1a1a]">
                <FileText aria-hidden className="size-6" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-yellow">
                  Recibo do pedido
                </p>
                {receipt.available ? (
                  <p className="mt-1 truncate font-mono text-lg font-bold tracking-wide text-white">
                    {receipt.number || "Gerado no download"}
                  </p>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-white/72">
                    Emitido na confirmação do pagamento
                  </p>
                )}
                {receipt.available && formatStamp(receipt.issuedAt) ? (
                  <p className="mt-0.5 text-xs tabular-nums text-white/60">
                    Emitido em {formatStamp(receipt.issuedAt)}
                  </p>
                ) : null}
              </div>
            </div>

            {receipt.available ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  aria-expanded={receiptOpen}
                  className={darkActionClassName}
                  onClick={() => {
                    setReceiptMounted(true);
                    setReceiptOpen(!receiptOpen);
                  }}
                  type="button"
                >
                  {receiptOpen ? (
                    <EyeOff aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                  ) : (
                    <Eye aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                  )}
                  {receiptOpen ? "Fechar" : "Visualizar"}
                </button>
                <a
                  className={darkActionClassName}
                  href={`/api/vendor/orders/${orderId}/receipt?download=1`}
                >
                  <Download aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Baixar PDF
                </a>
              </div>
            ) : (
              <span className="shrink-0">
                <StatusChip icon={Lock} label="Após o pagamento" tone="pending" />
              </span>
            )}
          </div>

          {receipt.available ? (
            <div className="px-5 py-5">
              <div hidden={!receiptOpen || !receiptMounted}>
                {receiptLoaded ? null : (
                  <div
                    aria-live="polite"
                    className="flex h-40 items-center justify-center border-2 border-[#1a1a1a]/15 bg-[#faf8f2]"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/55">
                      Carregando recibo…
                    </p>
                  </div>
                )}
                {receiptMounted ? (
                  <iframe
                    className={`h-[70vh] min-h-96 w-full border-2 border-[#1a1a1a] bg-white ${receiptLoaded ? "" : "hidden"}`}
                    onLoad={() => setReceiptLoaded(true)}
                    src={`/api/vendor/orders/${orderId}/receipt`}
                    title="Recibo do pedido"
                  />
                ) : null}
              </div>

              <p className="mt-3 text-xs leading-5 text-[#231f20]/62">
                Documento da Papelito, com os valores congelados no pagamento. É o mesmo que o
                comprador recebe e não muda quando você anexa ou troca a nota fiscal.
              </p>
            </div>
          ) : null}
        </section>

        {fiscal.enabled ? (
          <DocumentBlock
            title="Nota fiscal"
            trailing={
              <StatusChip icon={fiscalShape.icon} label={fiscalShape.label} tone={fiscalShape.tone} />
            }
          >
            <FeedbackBanner className="mb-4" feedback={feedback} />

            {/*
              A fila "pagos sem nota fiscal" e o chip "sem nota fiscal" fazem a
              ausência parecer pendência. Ela não é: nada no pedido depende da
              nota, e o vendor precisa saber disso sem ter que perguntar.
            */}
            <p className="mb-4 flex items-start gap-2 text-xs leading-5 text-[#231f20]/62">
              <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
              <span>
                A nota fiscal é emitida por você, por fora da Papelito, e não é obrigatória para o
                pedido andar — pagamento, separação, postagem e entrega não dependem dela.
              </span>
            </p>

            {!fiscal.canAttach && !current ? (
              <p className="flex items-start gap-2 text-sm leading-6 text-[#231f20]/74">
                <Lock aria-hidden className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
                {fiscalBlockMessage(fiscal.blockReason) || "Este pedido ainda não aceita nota fiscal."}
              </p>
            ) : null}

            {current ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-[#1a1a1a]/15 bg-[#faf8f2] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#1a1a1a]">
                      <FileText aria-hidden className="size-4" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#1a1a1a]">
                        {current.originalName || "Nota fiscal"}
                      </p>
                      <p className="mt-0.5 text-xs tabular-nums text-[#231f20]/62">
                        {formatSize(current.sizeBytes)} · anexada em {formatStamp(current.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {isPdf(current.mime) ? (
                      <button
                        aria-expanded={noteOpen}
                        className={actionClassName}
                        onClick={() => {
                          setNoteMounted(true);
                          setNoteOpen(!noteOpen);
                        }}
                        type="button"
                      >
                        {noteOpen ? (
                          <EyeOff aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                        ) : (
                          <Eye aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                        )}
                        {noteOpen ? "Fechar" : "Visualizar"}
                      </button>
                    ) : null}
                    <a
                      className={actionClassName}
                      href={`/api/vendor/orders/${orderId}/fiscal-document/file`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Download aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                      Baixar
                    </a>
                    {fiscal.canAttach ? (
                      <button
                        className={dangerActionClassName}
                        disabled={busy}
                        onClick={() => setConfirmRemove(true)}
                        type="button"
                      >
                        <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                        Remover
                      </button>
                    ) : null}
                  </div>
                </div>

                {/*
                  `key` no id do documento: substituir a nota gera outro id, e é
                  isso — e só isso — que força o frame a recarregar. Abrir e
                  fechar não recarrega nada.
                */}
                {noteMounted && isPdf(current.mime) ? (
                  <div hidden={!noteOpen} key={current.id}>
                    {noteLoaded ? null : (
                      <div
                        aria-live="polite"
                        className="flex h-40 items-center justify-center border-2 border-[#1a1a1a] bg-white"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/55">
                          Carregando nota fiscal…
                        </p>
                      </div>
                    )}
                    <iframe
                      className={`h-[70vh] min-h-96 w-full border-2 border-[#1a1a1a] bg-white ${noteLoaded ? "" : "hidden"}`}
                      onLoad={() => setNoteLoaded(true)}
                      src={`/api/vendor/orders/${orderId}/fiscal-document/file`}
                      title="Nota fiscal do pedido"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {fiscal.events.length > 0 ? (
              <div className="mt-4 border-2 border-[#1a1a1a]/15 bg-white">
                <button
                  aria-controls="fiscal-history"
                  aria-expanded={historyOpen}
                  className={[
                    "flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#faf8f2]",
                    FOCUS_RING,
                  ].join(" ")}
                  onClick={() => setHistoryOpen(!historyOpen)}
                  type="button"
                >
                  <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
                    <History aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                    Histórico da nota
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/55">
                    {fiscal.events.length === 1 ? "1 registro" : `${fiscal.events.length} registros`}
                  </span>
                </button>

                <ol
                  className="border-t-2 border-[#1a1a1a]/10 px-4 py-3"
                  hidden={!historyOpen}
                  id="fiscal-history"
                >
                  {fiscal.events.map((entry) => {
                    const actor = fiscalActorLabel(entry.actorRole);

                    return (
                      <li
                        className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1.5 text-sm leading-6 text-[#231f20]/74"
                        key={entry.id}
                      >
                        <span className="font-semibold text-[#1a1a1a]">
                          {fiscalEventLabel(entry.event)}
                        </span>
                        {entry.originalName ? (
                          <span className="truncate text-xs text-[#231f20]/62">
                            · {entry.originalName}
                          </span>
                        ) : null}
                        <span className="text-xs tabular-nums text-[#231f20]/62">
                          · {formatStamp(entry.createdAt)}
                        </span>
                        {actor ? <span className="text-xs text-[#231f20]/62">· {actor}</span> : null}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : null}

            {fiscal.canAttach ? (
              <div className="mt-4 space-y-3 border-t-2 border-[#1a1a1a]/10 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
                  {current ? "Substituir nota fiscal" : "Anexar nota fiscal"}
                </p>

                <div className="min-w-0">
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]" htmlFor="fiscal-file">
                    Arquivo
                  </label>
                  <div className="mt-2">
                    <input
                      accept={FILE_ACCEPT}
                      className={[
                        "w-full cursor-pointer border-2 border-dashed border-[#1a1a1a] bg-white px-3 py-2.5 text-sm text-[#1a1a1a] file:mr-3 file:cursor-pointer file:border-2 file:border-[#1a1a1a] file:bg-[#1a1a1a] file:px-3 file:py-1.5 file:text-[10px] file:font-black file:uppercase file:tracking-[0.14em] file:text-brand-yellow",
                        FOCUS_RING,
                      ].join(" ")}
                      id="fiscal-file"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      ref={fileInputRef}
                      type="file"
                    />
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-[#231f20]/62">
                    XML de até {megabytes(fiscal.limits.xml)} ou PDF de até{" "}
                    {megabytes(fiscal.limits.pdf)}. O arquivo é guardado como está — a Papelito não
                    lê o conteúdo da nota.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className={primaryClassName}
                    disabled={busy || !file}
                    onClick={handleAttach}
                    type="button"
                  >
                    <FileUp aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                    {busy ? "Enviando…" : current ? "Substituir nota" : "Anexar nota"}
                  </button>
                  {file ? (
                    <button
                      className={actionClassName}
                      disabled={busy}
                      onClick={clearFile}
                      type="button"
                    >
                      Limpar seleção
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </DocumentBlock>
        ) : null}
      </div>

      <ConfirmModal
        confirmLabel="Substituir e apagar"
        description={`A nota "${current?.originalName ?? ""}" será apagada e não poderá ser recuperada. O pedido guarda uma nota só. O recibo não é afetado.`}
        isSubmitting={busy}
        onClose={() => setConfirmReplace(false)}
        onConfirm={confirmReplaceNow}
        open={confirmReplace}
        title="Substituir a nota fiscal?"
        tone="danger"
      />

      <ConfirmModal
        confirmLabel="Remover e apagar"
        description={`A nota "${current?.originalName ?? ""}" será apagada e não poderá ser recuperada. O pedido fica sem nota fiscal até você anexar outra.`}
        isSubmitting={busy}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => void handleRemove()}
        open={confirmRemove}
        title="Remover a nota fiscal?"
        tone="danger"
      />
    </section>
  );
}
