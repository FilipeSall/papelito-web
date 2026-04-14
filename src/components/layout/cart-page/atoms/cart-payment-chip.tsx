interface CartPaymentChipProps {
  label: string;
}

export function CartPaymentChip({ label }: CartPaymentChipProps) {
  return (
    <span className="inline-flex h-6.5 items-center rounded-[10px] border border-[#F3F4F6] bg-[#F9FAFB] px-2 text-xs font-medium text-[#99A1AF]">
      {label}
    </span>
  );
}
