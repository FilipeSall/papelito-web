import { PageContainer } from "@/components/ui/page-container";

export default function DashboardPage() {
  return (
    <main className="px-6 py-12">
      <PageContainer className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-brand-dark">Dashboard</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Estrutura de rota pronta para receber autenticacao e dados reais.
        </p>
      </PageContainer>
    </main>
  );
}
