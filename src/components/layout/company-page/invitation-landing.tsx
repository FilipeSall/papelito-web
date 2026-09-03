"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";

import { acceptInvitation, declineInvitation, previewInvitation } from "@/features/company/client/company-client";
import { signOutAndClearSession } from "@/features/auth/client/logout";
import type { InvitationPreview } from "@/features/company/types/company";
import { roleLabel } from "@/features/company/utils/labels";

type InvitationLandingProps = {
  token: string;
};

type Phase = "loading" | "invalid" | "ready" | "accepting" | "accepted" | "declined" | "error";

const RETURN_PATH = "/convite";

const PRIMARY_ACTION =
  "block w-full bg-[#1a1a1a] px-5 py-3 text-center text-[12px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:opacity-50";

const SECONDARY_ACTION =
  "block w-full border-2 border-[#1a1a1a] bg-white px-5 py-3 text-center text-[12px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition-shadow hover:shadow-[3px_3px_0px_#1a1a1a] focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:opacity-50";

const HINT = "text-[12px] font-bold uppercase tracking-[0.14em] text-[#231f20]";

/**
 * Landing de convite (/convite/[token]).
 *
 * 1. Valida o token no backend ANTES de exibir qualquer dado; o backend move o token para um
 *    cookie HttpOnly e devolve só o preview neutro (nome da empresa + papel). O token some da URL.
 * 2. Sem sessão: roteia por `accountExists`/`authMethods` do preview — CTA único de cadastro para
 *    quem não tem conta, de login para quem tem. A bifurcação cega antiga levava o convidado novo
 *    para a tela de login, que não cria conta, e o fluxo morria ali.
 * 3. Com sessão: só oferece aceitar quando o e-mail da sessão é o do convite; caso contrário
 *    manda trocar de conta, em vez de deixar o backend recusar com 403.
 * 4. O backend continua sendo a autoridade: e-mail confirmado, expiração e uso único.
 */
