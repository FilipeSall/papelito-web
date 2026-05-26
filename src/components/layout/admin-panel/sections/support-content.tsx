import { MessageThreadsList, MessageThreadPanel, getMessageThread, getMessageThreads } from "@/features/messages";
import { firstParam } from "@/lib/search-params";

import { Panel } from "../primitives";

export async function SupportContent({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const threads = await getMessageThreads();
  const selectedValue = firstParam(searchParams?.thread);
  const selectedId = selectedValue && /^\d+$/.test(selectedValue)
    ? Number.parseInt(selectedValue, 10)
    : threads.items[0]?.threadId ?? null;
  const selectedThread = selectedId ? await getMessageThread(selectedId) : null;

  return (
    <div className="space-y-5">
      <Panel className="px-5 py-5 md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-dark/48">
          Atendimento escalado
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold uppercase tracking-[0.08em] text-brand-dark">
              Suporte
            </h2>
            <p className="mt-2 text-sm text-brand-dark/62">
              Conversas enviadas pelo cliente para acompanhamento da Papelito.
            </p>
          </div>
          <p className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-brand-yellow">
            {threads.total} escalada{threads.total === 1 ? "" : "s"}
          </p>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[350px_minmax(0,1fr)]">
        <Panel className="p-3">
          <MessageThreadsList
            context="admin"
            items={threads.items}
            selectedThreadId={selectedThread?.threadId ?? null}
          />
        </Panel>
        {selectedThread ? (
          <MessageThreadPanel initialThread={selectedThread} />
        ) : (
          <Panel className="flex min-h-72 items-center justify-center p-8 text-center text-sm text-brand-dark/55">
            Nenhuma conversa escalada aguardando acompanhamento.
          </Panel>
        )}
      </div>
    </div>
  );
}
