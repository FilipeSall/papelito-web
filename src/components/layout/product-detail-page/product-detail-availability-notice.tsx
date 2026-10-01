interface AvailabilityNoticeProps {
  /** Consulta do vendor do carrinho ainda em andamento. */
  pending: boolean;
  /** Falha técnica mantém a compra bloqueada e permite repetir a consulta. */
  error: string | null;
  /** Repete a verificação do contexto atual. */
  onRetry: () => void;
}

/** Feedback da consulta de disponibilidade, separado de ausência de cobertura confirmada. */
export function ProductDetailAvailabilityNotice({ pending, error, onRetry }: Readonly<AvailabilityNoticeProps>) {
  if (pending) return <p role="status" className="mt-4 text-sm text-brand-dark">Verificando disponibilidade do vendor do carrinho…</p>;
  if (!error) return null;
  return (
    <div role="alert" className="mt-4 text-sm text-brand-dark">
      <p>{error}</p>
      <button type="button" onClick={onRetry} className="mt-2 font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark">Tentar novamente</button>
    </div>
  );
}
