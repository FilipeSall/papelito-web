import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { fetchProfileCustomer, updateProfileCustomer } from "@/features/profile/server/customer";
import { authOptions } from "@/lib/auth";
import {
  getAccountActiveVendorTag,
  getAccountCoverageCepTag,
} from "@/lib/server/account-cache-tags";

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
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as AddressPayload | null;

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
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
          "Preencha CEP, logradouro, número, bairro, cidade e estado para salvar o endereço.",
      },
      { status: 422 },
    );
  }

  try {
    const currentCustomer = await fetchProfileCustomer(session.accessToken);
    const { firstName: sessionFirstName, lastName: sessionLastName } = splitFullName(
      session.user.name,
    );
    const recipientFirstName =
      currentCustomer.firstName || currentCustomer.billing.firstName || sessionFirstName;
    const recipientLastName =
      currentCustomer.lastName || currentCustomer.billing.lastName || sessionLastName;
    const recipientEmail =
      currentCustomer.email || currentCustomer.billing.email || session.user.email || "";
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

    const accountId = session.user.id ?? session.user.email ?? "anonymous";
    revalidateTag(getAccountCoverageCepTag(accountId), "max");
    revalidateTag(getAccountActiveVendorTag(accountId), "max");
    revalidateTag("wp:coverage", "max");

    return NextResponse.json({ customer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar seu endereço.";

    return NextResponse.json({ message }, { status: 500 });
  }
}

function splitFullName(fullName?: string | null) {
  const normalizedName = String(fullName ?? "").trim();
  const parts = normalizedName.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}
