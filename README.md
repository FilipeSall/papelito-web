# Projeto Papelito Web

O projeto **Papelito Web** será desenvolvido em ciclos de sprint com uma arquitetura headless, separando front-end (Next.js) e back-end (WordPress + WooCommerce + Dokan), com integração progressiva via GraphQL e foco em qualidade contínua.

A fase inicial prioriza a fundação do front-end com **Next.js, Zustand, Tailwind, SWR, Apollo, WPGraphQL e Auth.js**, incluindo setup de infraestrutura, variáveis de ambiente, dados mockados e construção das páginas principais de navegação e catálogo. Em seguida, o escopo evolui para páginas de compra (produto, carrinho e checkout), autenticação com rotas protegidas, área do usuário (perfil, pedidos, rastreio, favoritos) e páginas institucionais/comerciais complementares.

Na fase de back-end, o roadmap prevê saneamento de dados, reorganização do WordPress para operação headless, hardening de segurança, plugins customizados e integrações logísticas/pagamento. Depois disso, ocorre a fase de integração completa entre front e back, substituindo mocks por dados reais, conectando autenticação com base real de usuários e validando fluxos críticos de checkout.

A etapa final de QA expande cobertura com testes unitários, integração e E2E (Vitest, Playwright, MSW e Lighthouse CI), além de pipeline no GitHub Actions, para garantir estabilidade, performance e confiabilidade operacional antes da entrada em produção.
