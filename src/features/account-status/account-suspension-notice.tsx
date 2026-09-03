import { getServerSession } from "next-auth";

import { getContactConfig } from "@/features/site-contact/services/contact-config";
import { contactPhoneHref } from "@/features/site-contact/contact-phone";
import { authOptions } from "@/lib/auth";

function formatDate(value: string | undefined) {
  if (!value) return "";

  const parsed = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}

/**
 * Aviso persistente para quem tem a conta suspensa.
 *
 * O login continua funcionando de propósito: a pessoa entra, lê o motivo e sabe com quem falar.
 * A recusa de verdade acontece no WordPress — este aviso apenas evita que ela descubra o bloqueio
 * só no meio do checkout.
 */
export async function AccountSuspensionNotice() {
  const session = await getServerSession(authOptions);

  if (session?.b2b?.accountStatus !== "suspended") {
    return null;
  }

  const suspension = session.b2b.accountSuspension ?? null;
  const contact = await getContactConfig();
  const phoneHref = contactPhoneHref(contact.phone);
  const since = formatDate(suspension?.at);

  return (
    <aside
      aria-labelledby="account-suspension-title"
      className="border-y-2 border-[#1a1a1a] bg-[#c0392b] text-white"
      role="status"
    >
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
        <div className="space-y-1">
          <p
            className="text-xs font-black uppercase tracking-[0.22em]"
            id="account-suspension-title"
          >
            Conta suspensa{since ? ` desde ${since}` : ""}
          </p>
          <p className="max-w-3xl text-sm leading-6">
            Sua conta está bloqueada para comprar e vender no Papelito. Você continua com acesso ao
            histórico, aos dados cadastrais e às conversas.
            {suspension?.reason ? (
              <>
                {" "}
                Motivo registrado: <strong className="font-semibold">{suspension.reason}</strong>
              </>
            ) : null}
          </p>
        </div>

        {phoneHref ? (
          <a
            className="inline-flex h-11 shrink-0 items-center justify-center border-2 border-white bg-white px-5 text-xs font-black uppercase tracking-widest text-[#c0392b] transition hover:bg-transparent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href={phoneHref}
          >
            Falar com a Papelito
          </a>
        ) : null}
      </div>
    </aside>
  );
}
