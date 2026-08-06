"use client";

import Link from "next/link";

import {
  ApplicationStatusContent,
  CadastroAnaliseAside,
  CadastroAnaliseStepper,
  applicationPageTitle,
  resolveApplicationView,
  useCompanyApplication,
} from "@/components/layout/cadastro-analise-page";

export default function CadastroAnalisePage() {
  const { application, setApplication, loadState, reload } = useCompanyApplication();

  const hasLoadedApplication = loadState === "loaded" && application !== null;

  return (
    <div className="flex min-h-screen">
      <CadastroAnaliseAside />

      <main className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
        <section className="w-full max-w-md">
          {hasLoadedApplication ? <CadastroAnaliseStepper /> : null}

          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-yellow">
            {hasLoadedApplication ? "Análise empresarial" : "Cadastro empresarial"}
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-wide text-white">
            {applicationPageTitle(loadState, application?.status)}
          </h2>

          <ApplicationStatusContent
            view={resolveApplicationView(loadState, application)}
            onRetry={reload}
            onDocumentSent={setApplication}
          />

          <Link href="/" className="mt-8 inline-block text-sm font-bold text-brand-yellow hover:underline">
            Voltar ao início
          </Link>
        </section>
      </main>
    </div>
  );
}
