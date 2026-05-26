import { VendorEmptyState, VendorPageHeader } from "@/components/layout/vendor-panel";

export default function VendorMessagesPage() {
  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="O canal direto com clientes sera conectado em uma etapa dedicada de suporte."
        eyebrow="Atendimento"
        signal="step 13"
        title="Mensagens"
      />
      <VendorEmptyState
        body="As conversas com clientes serao habilitadas no proximo modulo de suporte. Nenhuma thread ficticia e exibida aqui."
        label="MSG"
        title="Mensagens em preparacao"
      />
    </div>
  );
}
