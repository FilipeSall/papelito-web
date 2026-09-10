import Image from "next/image";

type IdentityRole = "customer" | "seller" | "administrator";

/** Marca amarela da Papelito. PNG e não o `.svg`: o otimizador do Next recusa SVG de `/public`. */
const PAPELITO_MARK = "/favicon-96x96.png";

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "?";

  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";

  return `${first}${last}`.toUpperCase();
}

/**
 * Superfícies do avatar de iniciais, sorteadas pelo nome.
 *
 * É o mecanismo do Gmail — a mesma pessoa tem sempre o mesmo fundo, e duas pessoas diferentes
 * tendem a ter fundos diferentes — mas no material da Papelito: papel e tinta, sem matiz nova.
 * O amarelo fica de fora porque é a marca da Papelito no crachá da conversa.
 */
const SURFACES = [
  "bg-white text-[#1a1a1a]",
  "bg-[#faf8f2] text-[#1a1a1a]",
  "bg-[#f7f2e7] text-[#1a1a1a]",
  "bg-[#1a1a1a] text-[#f5f1e8]",
] as const;

function surfaceFor(name: string) {
  let hash = 0;

  for (const char of name.trim().toLowerCase()) {
    hash = (hash * 31 + char.codePointAt(0)!) % 100_000;
  }

  return SURFACES[hash % SURFACES.length];
}

/**
 * Avatar de identidade da conversa: quadrado, borda dura, sem sombra nesse tamanho.
 *
 * Não há foto de usuário no chamado — por decisão de produto. Cliente e loja aparecem pelas
 * iniciais, e a Papelito pela marca. As iniciais são o que diferencia duas pessoas numa conversa
 * de três partes; dois ícones de pessoa idênticos não fariam isso.
 */
export function IdentityAvatar({
  name,
  role,
  size = 36,
}: Readonly<{ name: string; role: IdentityRole; size?: number }>) {
  const style = { height: `${size}px`, width: `${size}px` };

  if (role === "administrator") {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-none border-2 border-[#1a1a1a] bg-brand-yellow"
        style={style}
      >
        <Image alt="" height={size} priority={false} src={PAPELITO_MARK} width={size} />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-none border-2 border-[#1a1a1a] font-black uppercase leading-none ${surfaceFor(name)}`}
      style={{ ...style, fontSize: `${Math.round(size * 0.36)}px` }}
    >
      {initials(name)}
    </span>
  );
}