export function InvitationLanding({ token }: InvitationLandingProps) {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [phase, setPhase] = useState<Phase>("loading");
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const cleanedUrl = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await previewInvitation(token);
      if (!active) return;
      if (!result.ok) {
        setMessage(result.message);
        setPhase("invalid");
        return;
      }
      setPreview(result.data);
      setPhase("ready");
      // Remove o token da URL após a validação (o token vive só no cookie HttpOnly).
      if (!cleanedUrl.current) {
        cleanedUrl.current = true;
        window.history.replaceState(null, "", "/convite");
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  async function handleAccept() {
    setPhase("accepting");
    setMessage(null);
    const result = await acceptInvitation();
    if (!result.ok) {
      setMessage(`⚠ ${result.message}`);
      setPhase("error");
      return;
    }
    await update({ refreshB2b: true });
    setPhase("accepted");
    setTimeout(() => router.push("/perfil/empresa"), 1200);
  }

  async function handleDecline() {
    setPhase("accepting");
    const result = await declineInvitation();
    if (!result.ok) {
      setMessage(`⚠ ${result.message}`);
      setPhase("error");
      return;
    }
    setPhase("declined");
  }

  async function handleSwitchAccount() {
    await signOutAndClearSession({
      callbackUrl: `/entrar?callbackUrl=${encodeURIComponent(RETURN_PATH)}`,
    });
  }

  const isAuthed = status === "authenticated" && Boolean(session?.user);
  const sessionEmail = session?.user?.email?.toLowerCase() ?? "";
  const invitedEmail = preview?.invitedEmail?.toLowerCase() ?? "";
  const emailMatches = sessionEmail !== "" && sessionEmail === invitedEmail;
  const busy = phase === "accepting";
  // authMethods vazio para conta existente é legado sem a meta: senha continua valendo.
  const allowsPassword =
    !preview?.authMethods?.length || preview.authMethods.includes("password");
  const allowsGoogle = Boolean(preview?.authMethods?.includes("google"));

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] p-8 shadow-[8px_8px_0px_#1a1a1a]">
        <div className="mb-6 h-2 w-full bg-brand-yellow" />

        {phase === "loading" ? (
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#1a1a1a]">
            Validando convite...
          </p>
        ) : null}

        {phase === "invalid" ? (
          <div className="space-y-3">
            <h1 className="text-xl font-black uppercase tracking-[0.02em] text-[#1a1a1a]">
              Convite inválido
            </h1>
            <p className="text-sm font-medium text-[#231f20]">
              {message ?? "Este convite não é válido ou expirou."}
            </p>
            <Link
              href="/"
              className="inline-flex bg-[#1a1a1a] px-5 py-2.5 text-[12px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow"
            >
              Voltar ao início
            </Link>
          </div>
        ) : null}

        {preview && (phase === "ready" || phase === "accepting" || phase === "error") ? (
          <div className="space-y-4">
            <h1 className="text-xl font-black uppercase tracking-[0.02em] text-[#1a1a1a]">
              Convite para {preview.companyName || "uma empresa"}
            </h1>
            <p className="text-sm font-medium text-[#231f20]">
              Você foi convidado(a) como{" "}
              <strong className="font-black uppercase">{roleLabel(preview.invitedRole)}</strong>.
            </p>

            {message ? <p className="text-sm font-bold text-[#c0392b]">{message}</p> : null}

            {isAuthed && emailMatches ? (
              <div className="space-y-3">
                <button type="button" disabled={busy} onClick={handleAccept} className={PRIMARY_ACTION}>
                  {busy ? "Aceitando..." : "Aceitar convite"}
                </button>
                <button type="button" disabled={busy} onClick={handleDecline} className={SECONDARY_ACTION}>
                  Recusar convite
                </button>
              </div>
            ) : null}

            {isAuthed && !emailMatches ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#231f20]">
                  Você está conectado(a) como{" "}
                  <strong className="font-black">{sessionEmail}</strong>, mas este convite é para{" "}
                  <strong className="font-black">{preview.invitedEmail}</strong>.
                </p>
                <button type="button" onClick={handleSwitchAccount} className={PRIMARY_ACTION}>
                  Entrar com outra conta
                </button>
              </div>
            ) : null}

            {!isAuthed && preview.accountExists ? (
              <div className="space-y-3">
                <p className={HINT}>Entre na sua conta para aceitar</p>
                {allowsPassword ? (
                  <button
                    type="button"
                    onClick={() => signIn(undefined, { callbackUrl: RETURN_PATH })}
                    className={PRIMARY_ACTION}
                  >
                    Entrar para aceitar
                  </button>
                ) : null}
                {allowsGoogle ? (
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: RETURN_PATH })}
                    className={allowsPassword ? SECONDARY_ACTION : PRIMARY_ACTION}
                  >
                    Entrar com Google
                  </button>
                ) : null}
              </div>
            ) : null}

            {!isAuthed && !preview.accountExists ? (
              <div className="space-y-3">
                <p className={HINT}>Crie sua conta e defina sua senha para aceitar</p>
                <Link href="/convite/cadastro" className={PRIMARY_ACTION}>
                  Criar conta e aceitar
                </Link>
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: RETURN_PATH })}
                  className={SECONDARY_ACTION}
                >
                  Criar conta com Google
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {phase === "accepted" ? (
          <div className="space-y-2">
            <h1 className="text-xl font-black uppercase tracking-[0.02em] text-[#1a1a1a]">
              ✓ Convite aceito
            </h1>
            <p className="text-sm font-medium text-[#231f20]">Redirecionando para sua empresa...</p>
          </div>
        ) : null}

        {phase === "declined" ? (
          <div className="space-y-2"><h1 className="text-xl font-black uppercase">Convite recusado</h1><p className="text-sm font-medium">Você não foi vinculado(a) à empresa.</p></div>
        ) : null}
      </div>
    </main>
  );
}
