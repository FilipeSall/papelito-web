type RevendedorFormRowProps = {
  children: React.ReactNode;
};

/**
 * Cria a grade de duas colunas usada nas linhas compactas do formulario.
 */
export function RevendedorFormRow({ children }: RevendedorFormRowProps) {
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>;
}
