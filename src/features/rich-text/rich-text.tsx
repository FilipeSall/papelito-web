import type { ResolvedRichTextNode } from "./types";

/**
 * Renderiza o conteúdo resolvido como elementos React.
 *
 * Nunca usa `dangerouslySetInnerHTML`: negrito e itálico são os únicos formatos suportados e
 * viram `<strong>`/`<em>` a partir de flags booleanas, então texto vindo do WordPress não
 * consegue introduzir markup.
 */
export function RichText({ nodes }: { nodes: ResolvedRichTextNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        const key = `${index}-${node.text}`;

        if (node.bold && node.italic) {
          return (
            <strong key={key}>
              <em>{node.text}</em>
            </strong>
          );
        }

        if (node.bold) {
          return <strong key={key}>{node.text}</strong>;
        }

        if (node.italic) {
          return <em key={key}>{node.text}</em>;
        }

        return <span key={key}>{node.text}</span>;
      })}
    </>
  );
}
