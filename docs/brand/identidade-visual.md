# Identidade Visual Papelito — Guia para Interfaces Digitais

> **Nota sobre fontes:** Este documento combina (a) dados confirmados extraídos diretamente do codebase do projeto (`globals.css`, componentes React, decisões de design já implementadas) e (b) inferências visuais baseadas nas escolhas aplicadas pela equipe. Onde há inferência, isso está indicado explicitamente. Não há informações inventadas.
>
> **Aviso de homônimos:** Existe uma marca brasileira não relacionada chamada "Papelito Brasil" (papéis para fumar) que em 2025 também adotou paleta mostarda + preto + kraft. Este guia documenta exclusivamente o **marketplace B2B de papelaria e artigos escolares Papelito**, cujas decisões visuais são extraídas do próprio repositório.

---

## 1. Visão Geral da Identidade Visual

### Como a marca se apresenta

A Papelito é um **marketplace B2B de papelaria e artigos escolares** voltado para revendedores (vendors) que atendem compradores por CEP. A identidade visual rejeita o visual corporativo genérico de e-commerces SaaS e abraça uma estética **brasileira, urbana e artesanal**.

A interface deve lembrar **recortes de papel, cartazes colados na rua, stickers e materiais craft** — sem abrir mão de legibilidade e usabilidade.

### Personalidade visual

| Atributo | Descrição |
|---|---|
| **Ousado** | Bordas pretas grossas, sombras duras, contrastes fortes |
| **Brasileiro** | Amarelo como cor de identidade nacional; estética popular |
| **Manual** | Elementos irregulares, formas recortadas, losangos, diagonais |
| **Jovem** | Tipografia preta (`font-black`), caixa alta, energia visual |
| **Direto** | Microcopy sem rodeios, labels em uppercase com tracking generoso |

### Sensações que a identidade deve transmitir

- Confiança sem frieza corporativa
- Energia sem agressividade
- Brasileiro sem ser genérico
- Premium sem ser inacessível

### Palavras-chave

`ousado` · `brasileiro` · `craft` · `urbano` · `marcante` · `direto` · `jovem` · `manual` · `irreverente`

---

## 2. Cores

### Paleta oficial (extraída de `globals.css`)

| Token | Hex | Nome | Papel |
|---|---|---|---|
| `--color-brand-yellow` / `bg-brand-yellow` | `#ffe500` | Amarelo Papelito | Cor principal — identidade, CTAs, destaques |
| `--color-brand-dark` / `bg-brand-dark` | `#231f20` | Preto Papelito | Contraste máximo, fundos escuros, textos |
| `#faf8f2` | — | Off-white kraft | Fundo de modais e cards internos |
| `#fffdf6` | — | Branco amarelado | Variante mais clara de fundo (auth, legacy) |
| `#f9fafb` | `--color-bg-light` | Cinza neutro claro | Fundo de páginas neutras |
| `#1a1a1a` | — | Quase-preto admin | Variante mais fria do preto para admin panel |

### Paleta de texto (extraída de `globals.css`)

| Token | Hex | Uso |
|---|---|---|
| `--color-text-primary` | `#231f20` | Texto principal |
| `--color-text-secondary` | `#4a5565` | Texto secundário |
| `--color-text-tertiary` | `#6a7282` | Texto de apoio |
| `--color-text-muted` | `#99a1af` | Placeholder, texto apagado |
| `--color-text-faint` | `#d1d5dc` | Divisores, elementos fantasma |

### Cores de estado

| Uso | Hex | Token Tailwind |
|---|---|---|
| Erro / Destrutivo | `#c0392b` | `text-[#c0392b]` / `border-[#c0392b]` |
| Sucesso (banner) | `#ffe500` fundo + `#1a1a1a` texto | amarelo com preto |
| Info | off-white com borda preta | `bg-[#faf8f2] border-[#1a1a1a]` |

### Como usar cada cor

**Amarelo `#ffe500`**
- Fundo de botão primário (variante dark-bg)
- Texto de botão sobre fundo preto
- Faixa decorativa no topo de modais
- Losango decorativo de seção
- Sombra dura de botões importantes (`shadow-[3px_3px_0px_#ffe500]`)
- Fundo de banner de sucesso
- Hover de botões e elementos interativos
- NÃO usar como cor de texto sobre fundo branco (contraste insuficiente)

**Preto `#231f20` / `#1a1a1a`**
- Fundos de áreas escuras (auth panel lateral, headers escuros)
- Texto principal sobre fundos claros
- Bordas de todos os componentes no admin panel (2px sólido)
- Sombra dura de cards (`shadow-[8px_8px_0px_#1a1a1a]`)

