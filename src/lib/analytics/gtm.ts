const CONTAINER_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

/**
 * Valida o ID de container do Google Tag Manager desta implantação.
 *
 * Devolve `undefined` para valor ausente ou fora do formato, e é isso que mantém o GTM fora do
 * ambiente local: sem `NEXT_PUBLIC_GTM_ID`, nenhuma sessão de `localhost` entra na propriedade de
 * Analytics de produção nem envia URL de rota autenticada ao Google.
 */
export function resolveGtmContainerId(value: string | undefined): string | undefined {
  const trimmed = value?.trim().toUpperCase();

  return trimmed && CONTAINER_ID_PATTERN.test(trimmed) ? trimmed : undefined;
}

export const GTM_CONTAINER_ID = resolveGtmContainerId(process.env.NEXT_PUBLIC_GTM_ID);
