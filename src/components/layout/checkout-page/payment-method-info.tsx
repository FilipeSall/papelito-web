import type { PaymentMethod } from "@/features/checkout";

const INFO: Record<Exclude<PaymentMethod, "credit_card">, string> = {
  pix: "O QR Code do Pix será gerado na próxima etapa para pagamento imediato.",
  boleto: "O boleto bancário será gerado na revisão final. Compensacao em até 3 dias úteis.",
};

export function PaymentMethodInfo({ method }: { method: Exclude<PaymentMethod, "credit_card"> }) {
  return (
    <div className="mt-6 rounded-[14px] border border-[#E5E7EB] bg-bg-light px-4 py-4">
      <p className="text-sm leading-5 tracking-[-0.1504px] text-text-secondary">
        {INFO[method]}
      </p>
    </div>
  );
}
