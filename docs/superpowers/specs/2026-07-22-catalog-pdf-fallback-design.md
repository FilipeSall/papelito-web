# Catálogo PDF administrável com fallback

## Contexto

O link "Conheça nosso portfólio" da página `/revendedor` abre `/api/catalog`. A implementação anterior lia um arquivo situado em `~/Downloads`, portanto não era portável para build ou produção. O PDF oficial já existe no repositório em `public/pdf/catalogo-papelito.pdf` e no host público em `https://papelitobrasil.com/pdf/catalogo-papelito.pdf`.

O WordPress já possuía endpoints para cadastrar um anexo, mas retornava 404 quando não havia catálogo e apagava o arquivo anterior antes de confirmar que o novo upload foi salvo. Não havia interface no painel Next nem fallback se o anexo se tornasse indisponível ou inválido.

## Objetivos

- Usar `public/pdf/catalogo-papelito.pdf` como catálogo padrão no desenvolvimento e no build do frontend.
- Manter a mesma cópia no host público de produção.
- Permitir que administradores troquem o catálogo a qualquer momento pelo painel administrativo Next.
- Salvar o catálogo personalizado na Biblioteca de Mídia do WordPress.
- Servir sempre um PDF válido em `/api/catalog`: tentar o personalizado e recuar automaticamente ao padrão se ele estiver ausente, não puder ser lido, retornar outro tipo de conteúdo ou não tiver a assinatura PDF.
- Permitir restaurar o padrão explicitamente pelo painel.

## Fora de escopo

- Alterar a home pública, a listagem de produtos ou o fluxo de disponibilidade regional.
- Tornar o PDF padrão editável no WordPress.
- Preservar versões antigas de uploads personalizados. Ao substituir ou restaurar o padrão, o anexo personalizado anterior será excluído para evitar arquivos públicos obsoletos.

## Arquitetura

### Fonte padrão e resolução no frontend

O arquivo padrão será empacotado em `papelito-web/public/pdf/catalogo-papelito.pdf`. A rota dinâmica `GET /api/catalog` delegará a resolução a um módulo server-only.

Esse módulo consulta `GET /wp-json/papelito/v1/catalog-pdf-info`. Quando houver um catálogo personalizado ativo, baixa a URL do anexo, exige `Content-Type: application/pdf` e a assinatura `%PDF-`. Qualquer falha de rede, HTTP, tipo ou assinatura ignora o anexo e lê o arquivo padrão do projeto. Só responderá erro controlado caso o próprio fallback não exista ou esteja inválido.

Assim, o botão público continua apontando para uma única URL estável e nunca depende de um caminho de máquina local ou de um anexo WordPress saudável. A rota permanece dinâmica; não altera ISR ou cache da home.

### WordPress

O plugin manterá a opção `papelito_catalog_pdf_id` apenas para o override. O endpoint de informações retornará o catálogo configurado, o catálogo ativo e o padrão. Um anexo inexistente, vazio ou não legível deixa de ser ativo e o snapshot aponta para o padrão.

O upload e a restauração exigem `manage_options`. Uploads aceitam somente `.pdf`, com MIME de PDF, assinatura `%PDF-`, conteúdo não vazio e máximo de 15 MB. O novo anexo é criado e verificado antes de substituir a opção; se essa operação falhar, o catálogo anterior permanece ativo. Ao concluir uma substituição ou restauração, a versão de cache é incrementada e o anexo anterior é removido.

O contrato REST será:

- `GET /papelito/v1/catalog-pdf-info`: público; responde `200` com `activeCatalog`, `configuredCatalog`, `defaultCatalog`, `cacheVersion` e `issues`. Cada catálogo contém `source` (`custom` ou `default`), `id`, `url`, `filename` e `isAvailable`.
- `GET /papelito/v1/catalog-pdf`: público; transmite apenas um override ativo e saudável; quando o padrão está ativo, responde com o snapshot JSON. O público final usa `/api/catalog`, não esse endpoint.
- `POST /papelito/v1/catalog-pdf`: requer `manage_options`; recebe `multipart/form-data` com o campo obrigatório `file`; responde `201` com o snapshot atualizado. Validações retornam `400`, `413`, `415` ou `422`; falhas de armazenamento retornam `500`.
- `DELETE /papelito/v1/catalog-pdf`: requer `manage_options`; remove o override, restaura o padrão e responde `200` com o snapshot atualizado.

O proxy Next usa os mesmos caminhos: `GET`, `POST` e `DELETE /api/admin/catalog-pdf`. Ele não expõe o JWT ao browser e conserva os status e a mensagem de erro do WordPress.

### Painel administrativo

Uma seção em Configurações mostra o catálogo ativo, sua origem, uma prévia e avisos de indisponibilidade. O administrador pode enviar um PDF de até 15 MB ou restaurar o padrão. O browser fala somente com `app/api/admin/catalog-pdf`; essa rota exige a sessão de administrador e encaminha o JWT ao WordPress. A validação é repetida no browser, no proxy Next e no WordPress.

Tanto "Abrir" quanto "Prévia" apontam para `/api/catalog`, para que a gestão também exercite a mesma validação e o mesmo fallback recebidos pelo público.

### Cache e atualização

`/api/catalog` será `no-store` no navegador e na CDN. Assim, a troca ou restauração feita pelo admin fica visível na próxima abertura do link, sem esperar TTL. A versão retornada pelo WordPress é diagnóstica e permite futura observabilidade; não é usada como uma camada extra de cache pelo frontend. O arquivo padrão estático pode continuar cacheado em seu próprio URL, mas o público não o acessa diretamente pelo CTA.

## Fluxo de falha

1. Sem override no WordPress: `/api/catalog` entrega o PDF padrão.
2. Override saudável: `/api/catalog` entrega o anexo personalizado.
3. Override apagado, inacessível, com HTML, MIME incorreto ou bytes sem assinatura PDF: `/api/catalog` entrega o padrão.
4. Falha do endpoint de informações WordPress: `/api/catalog` entrega o padrão.
5. Fallback ausente ou inválido: `/api/catalog` retorna HTTP 503 e JSON controlado, sem simular um PDF.

## Testes e validação

- Vitest para catálogo personalizado saudável, endpoint WordPress ausente, arquivo remoto inválido, MIME incorreto, fallback válido e fallback corrompido.
- Teste de rota Next garantindo PDF inline e erro JSON controlado.
- Teste PHP standalone cobrindo padrão inicial, upload válido, anexo ausente, arquivos inválidos/vazios/grandes, falha de substituição e restauração.
- `php -l` no módulo WordPress, testes direcionados, lint e build do frontend.
- Após publicar, confirmar o PDF padrão pelo URL público, verificar a resposta de `catalog-pdf-info`, testar upload por administrador, testar restauração e simular indisponibilidade do anexo sem expor conteúdo não PDF.
- O hash de referência do fallback é `d801df23e99f238f041afe0e05fafdea18ab602053ecdc6e2fd219b7f101c455`. A publicação confirma esse valor com `sha256sum` tanto em `papelito-web/public/pdf/catalogo-papelito.pdf` quanto em `domains/papelitobrasil.com/public_html/pdf/catalogo-papelito.pdf`.

## Critérios de aceitação

- O PDF padrão funciona localmente e em produção, com a mesma cópia verificada por hash.
- Administradores podem substituir e restaurar o catálogo pelo painel.
- Usuários recebem o padrão se o WordPress não tiver override ou se o override estiver corrompido/problemático.
- Um upload inválido nunca substitui o catálogo que já está válido.
- O link público permanece `/api/catalog` e não afeta a cacheabilidade da home ou do catálogo.
