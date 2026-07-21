type TokenizeCreditCardInput = {
  holderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
};

type TokenizeCreditCardSuccess = {
  tokenId: string;
  last4: string;
};

type PagarmeTokenErrorPayload = {
  message?: unknown;
  errors?: unknown;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function collectTokenizationErrorDetails(errors: unknown): string[] {
  if (!errors || typeof errors !== "object") {
    return [];
  }

  const details: string[] = [];

  for (const [field, value] of Object.entries(errors)) {
    let message = "";

    if (Array.isArray(value)) {
      message = value.find((item): item is string => typeof item === "string") ?? "";
    } else if (typeof value === "string") {
      message = value;
    } else if (value && typeof value === "object") {
      const record = value as { message?: unknown; description?: unknown };
      message =
        typeof record.message === "string"
          ? record.message
          : typeof record.description === "string"
            ? record.description
            : "";
    }

    if (message) {
      details.push(`${field}: ${message}`);
    }

    if (details.length >= 2) {
      break;
    }
  }

  return details;
}

function tokenizationErrorMessage(payload: PagarmeTokenErrorPayload | null) {
  const message = typeof payload?.message === "string" ? payload.message.trim() : "";
  const details = collectTokenizationErrorDetails(payload?.errors);

  if (message && details.length > 0) {
    return `${message} (${details.join("; ")})`;
  }

  if (message) {
    return message;
  }

  if (details.length > 0) {
    return details.join("; ");
  }

  return "Nao foi possivel tokenizar o cartao.";
}

export async function tokenizeCreditCard(
  input: TokenizeCreditCardInput,
): Promise<TokenizeCreditCardSuccess> {
  const publicKey = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error("Chave publica do Pagar.me nao configurada.");
  }

  const digits = digitsOnly(input.cardNumber);
  const expiry = digitsOnly(input.expiryDate);

  if (digits.length < 13 || expiry.length !== 4 || digitsOnly(input.cvv).length < 3) {
    throw new Error("Os dados do cartao estao incompletos.");
  }

  const response = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(publicKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "card",
      card: {
        holder_name: input.holderName.trim(),
        number: digits,
        exp_month: expiry.slice(0, 2),
        exp_year: `20${expiry.slice(2)}`,
        cvv: digitsOnly(input.cvv),
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | ({ id?: string; card?: { last_four_digits?: string } } & PagarmeTokenErrorPayload)
    | null;

  if (!response.ok || !payload?.id) {
    throw new Error(tokenizationErrorMessage(payload));
  }

  return {
    tokenId: payload.id,
    last4: payload.card?.last_four_digits || digits.slice(-4),
  };
}
