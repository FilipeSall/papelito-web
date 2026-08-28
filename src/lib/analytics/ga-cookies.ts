export type GaIdentifiers = {
  clientId?: string;
  sessionId?: string;
};

function readCookies(cookieString: string): Map<string, string> {
  const pairs = new Map<string, string>();

  for (const entry of cookieString.split(";")) {
    const separator = entry.indexOf("=");

    if (separator > 0) {
      pairs.set(
        entry.slice(0, separator).trim(),
        entry.slice(separator + 1).trim(),
      );
    }
  }

  return pairs;
}

/**
 * Extrai o `client_id` do cookie `_ga`, o identificador anônimo do navegador para o GA4.
 *
 * O cookie vale `GA1.1.<client_id>`, e o próprio `client_id` contém um ponto — daí a leitura pelos
 * dois últimos segmentos em vez de um índice fixo.
 */
export function parseGaClientId(cookieString: string): string | undefined {
  const value = readCookies(cookieString).get("_ga");

  if (!value) {
    return undefined;
  }

  const parts = value.split(".");

  if (parts.length < 4) {
    return undefined;
  }

  const clientId = parts.slice(-2).join(".");

  return /^\d+\.\d+$/.test(clientId) ? clientId : undefined;
}

/**
 * Extrai o `session_id` do cookie `_ga_<CONTAINER>`.
 *
 * Sem ele o evento enviado pelo servidor abre uma sessão nova e a venda perde a origem da campanha,
 * caindo em `direct`. O GA4 já usou dois formatos para esse cookie (`GS1.1.<id>.…` e
 * `GS2.1.s<id>$o…`), e os dois circulam.
 */
export function parseGaSessionId(cookieString: string): string | undefined {
  for (const [name, value] of readCookies(cookieString)) {
    if (!name.startsWith("_ga_")) {
      continue;
    }

    const field = value.split(".")[2];

    if (!field) {
      continue;
    }

    const sessionId = field.split("$")[0].replace(/^s/, "");

    if (/^\d+$/.test(sessionId)) {
      return sessionId;
    }
  }

  return undefined;
}

/**
 * Lê os identificadores da sessão do GA4 no navegador para viajarem junto com o pedido.
 *
 * Devolve objeto vazio quando o GA4 não carregou (bloqueador, ambiente sem GTM): o checkout não
 * pode depender de analytics para funcionar.
 */
export function readGaIdentifiers(): GaIdentifiers {
  if (typeof document === "undefined") {
    return {};
  }

  const cookieString = document.cookie;

  return {
    clientId: parseGaClientId(cookieString),
    sessionId: parseGaSessionId(cookieString),
  };
}
