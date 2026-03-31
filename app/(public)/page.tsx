import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <PageContainer className="flex flex-col gap-4">
        <h1 className="text-4xl font-black tracking-tight text-brand-dark">
          Papelito Web
        </h1>
        <p className="max-w-2xl text-base text-text-secondary">
          Base inicial com App Router organizada para escalar por domínio e
          por tipo de rota.
        </p>
        <div>
          <Link
            className="inline-flex rounded-full bg-brand-yellow px-6 py-3 text-sm font-bold text-brand-dark transition hover:opacity-90"
            href="/dashboard"
          >
            Ir para a área logada
          </Link>
        </div>
      </PageContainer>
    </main>
  );
}
