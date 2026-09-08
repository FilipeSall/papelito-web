import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { getContactConfig, saveContactConfig } from "@/features/site-contact/services/contact-config";
import {
  type SocialNetworkId,
  type SocialProfilesConfig,
  isSocialNetworkId,
  isValidSocialProfileUrl,
} from "@/features/site-contact/social-profiles";

type SocialParseResult = { social: SocialProfilesConfig } | { message: string };

/**
 * Aceita só as redes do catálogo e só URL http/https — string vazia é o modo de ocultar o ícone.
 */
function parseSocial(value: unknown): SocialParseResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { message: "Informe os links das redes sociais." };
  }

  const social: SocialProfilesConfig = {};

  for (const [network, href] of Object.entries(value as Record<string, unknown>)) {
    if (!isSocialNetworkId(network)) {
      return { message: `Rede social desconhecida: ${network}.` };
    }

    if (typeof href !== "string" || !isValidSocialProfileUrl(href)) {
      return { message: `Informe uma URL http ou https para ${network}, ou deixe em branco.` };
    }

    social[network as SocialNetworkId] = href.trim();
  }

  return { social };
}

export async function GET() { const result = await readWithAdminApiSession(getContactConfig); if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status }); return NextResponse.json(result.data); }

export async function PUT(request: Request) {
  const auth = await getAdminApiSession();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as { phone?: unknown; social?: unknown } | null;
  if (!body || typeof body !== "object") return NextResponse.json({ message: "Informe o telefone ou os links das redes sociais." }, { status: 400 });

  const hasPhone = "phone" in body;
  const hasSocial = "social" in body;
  if (!hasPhone && !hasSocial) return NextResponse.json({ message: "Informe o telefone ou os links das redes sociais." }, { status: 400 });
  if (hasPhone && typeof body.phone !== "string") return NextResponse.json({ message: "Informe um telefone válido." }, { status: 400 });

  const parsedSocial = hasSocial ? parseSocial(body.social) : null;
  if (parsedSocial && "message" in parsedSocial) return NextResponse.json({ message: parsedSocial.message }, { status: 400 });

  try {
    const saved = await saveContactConfig(auth.accessToken ?? "", {
      ...(hasPhone ? { phone: body.phone as string } : {}),
      ...(parsedSocial ? { social: parsedSocial.social } : {}),
    });

    revalidateTag("wp:contact-config", "max");

    return NextResponse.json(saved);
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 502;

    return NextResponse.json({ message: error instanceof Error ? error.message : "Não foi possível salvar." }, { status });
  }
}