**Off-white kraft `#faf8f2`**
- Fundo de modais
- Fundo de formulários administrativos
- Fundo de cards internos
- Deve transmitir a sensação de papel kraft levemente envelhecido

---

## 3. Tipografia

### Fonte principal (dado confirmado)

**Inter** — carregada via `--font-inter` (Next.js font optimization).

```css
--font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
```

### Estilo tipográfico

A Inter é usada de forma **maximalista no peso**: a marca privilegia `font-black` (900) para títulos, CTAs e labels — nunca light ou thin. O resultado é uma tipografia que parece **recortada e impressa**, próxima de cartazes e materiais gráficos urbanos.

### Escala tipográfica

| Token | Tamanho | Uso |
|---|---|---|
| `text-6xl` | 60px | Títulos hero |
| `text-5xl` | 48px | Títulos de seção grande |
| `text-4xl` | 36px | Títulos de página |
| `text-2xl` | 24px | Títulos de modal, headings secundários |
| `text-xl` | 20px | Subtítulos |
| `text-lg` | 18px | Corpo de texto principal |
| `text-base` | 16px | Texto padrão |
| `text-sm` | 14px | Texto auxiliar, inputs |
| `text-xs` | 12px | Microcopy, badges, labels pequenos |
| `text-[11px]` | 11px | Labels de campo em formulários |
| `text-[10px]` | 10px | Superlabels (ex: "Painel admin · criação direta") |

### Regras tipográficas por contexto

| Contexto | Peso | Case | Tracking | Exemplo |
|---|---|---|---|---|
| Título principal de modal/página | `font-black` | UPPERCASE | `tracking-tight` | `ADICIONAR VENDOR` |
| Subtítulo contextual (supra-título) | `font-black` | UPPERCASE | `tracking-[0.22em]` | `PAINEL ADMIN · CRIAÇÃO DIRETA` |
| Label de campo | `font-black` | UPPERCASE | `tracking-[0.18em]` | `E-MAIL *` |
| Título de seção interna | `font-black` | UPPERCASE | `tracking-[0.22em]` | `◆ DADOS COMERCIAIS` |
| CTA / Botão | `font-black` | UPPERCASE | `tracking-widest` | `CRIAR VENDOR` |
| Texto de corpo | `font-medium` | normal | `tracking-normal` | inputs, textos de apoio |
| Texto auxiliar/helper | `font-normal` | normal | — | placeholders, hints |

### Fontes alternativas sugeridas

Caso Inter não esteja disponível:
- `Montserrat` (peso 900 para títulos) — boa alternativa para o caráter urbano
- `Barlow Condensed` — para labels e microcopy em caps
- System font stack: `system-ui, -apple-system, sans-serif`

---

## 4. Logotipo e Elementos Gráficos

### Logotipo (inferência visual baseada no codebase)

O logotipo da Papelito não está disponível como arquivo de fonte/vetor neste repositório, mas os componentes revelam:

- Usado como imagem estática (`/images/` ou assets gerenciados)
- Aparece em contextos escuros (fundo `brand-dark`) com versão clara
- Aparece em contextos claros com versão escura

### Linguagem gráfica decorativa (dado confirmado no codebase)

A marca usa os seguintes elementos visuais recorrentes em suas interfaces:

