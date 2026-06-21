import Link from "next/link";
import { MapPinOff } from "lucide-react";

interface AccountCepNoticeProps {
  show: boolean;
}

export function AccountCepNotice({ show }: AccountCepNoticeProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="border-b-2 border-[#1a1a1a] bg-brand-yellow">
      <div className="mx-auto flex max-w-391 items-center gap-3 px-4 py-3 text-[#1a1a1a] md:px-8">
        <span className="grid h-8 w-8 shrink-0 place-items-center border-2 border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow">
          <MapPinOff aria-hidden className="h-4 w-4" />
        </span>
        <p className="min-w-0 flex-1 text-sm font-bold leading-5">
          Sua conta está sem CEP. A busca por vendors próximos fica menos precisa.
        </p>
        <Link
          className="inline-flex shrink-0 items-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-1.5 text-xs font-black uppercase tracking-widest text-brand-yellow transition hover:bg-[#1a1a1a]/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
          href="/perfil/enderecos"
        >
          Adicionar
        </Link>
      </div>
    </div>
  );
}
