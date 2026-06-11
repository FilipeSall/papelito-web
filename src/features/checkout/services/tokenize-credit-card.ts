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

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
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
      Accept: "application/json",
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
    | { id?: string; card?: { last_four_digits?: string }; message?: string }
    | null;

  if (!response.ok || !payload?.id) {
    throw new Error(payload?.message || "Nao foi possivel tokenizar o cartao.");
  }

  return {
    tokenId: payload.id,
    last4: payload.card?.last_four_digits || digits.slice(-4),
  };
}
