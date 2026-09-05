"use client";

import { useRouter } from "next/navigation";
import { Download, Eye, EyeOff, FileText, FileUp, History, Lock, TriangleAlert } from "lucide-react";
import { useRef, useState, type SubmitEvent } from "react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import { FOCUS_RING, StatusChip } from "@/components/layout/operational-panel";
import {
  saveVendorFiscalDeclared,
  uploadVendorFiscalFile,
  VendorFiscalError,
  type VendorFiscalDeclared,
} from "@/features/vendor-orders/services/vendor-fiscal-client";
import { parseFiscalAmountToCents } from "@/features/vendor-orders/utils/fiscal-amount";
import { parseUtcDate } from "@/features/vendor-orders/utils/order-dates";
import type {
  VendorFiscalRole,
  VendorOrderFiscal,
  VendorOrderReceipt,
} from "@/features/vendor-orders/types/vendor-orders";
import { formatBRLIntl } from "@/lib/format-currency";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";
import {
  FISCAL_PENDING_SHAPE,
  fiscalActorLabel,
  fiscalBlockMessage,
  fiscalEventLabel,
  fiscalFlagLabel,
  fiscalRoleLabel,
  fiscalStatusShape,
  fiscalValidationLabel,
} from "./order-status";

const ROLE_ACCEPT: Record<"danfe_pdf" | "xml", string> = {
  danfe_pdf: ".pdf,application/pdf",
  xml: ".xml,application/xml,text/xml",
};

const ACCESS_KEY_DIGITS = 44;

const ROLE_OPTIONS = [
  { label: "XML da NF-e", value: "xml" },
  { label: "DANFE em PDF", value: "danfe_pdf" },
];

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

/**
 * O recibo chega já formatado pelo WordPress; as datas do documento fiscal e do
 * histórico chegam cruas, em UTC (`current_time( 'mysql', true )`).
 */
function formatStamp(value: string): string {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) return value;

  const date = parseUtcDate(value);
  return date ? dateTimeFormatter.format(date) : value;
}

function formatKey(key: string): string {
  return key ? (key.match(/.{1,4}/g) ?? [key]).join(" ") : "";
}

