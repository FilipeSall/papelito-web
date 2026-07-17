import Link from "next/link";
import { ArrowLeft, AtSign, Mail, Phone, Store } from "lucide-react";

import type { AdminVendorInterest } from "@/lib/server/admin-vendor-interests";
import { Panel } from "../primitives";

function instagramHref(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      return /(^|\.)instagram\.com$/i.test(url.hostname) ? url.toString() : null;
    } catch {
      return null;
    }
  }

  const handle = raw.replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `https://instagram.com/${handle}` : null;
}

function phoneHref(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) return null;
  return `tel:+${digits.length <= 11 ? `55${digits}` : digits}`;
}

function emailHref(value: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    ? `mailto:${encodeURIComponent(value.trim())}`
    : null;
}

function DetailField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">{label}</dt>
      <dd className="mt-1 text-sm font-medium leading-6 text-[#231f20]">{value?.trim() || "Não informado"}</dd>
    </div>
  );
}

export function VendorInterestDetailPage({ interest }: { interest: AdminVendorInterest }) {
  const instagram = instagramHref(interest.instagram);
  const phone = phoneHref(interest.phone);
  const email = emailHref(interest.email);
  const sentAt = interest.createdAt
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(
        new Date(interest.createdAt.replace(" ", "T") + "Z"),
      )
    : "Não informado";

  return (
    <div className="space-y-5">
      <Link className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#231f20]/64 hover:text-[#231f20]" href="/admin/vendor-interests">
        <ArrowLeft className="size-4" /> Voltar às manifestações
      </Link>

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#231f20]/48">manifestação #{interest.id}</p>
          <h1 className="mt-1 text-3xl font-black uppercase tracking-tight text-[#1a1a1a]">{interest.storeName || "Loja sem nome"}</h1>
          <p className="mt-2 text-sm text-[#231f20]/60">Enviada em {sentAt}</p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-yellow px-6 text-xs font-black uppercase tracking-[0.12em] text-brand-dark transition hover:brightness-95"
          href={`/admin/vendors?create=1&sourceUserId=${interest.customerUserId}&sourceInterestId=${interest.id}`}
        >
          <Store className="size-4" /> Novo vendor
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Panel className="p-5 sm:p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.14em]">Dados da triagem</h2>
            <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <DetailField label="Nome da loja" value={interest.storeName} />
              <DetailField label="CNPJ" value={interest.cnpj} />
              <DetailField label="Responsável" value={[interest.firstName, interest.lastName].filter(Boolean).join(" ")} />
              <DetailField label="Customer relacionado" value={interest.customer ? `${interest.customer.displayName || interest.customer.email} (#${interest.customer.id})` : undefined} />
              <DetailField label="Já vende Papelito" value={interest.hasSoldPapelito === "sim" ? "Sim" : interest.hasSoldPapelito === "nao" ? "Não" : undefined} />
              <DetailField label="Como conheceu a Papelito" value={interest.discoveryChannel} />
            </dl>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.14em]">Contato informado</h2>
            <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <DetailField label="Telefone" value={interest.phone} />
              <DetailField label="E-mail" value={interest.email} />
              <DetailField label="Instagram" value={interest.instagram ? `@${interest.instagram.replace(/^@/, "")}` : undefined} />
            </dl>
          </Panel>
        </div>

        <Panel className="h-fit p-5 sm:p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.14em]">Ações rápidas</h2>
          <p className="mt-2 text-sm leading-6 text-[#231f20]/60">Use os canais válidos informados pela loja para iniciar o contato.</p>
          <div className="mt-5 grid gap-3">
            {instagram ? <a className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#231f20]/16 bg-white text-xs font-bold uppercase tracking-wider hover:border-[#231f20]/45" href={instagram} rel="noopener noreferrer" target="_blank"><AtSign className="size-4" /> Abrir Instagram</a> : null}
            {phone ? <a className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#231f20]/16 bg-white text-xs font-bold uppercase tracking-wider hover:border-[#231f20]/45" href={phone}><Phone className="size-4" /> Ligar</a> : null}
            {email ? <a className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#231f20]/16 bg-white text-xs font-bold uppercase tracking-wider hover:border-[#231f20]/45" href={email}><Mail className="size-4" /> Enviar e-mail</a> : null}
            {!instagram && !phone && !email ? <p className="rounded-xl bg-[#f6f3e8] p-4 text-sm text-[#231f20]/60">Nenhum canal de contato válido foi informado.</p> : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
