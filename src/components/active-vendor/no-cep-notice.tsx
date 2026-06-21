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
    <div className="border-2 border-[#1a1a1a] bg-brand-yellow/35 px-5 py-6 text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow">
          <MapPinOff aria-hidden className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-[0.16em]">{title}</p>
          <p className="mt-1 text-sm leading-5 text-[#1a1a1a]/80">{description}</p>
          <Link
            href="/perfil/enderecos"
            className="mt-4 inline-flex items-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 py-2 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
          >
            Cadastrar CEP
          </Link>
        </div>
      </div>
    </div>
  );
}
