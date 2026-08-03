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
    <div className="flex min-h-[49px] flex-col items-start justify-between gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:pt-px">
      <p className="text-xs leading-4 text-white/40">
        &copy; {currentYear} Papelito Brasil. Todos os direitos reservados.
      </p>
      <p className="text-xs leading-4 text-white/40">
        CNPJ: 14.536.755/0001-10 | Venda proibida para menores de 18 anos.
      </p>
    </div>
  );
}
