# PDF do portfólio em Assets

## Objetivo

Disponibilizar em `/admin/assets` o gerenciamento do PDF aberto pelo CTA “Conheça nosso portfólio”, sem criar uma segunda configuração para o mesmo arquivo.

## Decisão

Mover o `CatalogPdfManager` existente de `ConfigContent` para `AssetsContent`.

- Manter `/api/catalog` como URL pública consumida pelo botão.
- Manter `/api/admin/catalog-pdf` como proxy administrativo.
- Manter os endpoints WordPress `/papelito/v1/catalog-pdf` e `/papelito/v1/catalog-pdf-info`.
- Preservar upload de PDF, validação de extensão/MIME/assinatura/tamanho, restauração do padrão e fallback automático.
- Remover o gerenciador da tela de Config para evitar duas entradas administrativas.

## Fluxo de dados

O painel continuará carregando o snapshot via proxy administrativo com `cache: no-store`. O WordPress persiste somente o ID do attachment em `wp_options`; o endpoint público resolve o attachment personalizado e usa o PDF padrão quando ele estiver ausente ou indisponível. A versão de cache é incrementada após upload ou restauração.

## Faixa de avisos

Nenhuma alteração de conteúdo será necessária nesta tarefa. A migração `PAPELITO_DB_VERSION` já cria `papelito_home_promo_marquee` com seis mensagens padrão quando a option não existe. Configurações existentes não são sobrescritas; se a option estiver ausente durante uma implantação parcial, o fallback defensivo mantém as mensagens padrão.

## Testes

- Assets renderiza o gerenciador do PDF.
- Config não renderiza uma segunda instância.
- Upload, restauração e mensagens de erro do gerenciador existente permanecem cobertos.
- Executar Vitest direcionado, lint, build e `php -l` nos arquivos PHP envolvidos.
