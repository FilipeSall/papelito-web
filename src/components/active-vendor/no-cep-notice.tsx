import Link from "next/link";
import { MapPinOff } from "lucide-react";

interface NoCepNoticeProps {
  title?: string;
  description?: string;
}

export function NoCepNotice({
  title = "Sua conta está sem CEP",
  description = "Cadastre um CEP nos seus endereços para escolher um vendor que atende sua região.",
}: NoCepNoticeProps) {
  return (
    <div className="rounded-2xl border border-brand-yellow/40 bg-brand-yellow/15 px-5 py-6 text-brand-dark">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-dark text-brand-yellow">
          <MapPinOff aria-hidden className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-wide">{title}</p>
          <p className="mt-1 text-sm leading-5">{description}</p>
          <Link
            href="/perfil/enderecos"
            className="mt-3 inline-flex items-center rounded-full bg-brand-dark px-4 py-2 text-xs font-black uppercase tracking-wide text-brand-yellow transition hover:opacity-90"
          >
            Cadastrar CEP
          </Link>
        </div>
      </div>
    </div>
  );
}
