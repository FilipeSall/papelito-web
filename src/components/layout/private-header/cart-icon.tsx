import Image from "next/image";
import Link from "next/link";

type PrivateHeaderCartIconProps = {
  buttonClass: string;
  count?: number;
};

/**
 * Ícone do carrinho com badge de quantidade.
 * O badge só é exibido quando há itens no carrinho (count > 0).
 */
export function PrivateHeaderCartIcon({ buttonClass, count = 0 }: PrivateHeaderCartIconProps) {
  return (
    <Link aria-label="Carrinho" className={`${buttonClass} relative`} href="/carrinho">
      <Image
        alt=""
        aria-hidden
        className="h-7 w-7 shrink-0 brightness-0 invert"
        height={28}
        src="/images/icons/cart.svg"
        width={28}
      />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-yellow text-xs font-black text-brand-dark">
          {count}
        </span>
      )}
    </Link>
  );
}
