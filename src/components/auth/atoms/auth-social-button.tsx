import Image from "next/image";

interface AuthSocialButtonProps {
  label: string;
  iconSrc: string;
  iconAlt: string;
}

export function AuthSocialButton({
  label,
  iconSrc,
  iconAlt,
}: AuthSocialButtonProps) {
  return (
    <button
      type="button"
      className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-white/20 text-sm font-medium text-white transition hover:bg-white/5"
    >
      <Image src={iconSrc} alt={iconAlt} width={18} height={18} />
      {label}
    </button>
  );
}
