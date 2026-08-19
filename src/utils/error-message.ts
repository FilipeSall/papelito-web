export function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Resposta de erro sem corpo JSON nosso — 502/504 de gateway, função que estourou
 * tempo — precisa dizer o status. Sem isso a falha vira uma frase genérica e o
 * problema fica indiagnosticável para quem só tem a tela.
 */
export async function messageFromResponse(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null;

  if (typeof body?.message === "string" && body.message.trim().length > 0) {
    return body.message;
  }

  return `${fallback} (HTTP ${response.status})`;
}
