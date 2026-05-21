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
    <div className="border-b border-brand-yellow/35 bg-brand-yellow/14">
      <div className="mx-auto flex max-w-391 items-center gap-3 px-4 py-3 text-brand-dark md:px-8">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-dark text-brand-yellow">
          <MapPinOff aria-hidden className="h-4 w-4" />
        </span>
        <p className="min-w-0 flex-1 text-sm font-semibold leading-5">
          Sua conta está sem CEP. A busca por vendors próximos fica menos precisa.
        </p>
        <Link
          className="shrink-0 rounded-full bg-brand-dark px-3 py-1.5 text-xs font-black text-brand-yellow transition hover:opacity-90"
          href="/perfil/enderecos"
        >
          Adicionar
        </Link>
      </div>
    </div>
  );
}
