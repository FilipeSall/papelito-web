import type { RevendedorApplication } from "@/features/revendedor";

export function RevendedorApplicationPendingSummary({
  application,
}: {
  application: RevendedorApplication;
}) {
  return (
    <div className="mt-6 rounded-3.5 border border-[#E5E7EB] bg-[#FFFDF8] p-5 text-brand-dark">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">
            Status atual
          </p>
          <h3 className="mt-2 text-lg font-black uppercase">
            {application.status === "approved"
              ? "Aprovado"
              : application.status === "incomplete"
                ? "Cadastro incompleto"
                : "Em análise"}
          </h3>
        </div>
        <span className="rounded-full bg-brand-yellow px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-brand-dark">
          {application.status === "approved"
            ? "Liberado"
            : application.status === "incomplete"
              ? "Bloqueado para vender"
              : "Pendente"}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-text-muted">
        {application.status === "approved"
          ? "Seu cadastro no programa já foi aprovado pelo nosso time."
          : application.status === "incomplete"
            ? "Seu cadastro foi criado, mas ainda existem dados obrigatorios pendentes. Conclua as informacoes para liberar suas vendas."
            : "Recebemos sua triagem. O time comercial da Papelito vai revisar seus dados e retornar por e-mail."}
      </p>

      <div className="mt-5 rounded-3xl bg-brand-yellow/25 p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-dark/70">
          Dados enviados na triagem
        </p>
        <dl className="mt-4 grid gap-3 text-sm text-brand-dark">
          <div>
            <dt className="font-black">Loja</dt>
            <dd>{application.step1.storeName || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Responsável</dt>
            <dd>{`${application.step1.firstName} ${application.step1.lastName}`.trim() || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">E-mail</dt>
            <dd>{application.step1.email || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Telefone</dt>
            <dd>{application.step1.phone || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">CNPJ</dt>
            <dd>{application.step1.cnpj || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Instagram</dt>
            <dd>{application.step1.instagram ? `@${application.step1.instagram}` : "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Cidade / Estado</dt>
            <dd>
              {[application.step2.city, application.step2.state].filter(Boolean).join(", ") || "-"}
            </dd>
          </div>
          <div>
            <dt className="font-black">CEP de operação</dt>
            <dd>{application.step2.cep || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Faixa atendida</dt>
            <dd>
              {application.step2.minCep || application.step2.maxCep
                ? `${application.step2.minCep || "-"} a ${application.step2.maxCep || "-"}`
                : "-"}
            </dd>
          </div>
          <div>
            <dt className="font-black">Origem do contato</dt>
            <dd>{application.step1.discoveryChannel || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Já vende Papelito?</dt>
            <dd>{application.step1.hasSoldPapelito || "-"}</dd>
          </div>
          <div>
            <dt className="font-black">Enviado em</dt>
            <dd>{application.submittedAt || "-"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