**1. Losango rotacionado (`rotate-45`)**
```html
<span class="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
```
Usado como marcador de seção — o losango amarelo antes de títulos de seção cria uma identidade
visual de "sticker" ou "tag". No [sistema do corredor](#11-sistema-do-corredor--vitrine-pública)
esse marcador é redondo (`rounded-full`), não losango.

**2. Faixa de cor horizontal**
```html
<div class="h-2 w-full bg-brand-yellow" />
```
Faixa amarela no topo de modais — como uma fita adesiva colorida ou etiqueta.

**3. Clip-path diagonal (corte de papel)**
```css
.products-hero-cut {
  clip-path: polygon(0 0, 100% 0, 100% 78%, 86% 100%, 0 92%);
}
```
Seções de hero com cortes angulares nas bordas inferiores — evoca recorte manual de papel.

**4. Sombra dura (hard shadow)**
```css
shadow-[8px_8px_0px_#1a1a1a]  /* cards */
shadow-[3px_3px_0px_#ffe500]  /* botões */
shadow-[4px_4px_0px_#1a1a1a]  /* banners */
```
Sombras sem blur, offset fixo — estética de cartaz impresso, zine ou design gráfico analógico.

**5. Borda `2px` sólida preta**
```css
border-2 border-[#1a1a1a]
```
Todos os componentes interativos no admin panel usam bordas espessas e pretas sem arredondamento.

**6. Borda tracejada**
```css
border-2 border-dashed border-[#1a1a1a]
```
Usada em botões de ação secundária (ex: "Adicionar faixa de CEP") — evoca marcação de recorte.

**Como usar esses elementos em interfaces**
- O losango amarelo é um separador visual eficaz antes de títulos de seção
- A faixa de cor pode sinalizar o tipo de modal (amarelo = padrão, vermelho = destrutivo)
- Clip-paths diagonais são para heroes e seções de destaque — não usar em componentes pequenos
- Sombras duras substituem `box-shadow` com blur — nunca usar `drop-shadow` suave neste contexto
- Bordas tracejadas comunicam "adicionar", "opcional" ou "expansível"

---

## 5. Estilo de Layout

### Filosofia geral

O layout deve parecer **construído com materiais físicos**: papel colado, borda de cartaz, etiqueta recortada. Isso se traduz em:

- **Cantos retos** (`rounded-none`) nos componentes do admin/formulários — sem arredondamento nos elementos de ação
- **Cantos arredondados** (`rounded-full`) só nas telas de autenticação. A vitrine pública é reta: badge de card, botão e chip são quadrados
- **Bordas explícitas** e grossas — os limites dos elementos devem ser visíveis
- **Sombras duras** — offset sem blur, como carimbo no papel
- **Espaçamento generoso** dentro dos campos, mas compacto nos headers

### Grid e espaçamento

| Contexto | Grid |
|---|---|
| Formulários administrativos | 2–3 colunas (`md:grid-cols-2`, `md:grid-cols-3`) |
| Página de catálogo | `max-w-7xl mx-auto px-6 md:px-12` |
| Modal de criação | `max-w-5xl` centralizado |
| Seções internas de form | `space-y-6` entre seções, `gap-4` entre campos |

### Hierarquia visual dos componentes

```
Página
└── Modal / Card principal
    ├── Faixa decorativa (2px amarelo)
    ├── Header (título em caps + botão fechar)
    ├── Body
    │   └── Section (losango + título caps)
    │       └── Grid de campos
    │           └── Field (label caps + input borda preta)
    └── Footer (botões: cancelar + submit)
```

### Diferença entre os três contextos

A vitrine pública **deixou de ser o contexto sutil**. Ela adota a mesma linguagem gráfica do
admin, no [sistema do corredor](#11-sistema-do-corredor--vitrine-pública). Quem continua
elegante e escuro é só o contexto de **autenticação** (`/entrar`, `/cadastro`, recuperação de
senha), que ainda não foi migrado.

| | Vitrine pública | Autenticação | Admin / Vendor |
|---|---|---|---|
| Fundo | `#faf8f2` kraft, com faixas pretas e amarelas | `bg-brand-dark` (painel lateral) | `bg-[#faf8f2]` off-white kraft |
| Botão primário | bloco reto amarelo ou preto, sem raio | `rounded-full bg-brand-yellow text-brand-dark` | `border-2 border-black bg-black text-yellow` |
| Inputs | ainda não migrados | `rounded-xl border border-white/20 bg-white/10` | `rounded-none border-2 border-black` |
| Tom | Ousado, gráfico, marcante | Sutil, elegante, escuro | Ousado, gráfico, marcante |

---

## 6. Tom de Voz Visual e Textual

### Princípios

- **Direto ao ponto** — sem palavras desnecessárias
- **Informal mas profissional** — não é startup SaaS, mas não é bate-papo
- **Imperativo de ação** — verbos no imperativo em botões e chamadas
- **Sem jargões técnicos** expostos ao usuário final

### Microcopy por contexto

**Botões primários**
```
✓ CRIAR VENDOR
✓ SALVAR ALTERAÇÕES
✓ CONFIRMAR PEDIDO
✓ ENTRAR
✗ Submit
✗ OK
✗ Confirmar Operação
```

**Botões secundários**
```
✓ Cancelar
✓ Voltar
✓ Fechar
✗ Descartar alterações
✗ Não confirmar
```

**Botões de adição**
```
✓ + Nova faixa de CEP
✓ + Adicionar item
✗ Clique aqui para adicionar
```

**Labels de campo**
```
✓ E-MAIL *
✓ CNPJ *
✓ CEP DA LOJA
✗ Endereço de Email do Usuário
✗ Número do CNPJ (obrigatório)
```

**Mensagens de erro**
```
✓ ⚠ Informe um e-mail válido.
✓ ⚠ CEP não encontrado. Verifique e tente novamente.
✓ ⚠ CNPJ já cadastrado.
✗ Erro: o campo de email está em formato inválido (422).
✗ Não foi possível completar sua solicitação neste momento.
```

**Mensagens de sucesso**
```
✓ ✓ Vendor criado: Papelaria XYZ
✓ ✓ Cadastro salvo com sucesso!
✗ Operação concluída com êxito.
```

**Textos auxiliares (helper text)**
```
✓ Use o CEP para preencher o endereço automaticamente.
✓ Pode ser ajustado manualmente se a busca vier incompleta.
✗ Este campo será preenchido automaticamente pelo sistema de geolocalização integrado.
```

---

## 7. Aplicação em Formulários

### Campos (inputs)

```css
/* Estado normal */
border: 2px solid #1a1a1a;
border-radius: 0;           /* sem arredondamento */
background: white;
height: 44px;               /* h-11 */
padding: 0 12px;
font-size: 14px;            /* text-sm */
color: #1a1a1a;

/* Estado de foco */
border-color: #1a1a1a;      /* sem mudança de cor, apenas ring */
outline: none;
ring: none;                 /* sem anel de foco colorido */

/* Estado de erro */
border-color: #c0392b;      /* vermelho */
```

### Labels

```css
font-size: 10px;            /* text-[10px] */
font-weight: 900;           /* font-black */
text-transform: uppercase;
letter-spacing: 0.18em;     /* tracking-[0.18em] */
color: #1a1a1a;
```

### Placeholders

```css
color: rgba(26, 26, 26, 0.4);  /* #1a1a1a/40 */
font-weight: normal;
```

### Mensagens de erro (inline)

```css
font-size: 11px;
font-weight: 600;           /* font-semibold */
color: #c0392b;
margin-top: 4px;
display: block;
```

Prefixar com `⚠` quando o campo está em contexto isolado.

### Mensagens de erro (nível de formulário)

```css
border: 2px solid #c0392b;
background: rgba(192, 57, 43, 0.1);
padding: 12px 16px;
/* sem border-radius */
font-size: 14px;
font-weight: 700;           /* font-bold */
color: #c0392b;
```

### Títulos de seção dentro do formulário

```html
<div class="flex items-center gap-2">
  <span class="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
  <h4 class="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
    DADOS COMERCIAIS
  </h4>
</div>
```

### Estado de foco acessível

Como as bordas pretas já têm alto contraste, o foco pode ser reforçado com outline de cor amarela para usuários de teclado:

```css
:focus-visible {
  outline: 2px solid #ffe500;
  outline-offset: 2px;
}
```

### Botão primário (em formulário admin)

```css
border: 2px solid #1a1a1a;
background: #1a1a1a;
color: #ffe500;
height: 40px;
padding: 0 20px;
font-size: 12px;
font-weight: 900;
text-transform: uppercase;
letter-spacing: 0.1em;
box-shadow: 3px 3px 0px #ffe500;
border-radius: 0;
transition: box-shadow 0.15s ease;

/* Hover */
box-shadow: 1px 1px 0px #ffe500;

/* Active / Press */
box-shadow: none;

/* Disabled */
opacity: 0.6;
cursor: not-allowed;
```

### Botão secundário (em formulário admin)

```css
border: 2px solid #1a1a1a;
background: white;
color: #1a1a1a;
/* demais estilos iguais ao primário, sem sombra */

/* Hover */
background: #1a1a1a;
color: white;
```

### Card do formulário (modal)

```css
background: #faf8f2;
border: 2px solid #1a1a1a;
border-radius: 0;
box-shadow: 8px 8px 0px #1a1a1a;
```

---

## 8. Componentes Digitais

### Botões

| Variante | Fundo | Texto | Borda | Sombra | Border-radius |
|---|---|---|---|---|---|
| **Primário (admin)** | `#1a1a1a` | `#ffe500` | `2px #1a1a1a` | `3px 3px 0 #ffe500` | `0` |
| **Primário (público)** | `#ffe500` | `#231f20` | nenhuma | nenhuma | `full` (pill) |
| **Secundário (admin)** | `white` | `#1a1a1a` | `2px #1a1a1a` | nenhuma | `0` |
| **Ghost** | `transparent` | `#ffe500` | nenhuma | nenhuma | — |
| **Destrutivo** | `white` | `#c0392b` | `2px #1a1a1a` | — | `0` |
| **Adicionar (dashed)** | `white` | `#1a1a1a` | `2px dashed #1a1a1a` | nenhuma | `0` |

### Inputs

- Borda `2px solid #1a1a1a`, `rounded-none`, altura `h-11` (44px)
- Contexto público: `rounded-xl border border-white/20 bg-white/10 text-white` (dark panel)
- Foco: manter borda preta, adicionar `outline: 2px solid #ffe500` para acessibilidade

### Selects (custom)

Mesmas regras dos inputs. Dropdown com borda `2px solid #1a1a1a` e `box-shadow: 4px 4px 0px #1a1a1a`.

### Checkboxes e Radio Buttons

- Borda `2px solid #1a1a1a`
- Checked: fundo `#1a1a1a`, check `#ffe500`
- Label em uppercase, `font-semibold`, tracking generoso

### Cards

| Tipo | Fundo | Borda | Sombra |
|---|---|---|---|
| **Admin / Form** | `#faf8f2` | `2px solid #1a1a1a` | `8px 8px 0 #1a1a1a` |
| **Métrica / KPI** | `white` | `1px solid #1a1a1a/20` | nenhuma ou leve |
| **Sucesso** | `#ffe500` | `2px solid #1a1a1a` | `4px 4px 0 #1a1a1a` |
| **Erro** | `#c0392b/10` | `2px solid #c0392b` | nenhuma |

### Badges e Status

```css
/* Aprovado */
background: #1a1a1a; color: #ffe500; padding: 2px 8px; font-black; uppercase;

/* Pendente */
background: #faf8f2; color: #1a1a1a; border: 1px solid #1a1a1a;

/* Rejeitado */
background: #c0392b; color: white;
```

### Alertas

- **Erro:** borda esquerda `4px solid #c0392b`, fundo `#c0392b/10`
- **Sucesso:** fundo `#ffe500`, borda `2px solid #1a1a1a`, sombra dura preta
- **Info:** fundo `#faf8f2`, borda `2px solid #1a1a1a/40`

### Modais

```
┌─ [faixa amarela 8px] ──────────────────────────┐
│ TÍTULO EM CAPS FONT-BLACK           [✕]         │
│ subtítulo contextual em caps/muted              │
├─────────────────────────────────────────────────│
│                                                 │
│  ◆ SEÇÃO                                        │
│  [campo] [campo] [campo]                        │
│                                                 │
│  ◆ SEÇÃO                                        │
│  [campo] [campo]                                │
│                                                 │
├─────────────────────────────────────────────────│
│                    [CANCELAR] [CRIAR VENDOR ▶]  │
└─────────────────────────────────────────────────┘
```

Borda `2px solid #1a1a1a`, sombra `8px 8px 0 #1a1a1a`, fundo `#faf8f2`, sem `border-radius`.

### Headers

- **Sempre escuros**, público e privado: `bg-brand-dark` com régua amarela de 2px embaixo.
- O logo é sempre a **versão clara** (`/images/marketplacelogo.svg`, slot `privateHeader`).
  A versão escura (`logo.svg`) só serve em fundo claro e hoje não é usada em header nenhum.
- Nav em `font-black` uppercase com `tracking-[0.18em]`, branca, amarela no hover e no ativo.
- Item ativo e hover recebem um **traço amarelo desenhado com rough.js** (`MenuUnderline`),
  riscado da esquerda para a direita.
- Ações (carrinho, sino, perfil) sem fundo, ícone branco; o botão de perfil é bloco reto amarelo.
- Sticky com `z-index` alto.

### Seções de destaque (hero)

- Clip-path diagonal: `polygon(0 0, 100% 0, 100% 78%, 86% 100%, 0 92%)`
- Título grande em caps + sublinhado amarelo antes do texto principal
- Overlay escuro `bg-black/30` sobre imagem

---

## 9. Boas Práticas e Restrições

### ✅ Faça

- Use `font-black` (900) para títulos, labels e CTAs — é o peso da identidade
- Mantenha bordas `2px solid` pretas em componentes interativos do admin
- Use sombras duras (`shadow-[Xpx_Ypx_0px_color]`) sem blur
- Use amarelo `#ffe500` com texto preto `#1a1a1a` — esse é o par principal
- Escreva labels em UPPERCASE com `tracking-[0.18em]` ou mais
- Use o losango amarelo (`rotate-45 bg-brand-yellow`) como marcador de seção fora do corredor;
  dentro dele o marcador é um ponto redondo
- Mantenha cantos retos (`rounded-none`) em formulários e admin
- `rounded-full` é para as telas de autenticação e para o marcador do corredor — chapa, card e
  campo continuam retos em toda a vitrine e no admin

### ❌ Evite

- `border-radius` em formulários administrativos
- Sombras com blur (`box-shadow: 0 4px 12px rgba(0,0,0,0.1)`) — parecem genéricas
- Amarelo `#ffe500` como cor de texto sobre fundo branco (contraste 1.2:1 — inacessível)
- Tipografia `font-light` ou `font-thin` — incompatível com a personalidade
- Gradientes — a marca usa cores sólidas e planas
- Bordas `1px` finas — preferir `2px` para manter o peso visual
- Visual "SaaS genérico": cantos super arredondados, tons pastéis, micro-animações excessivas
- Texto de erro genérico como "Erro ao processar solicitação"

### ⚠️ Cuidados de acessibilidade

| Par de cores | Contraste | Status |
|---|---|---|
| `#ffe500` texto sobre `#1a1a1a` fundo | ~12.6:1 | ✅ AAA |
| `#1a1a1a` texto sobre `#ffe500` fundo | ~12.6:1 | ✅ AAA |
| `#1a1a1a` texto sobre `#faf8f2` fundo | ~17.5:1 | ✅ AAA |
| `#ffe500` texto sobre `white` | ~1.2:1 | ❌ Não usar |
| `#ffe500` texto sobre `#faf8f2` | ~1.3:1 | ❌ Não usar |
| `white` texto sobre `#231f20` | ~16:1 | ✅ AAA |

**Foco de teclado:** Todos os elementos interativos devem ter `focus-visible` com `outline: 2px solid #ffe500; outline-offset: 2px`.

**Responsividade:**
- Formulários: `grid-cols-1` em mobile, `md:grid-cols-2` ou `md:grid-cols-3` em desktop
- Modais: `w-full` em mobile com `px-4`, `max-w-5xl` em desktop
- Sombras duras podem ser reduzidas em mobile (`shadow-[4px_4px_0px_...]`)

---

## 10. Exemplo Prático — Formulário de Cadastro

### Direção visual para o formulário de cadastro de revendedor

**Fundo da página**
- `bg-[#faf8f2]` ou `bg-white` com textura kraft muito sutil
- Sem padrões de fundo distrativas

**Card principal**
```css
background: #faf8f2;
border: 2px solid #1a1a1a;
border-radius: 0;
box-shadow: 8px 8px 0px #1a1a1a;
max-width: 960px;
margin: auto;
```

**Faixa decorativa no topo**
```html
<div style="height: 8px; background: #ffe500; width: 100%;" />
```

**Título**
```html
<h1 style="
  font-size: 28px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  color: #1a1a1a;
">CADASTRO DE REVENDEDOR</h1>
<p style="
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: rgba(26,26,26,0.5);
">Papelito · Parceiro comercial</p>
```

**Campos**
```html
<label>
  <span style="
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #1a1a1a;
  ">NOME DA LOJA *</span>
  <input style="
    border: 2px solid #1a1a1a;
    border-radius: 0;
    height: 44px;
    padding: 0 12px;
    font-size: 14px;
    width: 100%;
    background: white;
  " placeholder="Ex: Papelaria Central" />
</label>
```

**Botão principal**
```html
<button style="
  background: #1a1a1a;
  color: #ffe500;
  border: 2px solid #1a1a1a;
  height: 44px;
  padding: 0 24px;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: 3px 3px 0px #ffe500;
  cursor: pointer;
">ENVIAR CADASTRO</button>
```

**Mensagem de erro**
```html
<div style="
  border: 2px solid #c0392b;
  background: rgba(192,57,43,0.1);
  padding: 12px 16px;
">
  <p style="font-size: 14px; font-weight: 700; color: #c0392b;">
    ⚠ Informe um CNPJ válido.
  </p>
</div>
```

**Banner de sucesso**
```html
<div style="
  background: #ffe500;
  border: 2px solid #1a1a1a;
  box-shadow: 4px 4px 0px #1a1a1a;
  padding: 12px 16px;
">
  <span style="font-weight: 900; text-transform: uppercase; color: #1a1a1a;">
    ✓ Cadastro enviado! Em breve entraremos em contato.
  </span>
</div>
```

**Comportamento visual geral**
- Hover em botões: sombra dura colapsa (`3px 3px → 1px 1px`)
- Press/active em botões: sombra some (`1px 1px → 0`)
- Sem animações de entrada excessivas — máximo `opacity` + `translateY(4px)` suave
- Campos em foco: outline `2px solid #ffe500` (acessibilidade de teclado)
- A experiência deve parecer **rápida, confiante e sem floreios**

---

## 11. Sistema do corredor — vitrine pública

Sistema aplicado primeiro na home (`app/(public)/page.tsx`) e feito para ser levado às demais
páginas públicas. A tese: **a vitrine é o corredor de uma papelaria**. Cada família de produto
corre na horizontal sob uma etiqueta de gôndola que carrega dado, não enfeite.

### Fundos e ritmo

O corredor alterna densidade de propósito. Uma passagem densa paga uma clara.

| Fundo | Papel |
|---|---|
| `#faf8f2` kraft | chão da página — o padrão |
| `#231f20` preto | faixa de ênfase: régua de condições, campanha |
| `#ffe500` amarelo | fecho e convite: etiqueta secundária, banner de parceiro |
| `white` | face de card, sobre o chão kraft |

Não empilhe duas faixas do mesmo peso. Se a seção anterior era preta, a próxima é kraft.

### Recortes de papel

Dois utilitários em `globals.css`, cada um com um trabalho:

| Classe | Forma | Onde usar |
|---|---|---|
| `.aisle-cut` | diagonal longa e rasa na base | folhas grandes: hero, foto emoldurada |
| `.tag-cut` | lado direito inclinado, sutil | chips e etiquetas pequenas |

A chapa da etiqueta de gôndola não usa recorte: ela repete o raio irregular do card de produto
(`rounded-[2px_5px_12px_4px]`), que arredonda cada ponta de um jeito diferente e lê como canto
amassado, não como cartão de software.

O `.tag-cut` repete a inclinação da placa branca do logo **PDV Perfeito** — é de lá que ele vem.

**`clip-path` mata a borda CSS na diagonal.** Para uma chapa recortada *com* moldura visível,
empilhe duas camadas recortadas: a de fora com a cor da moldura e `p-0.5`, a de dentro com o
fundo — a borda simples desapareceria no corte.

### Componentes

- **`ShelfLabel`** (`src/components/ui/shelf-label.tsx`) — etiqueta de gôndola. Tons `dark` e
  `yellow`. Abre sempre com um ponto redondo antes do título. Recebe `facts` opcional, uma faixa
  densa de informação real que colide de propósito com o campo de produto quase vazio abaixo;
  sem `facts`, a etiqueta é só o título. O separador entre fatos é o mesmo ponto redondo, e só
  aparece a partir do segundo fato. Aceita `href`/`linkText` e um `aside` para conteúdo próprio da fileira
  (cronômetro, contador).
- **`Shelf`** (`src/components/ui/shelf.tsx`) — trilho horizontal com encaixe nativo
  (`.shelf-rail`), setas sobrepostas às pontas e régua embaixo. `rule` escolhe a régua:
  `straight` (padrão) ou `none` — a campanha e as novidades dispensam a régua; só "Nossos
  produtos" ainda fecha a fileira com a barra amarela.
- **`ScribbleRule`** (`src/components/ui/scribble-rule.tsx`) — régua rough.js, riscada quando
  entra na tela. Ela usa duas passadas finas em largura real: perceptivelmente manual, mas sem
  virar faixa pesada. Também pode ser vertical para costurar células contínuas; aplique-a em
  amarelo translúcido, sem voltar a usar `gap-px` como separador reto. Não estique
  `MenuUnderline` para substituir uma régua longa.
- **`BrandArrowIcon`** (`src/components/ui/icons/`) — a seta da marca, o mesmo traço à mão do
  site institucional. **Use esta, nunca uma seta geométrica**, em CTA e navegação de carrossel.

### Cards de produto — chapa impressa

Os cards das prateleiras da home não usam `box-shadow`. Cada unidade tem duas camadas: a
**face** branca, com borda de 2px e assimetria muito discreta nos cantos, e uma **chapa** sólida
atrás dela. A chapa é uma camada sem interação, levemente girada (`1.2deg`), deslocada 6px e com
contorno próprio (`polygon(1% 2%, 98% 0, 100% 95%, 94% 100%, 0 97%)`). É esse descompasso que
faz a sombra parecer impressão/serigrafia, não uma cópia geométrica do card.

- Chão kraft: face branca + borda e chapa `#231f20`.
- Faixa preta: face branca + borda e chapa `#ffe500`.
- No hover, o card sobe só na vertical e a chapa vai de 6px para 8px de offset. Não escale nem
  desloque horizontalmente o card — o trilho corta esse gesto.
- Cards compactos reduzem o offset para 4px → 6px; mantêm a mesma linguagem.
- Em `prefers-reduced-motion`, card e chapa ficam imóveis.

As setas do `Shelf` pertencem à família dos chips de **Explore por coleção**: contorno de 2px,
leve inclinação oposta (`-1.4deg` para voltar, `0.9deg` para avançar), ícone `BrandArrowIcon` e
inversão preto/amarelo no hover. Em faixa preta, já nascem preto/amarelo com chapa amarela. Foco
de teclado usa outline amarelo com offset de 3px, em ambos os tons.

### Régua de condições

Os benefícios formam uma faixa preta contínua, com o ícone amarelo alinhado ao início do título —
nunca centralizado em relação a uma descrição que possa quebrar em duas linhas. O respiro inferior
é menor que o superior (`pb-4`, `md:pb-5`) para devolver peso visual ao hero. Entre células, use
`ScribbleRule` em amarelo translúcido: horizontal em uma ou duas colunas e vertical em quatro.
É uma costura discreta da faixa, não uma borda grossa nem uma terceira régua de destaque.

### Movimento

- **Um momento autoral por superfície.** Na home é `.animate-sheet-settle`: a sombra amarela da
  folha do topo cresce uma vez no carregamento, partindo de um estado já visível.
- **Pressionar** um botão encolhe a sombra dura (`3px → 1px`) e afunda 1px. Nada de escala.
- **Hover em card de trilho é só vertical.** Ver a armadilha do encaixe, abaixo.
- **Seta** gira ~15° e desliza no hover, em 300ms.
- Tudo que anima respeita `prefers-reduced-motion` — e nesse modo o traço aparece **pronto**,
  nunca ausente.

### Superfícies do navegador

Já tematizadas globalmente em `globals.css`, não repita por componente: `::selection`,
`caret-color`, `scrollbar-color`, `:focus-visible`, `text-underline-offset` e
`[data-numeric]` (numerais tabulares para preço, contagem e prazo alinharem na coluna).
`button`, `[role="button"]`, `summary` e `label[for]` recebem `cursor: pointer` — o Preflight
do Tailwind 4 deixou de fazer isso.

### Armadilhas verificadas

Cada uma custou uma rodada de depuração. Não as redescubra.

- **`scroll-snap` encosta o primeiro card na borda do recorte.** O trilho tem
  `overflow-x`, que corta no limite do padding, e o encaixe posiciona o primeiro item
  exatamente ali. Qualquer `translate` lateral no hover é cortado, por mais folga que se dê.
  Por isso o card levanta na vertical.
- **Passo de rolagem tem que ser múltiplo exato do card.** Com encaixe obrigatório, um passo
  quebrado cai entre dois pontos e o navegador reancora onde quer — o clique parece não
  funcionar. `Shelf` calcula `pitch × cards`.
- **`MenuUnderline` não serve para régua longa.** Ele usa `pathLength="1"` num viewBox fixo de
  120px com `preserveAspectRatio="none"`; esticado ~9×, a conta do `stroke-dasharray` se perde
  e o traço sai picotado. Para larguras grandes use `ScribbleRule`, que gera o traço na largura
  real em pixels.
- **Ícone claro sobre chapa clara desaparece.** Os ícones de coleção são arte clara sobre
  transparente: em placa kraft precisam de ladrilho preto atrás.
- **Ao capturar evidência, role a página inteira antes.** Imagens abaixo da dobra são
  `loading="lazy"` e `captureBeyondViewport` não dispara o carregamento — o print mostra
  buracos que não existem.

### Ao levar o sistema para outra página

1. Chão kraft; faixas pretas e amarelas só onde o ritmo pedir.
2. Toda seção de produto abre com `ShelfLabel` e corre em `Shelf`. Sem cabeçalho próprio.
3. Os `facts` da etiqueta são **dado real** — contagem, condição, alcance. Se não houver dado,
   uma linha curta de marketing verdadeira; nunca número inventado.
4. Card em fundo claro: borda preta 2px e sombra dura preta. Em fundo preto, `onDark` — moldura
   e sombra amarelas, porque as pretas somem.
5. `AddToCartButton` com `variant="collection"`.
6. Sem emoji fazendo papel de ícone, sem sobretítulo decorativo, sem gradiente, sem blur.

---

*Última atualização: rebranding da vitrine pública, setembro de 2026 — seção 11 e correções nas
seções 5 e 8. O restante foi extraído do codebase em junho de 2026.*
*Para dúvidas sobre decisões de design, consultar os commits de `vendor-create-launcher.tsx` e `globals.css`.*
