import Link from "next/link";

/**
 * Icone de casa (Home) para o botao "Ir para o Inicio"
 */
function HomeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M2 6L8 1.33333L14 6V13.3333C14 13.687 13.8595 14.0261 13.6095 14.2761C13.3594 14.5262 13.0203 14.6667 12.6667 14.6667H3.33333C2.97971 14.6667 2.64057 14.5262 2.39052 14.2761C2.14048 14.0261 2 13.687 2 13.3333V6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 14.6667V8H10V14.6667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Icone de loja (Store) para o botao "Ver Produtos"
 */
function StoreIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M4 8V14H12V8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 5.33333L3.33333 2H12.6667L14 5.33333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 5.33333C2 6.06971 2.29286 6.77581 2.81447 7.29742C3.33608 7.81903 4.04218 8.11189 4.77855 8.11189C5.51493 8.11189 6.22103 7.81903 6.74264 7.29742C7.26425 6.77581 7.55711 6.06971 7.55711 5.33333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.55713 5.33333C7.55713 6.06971 7.84999 6.77581 8.3716 7.29742C8.89321 7.81903 9.59931 8.11189 10.3357 8.11189C11.0721 8.11189 11.7782 7.81903 12.2998 7.29742C12.8214 6.77581 13.1143 6.06971 13.1143 5.33333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Circulo decorativo com efeito de opacidade
 */
function DecorativeCircle({
  size,
  className,
}: Readonly<{
  size: number;
  className?: string;
}>) {
  return (
    <div
      className={`absolute rounded-full bg-brand-yellow opacity-5 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Pagina 404 - Nao Encontrada
 *
 * Design baseado no Figma com:
 * - Fundo escuro (brand-dark)
 * - Circulos decorativos amarelos
 * - Numero 404 grande em amarelo
 * - Badge "PAGINA NAO ENCONTRADA"
 * - Botoes de navegacao
 * - Links rapidos
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-brand-dark flex flex-col items-center justify-center relative overflow-hidden px-6 py-12">
      {/* Circulos decorativos */}
      <DecorativeCircle
        size={128}
        className="top-20 left-10 hidden md:block"
      />
      <DecorativeCircle
        size={192}
        className="bottom-20 right-10 hidden lg:block"
      />
      <DecorativeCircle
        size={80}
        className="top-1/2 left-1/4 hidden md:block"
      />

      {/* Conteudo central */}
      <div className="flex flex-col items-center text-center max-w-lg z-10">
        {/* Badge PAPELITO */}
        <div className="bg-brand-yellow rounded-xl px-6 py-2 mb-8">
          <span className="font-black text-brand-dark text-lg tracking-wide uppercase">
            PAPELITO
          </span>
        </div>

        {/* 404 com badge sobreposto */}
        <div className="relative mb-8">
          <h1 className="text-[120px] sm:text-[160px] md:text-[200px] font-black text-brand-yellow leading-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-brand-yellow rounded-full px-5 py-2">
              <span className="font-black text-brand-dark text-xs sm:text-sm tracking-wide uppercase whitespace-nowrap">
                Página não encontrada
              </span>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <p className="text-white/60 text-base mb-2">
          Ops! Parece que a página que você buscou se perdeu em algum lugar.
        </p>
        <p className="text-white/40 text-sm mb-10">
          Mas não se preocupe, temos muito mais para você explorar!
        </p>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-10">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-3 bg-brand-yellow text-brand-dark font-black text-sm uppercase tracking-tight rounded-full px-8 py-4 hover:bg-yellow-400 transition-colors"
          >
            <HomeIcon />
            Ir para o Inicio
          </Link>
          <Link
            href="/produtos"
            className="inline-flex items-center justify-center gap-3 border border-white/20 text-white font-black text-sm uppercase tracking-tight rounded-full px-8 py-4 hover:bg-white/10 transition-colors"
          >
            <StoreIcon />
            Ver Produtos
          </Link>
        </div>

        {/* Links rapidos */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-white/40 text-sm">
          <Link href="/produtos" className="hover:text-white/60 transition-colors">
            Loja
          </Link>
          <Link href="/perfil" className="hover:text-white/60 transition-colors">
            Meu Perfil
          </Link>
          <Link href="/carrinho" className="hover:text-white/60 transition-colors">
            Carrinho
          </Link>
          <Link href="/perfil" className="hover:text-white/60 transition-colors">
            Pedidos
          </Link>
        </div>
      </div>
    </main>
  );
}
