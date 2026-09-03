import { Panel } from "@/components/layout/operational-panel";

import { contactPhoneHref } from "@/features/site-contact/contact-phone";

/**
 * Bloqueio antecipado das superfícies de venda futura do painel do vendor.
 *
 * Estoque e cobertura preparam vendas novas, e conta suspensa não vende. Pedidos, rastreio e
 * mensagens continuam abertos: quem já comprou precisa receber.
 */
export function VendorSuspendedNotice({
  body,
  phone,
  reason,
}: {
  body: string;
  phone: string;
  reason?: string;
}) {
  const phoneHref = contactPhoneHref(phone);

  return (
    <Panel className="overflow-hidden">
      <div className="bg-[#c0392b] px-5 py-3 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.25em]">Conta suspensa</p>
      </div>
      <div className="space-y-5 px-5 py-6 md:px-6">
        <div className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-[#c0392b]" />
          <h3
            className="text-2xl font-semibold uppercase tracking-widest"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Operação de venda bloqueada
          </h3>
        </div>
        <p className="max-w-xl text-sm leading-6 text-brand-dark/68">{body}</p>
        {reason ? (
          <p className="max-w-xl border-l-2 border-[#c0392b] pl-4 text-sm leading-6 text-brand-dark/76">
            Motivo registrado: <strong className="font-semibold">{reason}</strong>
          </p>
        ) : null}
        {phoneHref ? (
          <a
            className="inline-flex h-11 w-fit items-center justify-center whitespace-nowrap border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
            href={phoneHref}
          >
            Falar com a Papelito
          </a>
        ) : null}
      </div>
    </Panel>
  );
}
