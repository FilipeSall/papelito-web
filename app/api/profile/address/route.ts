import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { fetchProfileCustomer, updateProfileCustomer } from "@/features/profile/server/customer";
import { authOptions } from "@/lib/auth";

type AddressPayload = {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as AddressPayload | null;

  if (!payload) {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  const zipCode = String(payload.zipCode ?? "").trim();
  const street = String(payload.street ?? "").trim();
  const number = String(payload.number ?? "").trim();
  const complement = String(payload.complement ?? "").trim();
  const neighborhood = String(payload.neighborhood ?? "").trim();
  const city = String(payload.city ?? "").trim();
  const state = String(payload.state ?? "").trim().toUpperCase();

  if (!zipCode || !street || !number || !neighborhood || !city || !state) {
    return NextResponse.json(
      {
        message:
          "Preencha CEP, logradouro, numero, bairro, cidade e estado para salvar o endereco.",
      },
      { status: 422 },
    );
  }

  try {
    const currentCustomer = await fetchProfileCustomer(session.accessToken);
    const recipientFirstName = currentCustomer.firstName || currentCustomer.billing.firstName;
    const recipientLastName = currentCustomer.lastName || currentCustomer.billing.lastName;
    const recipientEmail = currentCustomer.email || currentCustomer.billing.email;
    const recipientPhone =
      currentCustomer.meta.phoneNumber || currentCustomer.billing.phone || "";
    const company = currentCustomer.meta.storeName || currentCustomer.billing.company || "";
    const address1 = `${street}, ${number}`;
    const address2 = [neighborhood, complement].filter(Boolean).join(" • ");

    const addressInput = {
      firstName: recipientFirstName,
      lastName: recipientLastName,
      company,
      address1,
      address2,
      city,
      state,
      postcode: zipCode,
      country: "BR",
      email: recipientEmail,
      phone: recipientPhone,
      overwrite: true,
    };

    const customer = await updateProfileCustomer(session.accessToken, {
      shipping: addressInput,
      billing: addressInput,
      metaData: [
        { key: "state", value: state },
        { key: "city", value: city },
        { key: "cep", value: zipCode },
      ],
    });

    return NextResponse.json({ customer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nao foi possivel atualizar seu endereco.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