function formatCnpj(digits: string): string {
  return digits.length === 14
    ? digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    : digits;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function megabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

const darkActionClassName = [
  "inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-brand-yellow bg-transparent px-4 text-[10px] font-black uppercase tracking-[0.14em] text-brand-yellow transition hover:bg-brand-yellow hover:text-[#1a1a1a]",
  FOCUS_RING,
].join(" ");

const actionClassName = [
  "inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] transition hover:bg-brand-yellow",
  FOCUS_RING,
].join(" ");

const primaryClassName = [
  "inline-flex h-11 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
  FOCUS_RING,
].join(" ");

const fieldClassName = [
  "h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
  FOCUS_RING,
].join(" ");

const labelClassName = "block text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]";

function Field({
  children,
  hint,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  hint?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="min-w-0">
      <label className={labelClassName} htmlFor={htmlFor}>
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1.5 text-xs leading-5 text-[#231f20]/62">{hint}</p> : null}
    </div>
  );
}

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
 * Documentos do pedido: recibo e nota fiscal, separados de propósito.
 *
 * São coisas diferentes e com donos diferentes. O **recibo** é da Papelito,
 * nasce do pagamento e é permanente: nenhuma operação de nota o altera. A
 * **nota fiscal** é do vendor, é opcional e é substituível — o pedido tem no
 * máximo uma, sem versões guardadas.
 */
export function VendorOrderDocumentsSection({
  initialFiscal,
  orderId,
  orderTotal,
  receipt,
}: {
  initialFiscal: VendorOrderFiscal;
  orderId: number;
  orderTotal: number;
  receipt: VendorOrderReceipt;
}) {
  const router = useRouter();
  const [fiscal, setFiscal] = useState(initialFiscal);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [busy, setBusy] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);
  const [role, setRole] = useState<VendorFiscalRole>("xml");
  const [file, setFile] = useState<File | null>(null);
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
  const [danfeOpen, setDanfeOpen] = useState(false);
  const [danfeMounted, setDanfeMounted] = useState(false);
  const [danfeLoaded, setDanfeLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const current = fiscal.document;
  const danfe = current?.files.find((entry) => entry.role === "danfe_pdf") ?? null;
  // Substituir é outra nota. Herdar chave, número e valor da anterior gravava a
  // identificação da nota velha em cima do arquivo da nova — o digitado tem
  // precedência sobre o XML —, e era essa chave que chegava ao comprador.
  // Completar/corrigir, ao contrário, parte do que já está lá.
  const prefill = replaceMode ? null : current;
  const maxBytes = role === "xml" ? fiscal.limits.xml : fiscal.limits.danfe_pdf;

  function resetForm() {
    setFile(null);
    setIsFormOpen(false);
    setReplaceMode(false);
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

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const formData = new FormData(event.currentTarget);
    const accessKey = String(formData.get("accessKey") ?? "").replace(/\D/g, "");

    // Campo vazio viaja como string vazia, e não ausente: ausente é "não
    // informei", e o backend preserva o que já estava gravado. Sem distinguir
    // os dois, um dado digitado errado não tinha como ser apagado.
    const declared: VendorFiscalDeclared = {
      accessKey,
      docNumber: String(formData.get("docNumber") ?? "").trim(),
      docSeries: String(formData.get("docSeries") ?? "").trim(),
      issuedAt: String(formData.get("issuedAt") ?? "").trim(),
      totalCents: parseFiscalAmountToCents(String(formData.get("total") ?? "")) ?? 0,
    };

    if (!file && !accessKey && !current) {
      setFeedback({
        error: true,
        message: "⚠ Anexe o XML ou o DANFE, ou informe a chave de acesso da nota.",
      });
      return;
    }

    // 44 dígitos exatos: o backend corta no 44º, então uma chave colada com
    // sobra era truncada em silêncio e gravada errada.
    if (accessKey !== "" && accessKey.length !== ACCESS_KEY_DIGITS) {
      setFeedback({
        error: true,
        message: `⚠ A chave de acesso tem ${ACCESS_KEY_DIGITS} dígitos; você informou ${accessKey.length}.`,
      });
      return;
    }

    // O backend recusa de novo por MIME e conteúdo; aqui é só para o vendor não
    // esperar um upload de 10 MB para descobrir que o arquivo não serve.
    if (file) {
      const extension = file.name.toLowerCase().split(".").pop() ?? "";
      const expected = role === "xml" ? "xml" : "pdf";

      if (extension !== expected) {
        setFeedback({
          error: true,
          message: `⚠ Para ${fiscalRoleLabel(role).toLowerCase()} envie um arquivo .${expected}.`,
        });
        return;
      }

      if (file.size > maxBytes) {
        setFeedback({
          error: true,
          message: `⚠ O arquivo excede o limite de ${megabytes(maxBytes)} para ${fiscalRoleLabel(role).toLowerCase()}.`,
        });
        return;
      }
    }

    setBusy(true);
    setFeedback(null);

    try {
      const next = file
        ? await uploadVendorFiscalFile({
            declared,
            file,
            mode: replaceMode ? "replace" : "attach",
            orderId,
            role,
          })
        : await saveVendorFiscalDeclared(orderId, declared);

      setFiscal(next);
      setFeedback({
        error: false,
        message: replaceMode ? "✓ Nota fiscal substituída." : "✓ Nota fiscal registrada no pedido.",
      });
      resetForm();
      router.refresh();
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  }

  const fiscalShape = current ? fiscalStatusShape(current.docStatus) : FISCAL_PENDING_SHAPE;

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

            {!fiscal.canAttach && !current ? (
              <p className="flex items-start gap-2 text-sm leading-6 text-[#231f20]/74">
                <Lock aria-hidden className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
                {fiscalBlockMessage(fiscal.blockReason) || "Este pedido ainda não aceita nota fiscal."}
              </p>
            ) : null}

            {current ? (
              <div className="space-y-4">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
                      Chave de acesso
                    </dt>
                    <dd className="mt-1.5 break-all font-mono text-xs leading-5 text-[#1a1a1a]">
                      {formatKey(current.accessKey) || "Não informada"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
                      Número e série
                    </dt>
                    <dd className="mt-1.5 font-mono text-sm text-[#1a1a1a]">
                      {current.docNumber || "—"}
                      {current.docSeries ? ` / ${current.docSeries}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
                      Emitente
                    </dt>
                    <dd className="mt-1.5 text-sm text-[#231f20]/74">
                      {current.issuerName || "Não informado"}
                      {current.issuerCnpj ? (
                        <span className="block font-mono text-xs text-[#231f20]/62">
                          {formatCnpj(current.issuerCnpj)}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
                      Valor da nota
                    </dt>
                    <dd className="mt-1.5 text-sm font-bold tabular-nums text-[#1a1a1a]">
                      {current.totalCents > 0
                        ? formatBRLIntl(current.totalCents / 100)
                        : "Não informado"}
                      <span className="mt-0.5 block text-xs font-medium text-[#231f20]/62">
                        Total do pedido: {formatBRLIntl(orderTotal)}
                      </span>
                    </dd>
                  </div>
                </dl>

                <div className="border-2 border-[#1a1a1a]/15 bg-[#faf8f2] px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
                    Conferência local · nível {current.validationLevel} de 5
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-[#231f20]/74">
                    {fiscalValidationLabel(current.validationLevel)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#231f20]/62">
                    Conferência feita aqui, sobre o arquivo e o pedido. A Papelito não consulta a
                    Receita nem valida a nota perante o fisco.
                  </p>
                </div>

                {current.flags.length > 0 ? (
                  <div className="border-2 border-[#c0392b] bg-white px-4 py-3">
                    <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#c0392b]">
                      <TriangleAlert aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                      {current.flags.length === 1
                        ? "1 divergência encontrada"
                        : `${current.flags.length} divergências encontradas`}
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#231f20]/74">
                      {current.flags.map((flag) => (
                        <li key={flag}>{fiscalFlagLabel(flag)}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs leading-5 text-[#231f20]/62">
                      Divergência é sinalização: não bloqueia pagamento, separação, postagem nem
                      entrega. Substitua a nota se o arquivo estiver errado.
                    </p>
                  </div>
                ) : null}

                {current.files.length > 0 ? (
                  <ul className="divide-y-2 divide-[#1a1a1a]/10 border-2 border-[#1a1a1a]/15">
                    {current.files.map((entry) => (
                      <li
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        key={entry.id}
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
                            {fiscalRoleLabel(entry.role)}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[#231f20]/62">
                            {entry.originalName} · {formatSize(entry.sizeBytes)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {entry.role === "danfe_pdf" ? (
                            <button
                              aria-expanded={danfeOpen}
                              className={actionClassName}
                              onClick={() => {
                                setDanfeMounted(true);
                                setDanfeOpen(!danfeOpen);
                              }}
                              type="button"
                            >
                              {danfeOpen ? (
                                <EyeOff aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                              ) : (
                                <Eye aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                              )}
                              {danfeOpen ? "Fechar" : "Visualizar"}
                            </button>
                          ) : null}
                          <a
                            className={actionClassName}
                            href={`/api/vendor/orders/${orderId}/fiscal-document/files/${entry.id}`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <Download aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                            Baixar
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {current.events.length > 0 ? (
                  <div className="border-2 border-[#1a1a1a]/15 bg-white">
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
                        {current.events.length === 1
                          ? "1 registro"
                          : `${current.events.length} registros`}
                      </span>
                    </button>

                    <ol
                      className="border-t-2 border-[#1a1a1a]/10 px-4 py-3"
                      hidden={!historyOpen}
                      id="fiscal-history"
                    >
                      {current.events.map((entry) => {
                        const actor = fiscalActorLabel(entry.actorRole);

                        return (
                          <li
                            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1.5 text-sm leading-6 text-[#231f20]/74"
                            key={entry.id}
                          >
                            <span className="font-semibold text-[#1a1a1a]">
                              {fiscalEventLabel(entry.event)}
                            </span>
                            {entry.role ? (
                              <span className="text-xs text-[#231f20]/62">
                                · {fiscalRoleLabel(entry.role)}
                              </span>
                            ) : null}
                            <span className="text-xs tabular-nums text-[#231f20]/62">
                              · {formatStamp(entry.createdAt)}
                            </span>
                            {actor ? (
                              <span className="text-xs text-[#231f20]/62">· {actor}</span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ol>

                    <p className="border-t-2 border-[#1a1a1a]/10 px-4 py-2.5 text-xs leading-5 text-[#231f20]/62">
                      O pedido guarda uma nota só: substituir troca o documento e o arquivo
                      anterior sai. O registro da troca fica aqui.
                    </p>
                  </div>
                ) : null}

                {/*
                  `key` no id do arquivo: substituir a nota gera outro id, e é
                  isso — e só isso — que força o frame a recarregar. Abrir e
                  fechar não recarrega nada.
                */}
                {danfe && danfeMounted ? (
                  <div hidden={!danfeOpen} key={danfe.id}>
                    {danfeLoaded ? null : (
                      <div
                        aria-live="polite"
                        className="flex h-40 items-center justify-center border-2 border-[#1a1a1a] bg-white"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/55">
                          Carregando DANFE…
                        </p>
                      </div>
                    )}
                    <iframe
                      className={`h-[70vh] min-h-96 w-full border-2 border-[#1a1a1a] bg-white ${danfeLoaded ? "" : "hidden"}`}
                      onLoad={() => setDanfeLoaded(true)}
                      src={`/api/vendor/orders/${orderId}/fiscal-document/files/${danfe.id}`}
                      title="DANFE da nota fiscal"
                    />
                  </div>
                ) : null}
              </div>
            ) : fiscal.canAttach && !isFormOpen ? (
              <p className="text-sm leading-6 text-[#231f20]/74">
                Você é o vendedor deste pedido, então a nota é emitida no seu sistema. Anexe aqui
                para o comprador ter acesso a ela.
              </p>
            ) : null}

            {fiscal.canAttach ? (
              <div className="mt-4 border-t-2 border-[#1a1a1a]/10 pt-4">
                {isFormOpen ? (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
                      {replaceMode
                        ? "Substituir nota fiscal"
                        : current
                          ? "Completar ou corrigir"
                          : "Anexar nota fiscal"}
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="min-w-0">
                        <CheckoutCustomSelect
                          label="Tipo de arquivo"
                          labelClassName={labelClassName}
                          onChange={(value) => setRole(value as VendorFiscalRole)}
                          options={ROLE_OPTIONS}
                          placeholder="XML da NF-e"
                          selectedValueClassName="truncate text-[#1a1a1a]"
                          triggerClassName="min-h-11 rounded-none border-2 border-[#1a1a1a] bg-white text-[#1a1a1a]"
                          value={role}
                        />
                      </div>

                      <Field
                        hint={`Formatos aceitos: XML da NF-e ou DANFE/PDF. ${role === "xml" ? "XML" : "PDF"} de até ${megabytes(maxBytes)}.`}
                        htmlFor="fiscal-file"
                        label="Arquivo"
                      >
                        <input
                          accept={ROLE_ACCEPT[role === "xml" ? "xml" : "danfe_pdf"]}
                          className={[
                            "w-full cursor-pointer border-2 border-dashed border-[#1a1a1a] bg-white px-3 py-2.5 text-sm text-[#1a1a1a] file:mr-3 file:cursor-pointer file:border-2 file:border-[#1a1a1a] file:bg-[#1a1a1a] file:px-3 file:py-1.5 file:text-[10px] file:font-black file:uppercase file:tracking-[0.14em] file:text-brand-yellow",
                            FOCUS_RING,
                          ].join(" ")}
                          id="fiscal-file"
                          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                          ref={fileInputRef}
                          type="file"
                        />
                      </Field>

                      <Field
                        hint="44 dígitos. Vem preenchida do XML quando você anexa o arquivo."
                        htmlFor="fiscal-access-key"
                        label="Chave de acesso"
                      >
                        <input
                          className={`${fieldClassName} font-mono`}
                          defaultValue={prefill?.accessKey ?? ""}
                          id="fiscal-access-key"
                          inputMode="numeric"
                          maxLength={54}
                          name="accessKey"
                          placeholder="0000 0000 0000 …"
                        />
                      </Field>

                      <div className="grid grid-cols-2 gap-4">
                        <Field htmlFor="fiscal-number" label="Número">
                          <input
                            className={fieldClassName}
                            defaultValue={prefill?.docNumber ?? ""}
                            id="fiscal-number"
                            maxLength={20}
                            name="docNumber"
                            placeholder="123"
                          />
                        </Field>
                        <Field htmlFor="fiscal-series" label="Série">
                          <input
                            className={fieldClassName}
                            defaultValue={prefill?.docSeries ?? ""}
                            id="fiscal-series"
                            maxLength={10}
                            name="docSeries"
                            placeholder="1"
                          />
                        </Field>
                      </div>

                      <Field htmlFor="fiscal-issued-at" label="Emissão">
                        <input
                          className={fieldClassName}
                          defaultValue={prefill?.issuedAt ? prefill.issuedAt.slice(0, 10) : ""}
                          id="fiscal-issued-at"
                          name="issuedAt"
                          type="date"
                        />
                      </Field>

                      <Field
                        hint={`Total do pedido: ${formatBRLIntl(orderTotal)}.`}
                        htmlFor="fiscal-total"
                        label="Valor da nota"
                      >
                        <input
                          className={`${fieldClassName} tabular-nums`}
                          defaultValue={
                            prefill && prefill.totalCents > 0
                              ? (prefill.totalCents / 100).toFixed(2).replace(".", ",")
                              : ""
                          }
                          id="fiscal-total"
                          inputMode="decimal"
                          name="total"
                          placeholder="110,27"
                        />
                      </Field>
                    </div>

                    {replaceMode ? (
                      <p className="flex items-start gap-2 border-2 border-[#1a1a1a]/15 bg-[#faf8f2] px-4 py-3 text-xs leading-5 text-[#231f20]/74">
                        <TriangleAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
                        A nota atual será trocada por esta. O pedido guarda uma nota só — a
                        anterior deixa de existir. O recibo não é afetado.
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-3">
                      <button className={primaryClassName} disabled={busy} type="submit">
                        {busy ? "Enviando…" : replaceMode ? "Substituir nota" : "Salvar nota"}
                      </button>
                      <button
                        className={[
                          "inline-flex h-11 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-45",
                          FOCUS_RING,
                        ].join(" ")}
                        disabled={busy}
                        onClick={resetForm}
                        type="button"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className={primaryClassName}
                      onClick={() => {
                        setReplaceMode(false);
                        setIsFormOpen(true);
                      }}
                      type="button"
                    >
                      <FileUp aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                      {current ? "Completar ou corrigir" : "Anexar nota fiscal"}
                    </button>

                    {current ? (
                      <button
                        className={actionClassName}
                        onClick={() => {
                          setReplaceMode(true);
                          setIsFormOpen(true);
                        }}
                        type="button"
                      >
                        Substituir nota
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </DocumentBlock>
        ) : null}
      </div>
    </section>
  );
}
