/**
 * Barra de copyright do footer.
 *
 * Componente atomico que exibe informacoes de copyright,
 * CNPJ e aviso de idade minima.
 *
 * @example
 * ```tsx
 * <FooterCopyright />
 * ```
 */
export function FooterCopyright() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
      <p className="text-xs leading-4 text-white/40">
        &copy; {currentYear} Papelito Brasil. Todos os direitos reservados.
      </p>
      <p className="text-xs leading-4 text-white/40">
        CNPJ: 00.000.000/0001-00 | Venda proibida para menores de 18 anos.
      </p>
    </div>
  );
}
