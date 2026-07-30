import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import {
  ONBOARDING_PATH,
  requiresB2bOnboarding,
  resolveSafeCallbackUrl,
} from "@/features/company/onboarding";
import { fetchProfileCustomer } from "@/features/profile/server/customer";
import { authOptions } from "@/lib/auth";
import { fetchCompanyContext } from "@/lib/server/company-api";

import type { CadastroIntent, CadastroPrefill } from "../shared";
import { CompletarCadastroForm } from "./completar-cadastro-form";

export const dynamic = "force-dynamic";

function splitFullName(name: string | null | undefined) {
  return typeof name === "string" ? name.trim() : "";
}

function resolveIntent(onboardingType: string | undefined): CadastroIntent {
  return onboardingType === "join_company" ? "join_company" : "create_company";
}

type SavedAddress = {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

const EMPTY_ADDRESS: SavedAddress = { cep: "", street: "", neighborhood: "", city: "", state: "" };

/**
 * Reidrata o endereço já salvo para o usuário retomar o cadastro sem redigitar.
 *
 * O onboarding grava `address1 = "<logradouro>, <numero>"` e `address2 = "<bairro> • <complemento>"`,
 * então a leitura desfaz exatamente essa composição.
 */
async function fetchSavedAddress(accessToken: string): Promise<SavedAddress> {
  try {
    const customer = await fetchProfileCustomer(accessToken);
    const address = customer.shipping.postcode ? customer.shipping : customer.billing;

    return {
      cep: customer.meta.cep || address.postcode || "",
      street: (address.address1 ?? "").split(",")[0]?.trim() ?? "",
      neighborhood: (address.address2 ?? "").split("•")[0]?.trim() ?? "",
      city: address.city ?? "",
      state: address.state ?? "",
    };
  } catch {
    return EMPTY_ADDRESS;
  }
}

export default async function CompletarCadastroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawCallbackUrl = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;
  const callbackUrl = resolveSafeCallbackUrl(rawCallbackUrl);

  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    redirect(`/entrar?callbackUrl=${encodeURIComponent(ONBOARDING_PATH)}`);
  }

  // O contexto do WordPress é a autoridade: um token com b2b desatualizado não pode manter
  // alguém preso nesta tela nem deixar passar quem ainda não completou.
  const contextResult = await fetchCompanyContext(session.accessToken);
  const context = contextResult.ok ? contextResult.data : null;
  const b2b = context ?? session.b2b ?? null;

  const application = context?.ownerApplication ?? session.b2b?.ownerApplication;
  const isOwnerReviewFlow =
    application?.status === "document_required" ||
    application?.status === "pending_manual_review" ||
    application?.status === "rejected";

  if (context && !requiresB2bOnboarding(context) && !isOwnerReviewFlow) {
    redirect(callbackUrl);
  }

  const resume = b2b?.onboarding;
  const savedAddress = await fetchSavedAddress(session.accessToken);
  const prefill: CadastroPrefill = {
    email: session.user.email ?? "",
    name: splitFullName(session.user.name),
    cep: savedAddress.cep,
    street: savedAddress.street,
    neighborhood: savedAddress.neighborhood,
    city: savedAddress.city,
    state: savedAddress.state,
    cnpj: resume?.targetCnpj ?? "",
    cpfLast4: resume?.cpfLast4 ?? null,
    hasBirthDate: resume?.hasBirthDate === true,
    intent: resolveIntent(resume?.type),
  };

  return (
    <CompletarCadastroForm
      prefill={prefill}
      callbackUrl={callbackUrl}
      initialOwnerApplication={application}
    />
  );
}
