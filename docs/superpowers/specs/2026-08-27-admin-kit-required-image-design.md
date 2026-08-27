# Imagem obrigatória em novos Kits

## Objetivo

Remover do editor administrativo a escolha de imagens padrão (`Ícone Kit`, `Kit` e
`Premium`) e exigir upload de uma imagem ao criar um Kit.

## Decisões

- Novos Kits começam sem imagem e usam `imageSource: "custom"`.
- O botão de salvar deve rejeitar um novo Kit sem `imageAttachmentId`.
- Kits existentes preservam a imagem atual, inclusive referências históricas a presets.
- O backend rejeita criação sem imagem customizada, mas continua aceitando atualização de
  Kits legados que já usam preset.
- O editor mantém somente o controle de upload/troca de imagem.

## Validação

- Teste do componente confirma que os três presets não são renderizados.
- Teste do componente confirma que salvar novo Kit sem upload exibe erro e não faz a requisição.
- Teste do backend cobre criação sem imagem e atualização de Kit legado.
- TypeScript, lint e testes do frontend; `php -l` e teste standalone do módulo de Kits no backend.
