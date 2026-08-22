import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { fetchProfileCustomer, updateProfileCustomer } from "@/features/profile/server/customer";
import { authOptions } from "@/lib/auth";
import { fetchCurrentUserRole } from "@/lib/server/current-user-role";
import { isValidCpf } from "@/lib/validation/brazilian-documents";

type AccountPayload = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  storeName?: string;
  cnpj?: string;
  cpf?: string;
  instagram?: string;
};

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as AccountPayload | null;

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const firstName = String(payload.firstName ?? "").trim();
  const lastName = String(payload.lastName ?? "").trim();
  const displayName = String(payload.displayName ?? "").trim();
  const email = String(payload.email ?? "").trim();
  const phoneNumber = String(payload.phoneNumber ?? "").trim();
  const storeName = String(payload.storeName ?? "").trim();
  const cnpj = String(payload.cnpj ?? "").trim();
  const cpf = String(payload.cpf ?? "").trim();
  const instagram = String(payload.instagram ?? "").trim();
  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { message: "Nome, sobrenome e e-mail são obrigatórios." },
      { status: 422 },
    );
  }

  const role = await fetchCurrentUserRole(session.accessToken).catch(() => undefined);

  if (!role) {
    return NextResponse.json(
      { message: "Não foi possível confirmar as permissões da conta." },
      { status: 503 },
    );
  }

  // O cadastro empresarial já valida o CPF; sem esta guarda o mesmo dado entrava sem verificação
  // pela porta do perfil e ficava gravado sujo em `wp_usermeta`.
  if (role !== "seller" && cpf && !isValidCpf(cpf)) {
    return NextResponse.json({ message: "Informe um CPF válido." }, { status: 422 });
  }

  try {
    const customer = await updateProfileCustomer(session.accessToken, {
      firstName,
      lastName,
      displayName,
      email,
      metaData:
        role === "seller"
          ? [
              { key: "store_name", value: storeName },
              { key: "phone_number", value: phoneNumber },
              { key: "cnpj", value: cnpj },
              { key: "instagram", value: instagram },
            ]
          : [
              { key: "phone_number", value: phoneNumber },
              { key: "cpf", value: cpf },
            ],
    });

    return NextResponse.json({ customer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar seus dados.";

    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const customer = await fetchProfileCustomer(session.accessToken);
    return NextResponse.json({ customer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível carregar seus dados.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
