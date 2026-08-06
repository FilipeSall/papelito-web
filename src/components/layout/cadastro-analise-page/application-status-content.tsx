import Link from "next/link";

import { DocumentUploadForm } from "./document-upload-form";
import type { Application, ApplicationView } from "./application-view";

const CALL_TO_ACTION_CLASS =
  "mt-6 inline-flex rounded-full bg-brand-yellow px-5 py-3 text-sm font-black uppercase tracking-wide text-brand-dark transition hover:bg-white";
const STATUS_TEXT_CLASS = "mt-4 text-sm leading-6 text-white/55";

interface ApplicationStatusContentProps {
  view: ApplicationView;
  onRetry: () => void;
  onDocumentSent: (application: Application) => void;
}

export function ApplicationStatusContent({
  view,
  onRetry,
  onDocumentSent,
}: Readonly<ApplicationStatusContentProps>) {
  switch (view) {
    case "loading":
      return <p className={STATUS_TEXT_CLASS}>Carregando sua candidatura...</p>;

    case "missing":
      return (
        <>
          <p className={STATUS_TEXT_CLASS}>
            Não encontramos uma candidatura neste dispositivo. Inicie um novo cadastro para continuar.
          </p>
          <Link href="/cadastro" className={CALL_TO_ACTION_CLASS}>
            Iniciar cadastro
          </Link>
        </>
      );

    case "error":
      return (
        <>
          <p className={STATUS_TEXT_CLASS}>
            Não foi possível carregar sua candidatura. Tente novamente.
          </p>
          <button type="button" onClick={onRetry} className={CALL_TO_ACTION_CLASS}>
            Tentar novamente
          </button>
        </>
      );

    case "document_required":
      return <DocumentUploadForm onDocumentSent={onDocumentSent} />;

    case "pending_manual_review":
      return (
        <p className={STATUS_TEXT_CLASS}>
          Recebemos seus dados. Sua conta será criada somente após a aprovação da equipe
          Papelito.
        </p>
      );

    case "approved":
      return (
        <>
          <p className={STATUS_TEXT_CLASS}>
            Seu cadastro empresarial foi aprovado e sua conta já foi criada. Você já pode entrar.
          </p>
          <Link href="/entrar" className={CALL_TO_ACTION_CLASS}>
            Entrar na conta
          </Link>
        </>
      );

    case "rejected":
      return (
        <>
          <p className={STATUS_TEXT_CLASS}>
            Não foi possível aprovar sua candidatura. Para uma nova tentativa, reinicie o cadastro empresarial.
          </p>
          <Link href="/cadastro" className={CALL_TO_ACTION_CLASS}>
            Iniciar novo cadastro
          </Link>
        </>
      );

    case "unknown":
      return (
        <p className={STATUS_TEXT_CLASS}>
          Não foi possível carregar o estado da candidatura. Atualize a página para tentar
          novamente.
        </p>
      );

    // `none` é carregamento bem-sucedido sem candidatura: não há o que dizer.
    default:
      return null;
  }
}
