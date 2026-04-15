import Image from "next/image";

export function PaymentMethodOption({
  iconAlt,
  iconSrc,
  label,
  selected,
  onClick,
}: {
  iconAlt: string;
  iconSrc: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-[88px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 py-4 transition ${
        selected
          ? "border-[#FFE500] bg-[#FEFCE8]"
          : "border-[#D1D5DC] bg-white hover:border-[#B9C1CC]"
      }`}
      type="button"
      onClick={onClick}
    >
      <Image alt={iconAlt} height={20} src={iconSrc} width={20} />
      <span
        className={`text-sm leading-[20px] tracking-[-0.1504px] ${
          selected ? "font-black text-brand-dark" : "font-black text-text-muted"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
