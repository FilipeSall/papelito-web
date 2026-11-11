import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { ExpocannabisApp } from "@/components/layout/expocannabis-page/expocannabis-app";
import { EXPOCANNABIS_EVENT_ID, EXPOCANNABIS_PATH } from "@/features/expocannabis/constants";
import { parseEventContext } from "@/features/expocannabis/utils/parse-context";
import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

export const dynamic = "force-dynamic";

function NotConfigured() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#231f20] p-12 text-center text-white">
      <div>
        <h1 className="font-[family-name:var(--font-expo-display)] text-4xl uppercase text-brand-yellow">
          Evento ainda não configurado
        </h1>
        <p className="mt-4 text-lg font-semibold">Falta definir o vendor e a maquininha do estande.</p>
      </div>
    </main>
  );
}

/**
 * Tablet do estande. Só abre para quem o WordPress reconhece como operador do evento; para os
 * demais a rota responde 404, como se não existisse.
 */
export default async function ExpocannabisPage() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    redirect(`/entrar?callbackUrl=${EXPOCANNABIS_PATH}`);
  }

  const result = await wpRest<unknown>(`/papelito/v1/event/${EXPOCANNABIS_EVENT_ID}/context`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
    timeoutMs: 15_000,
  });

  if (!result.ok && result.error.code === "papelito_event_not_configured") {
    return <NotConfigured />;
  }

  const context = result.ok ? parseEventContext(result.data) : null;

  if (!context) {
    notFound();
  }

  return <ExpocannabisApp context={context} />;
}
