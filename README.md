# 💰 Gastos+ (nome provisório) — Controle de Gastos Mensais

> Status: **ideação** — este README documenta a ideia inicial, o escopo de features e as decisões técnicas para servir de referência conforme o projeto evolui.

## 1. Visão geral

App (e possivelmente site) para acompanhar gastos mensais: categorizar despesas, definir limites por categoria, comparar meses anteriores, lembrar de contas recorrentes e, futuramente, importar transações automaticamente do banco.

Uso pensado para **uma pessoa só**. O stack abaixo reflete isso: só entra o que resolve um problema real do app hoje; o que só faz sentido com mais usuários fica marcado como passo futuro (§5).

## 2. Features



### MVP (fase 1)

1. **Registro de gastos** — botão "+" abre modal para lançar um gasto: categoria (IFood, Bar, Investimento, ...), valor, e opcionalmente forma de pagamento no cartão de crédito com número de parcelas.
2. **Limites por categoria** — definir um teto mensal (ex.: R$300 em IFood) e ser alertado ao bater/aproximar do limite.
3. **Histórico e comparação** — histórico de meses anteriores, com gráficos/percentuais comparando o mês atual com a média ou com o mês passado.
4. **Lembretes de gastos fixos/assinaturas** — lembretes de contas recorrentes (DAS-MEI, academia, clube IFood, parcelas em aberto), alimentados pelos lançamentos da feature 1.



### Fase 3 (stretch goal)

1. **Importação automática de transações bancárias** — puxar transações direto do banco via API (no Brasil: **Open Finance Brasil**, via agregadores como Pluggy, Belvo ou Quanto). A transação chega pronta faltando só a categorização; se o agregador já informar parcelamento, esse campo também pode vir pré-preenchido.



## 3. Stack — o necessário para 1 usuário


| Camada           | Tecnologia                         | Onde entra                                                                                                                                                                    |
| ---------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend         | React + TypeScript (Vite, **SPA**) | App autenticado, sem SEO — SSR não traz ganho aqui                                                                                                                            |
| Auth             | JWT                                | Único mecanismo de auth necessário (email/senha)                                                                                                                              |
| Validação        | Zod                                | Validar todo input da API (gasto, limite, categoria)                                                                                                                          |
| Backend          | Node + API REST                    | Toda a lógica de negócio                                                                                                                                                      |
| Banco            | PostgreSQL + Prisma                | Usuários, categorias, gastos, parcelas, limites, assinaturas. Uma coluna `jsonb` cobre o staging de import bancário da fase 3 — não precisa de um NoSQL dedicado nesse volume |
| Alerta de limite | Resposta síncrona da própria API   | `POST /gastos` já retorna se estourou o limite — não precisa de canal separado                                                                                                |
| Lembretes        | Cron job simples (ex. `node-cron`) | Roda 1x/dia verificando contas a vencer                                                                                                                                       |
| Infra local      | Docker (WSL2)                      | Só o Postgres containerizado, pra padronizar o ambiente                                                                                                                       |
| CI/CD            | GitHub Actions                     | Lint + testes + build a cada push/PR                                                                                                                                          |
| Deploy           | Tudo na Vercel                     | Front + API como serverless functions — sem WebSocket/Redis, não há mais motivo pra host separado. Postgres em um provedor gerenciado (Neon/Supabase)                         |
| Testes           | Vitest + Testing Library           | Um único test runner cobre front e back                                                                                                                                       |
| HTTP             | Status codes, headers, CORS        | Vem naturalmente ao construir a API REST corretamente                                                                                                                         |




## 4. Arquitetura (visão single-user)

```
[React + TS (SPA)] --(REST)--> [API Node serverless na Vercel]
                                        |-- Postgres (Prisma) — dados relacionais + jsonb (staging import)
                                        |-- Cron job — lembretes recorrentes
                                        |-- OAuth (fase 3) — consentimento Open Finance
```



## 5. Passos futuros — se expandir para múltiplos usuários

Tecnologias que **não** entram agora porque resolvem problemas de escala/concorrência que um app de uma pessoa não tem. Ficam de lado até que o gatilho aconteça:


| Tecnologia             | Gatilho pra adicionar                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| WebSockets             | Mais de um usuário/dispositivo precisando de sincronização em tempo real                                         |
| Redis (cache)          | Cálculo de agregados (histórico/dashboard) começar a pesar no banco com volume de usuários                       |
| Filas (Redis + BullMQ) | Volume de importações/lembretes justificar processamento assíncrono com retry                                    |
| NoSQL dedicado (Mongo) | Staging de import bancário crescer a ponto do `jsonb` no Postgres não ser mais prático                           |
| Load Balancing         | Precisar rodar múltiplas instâncias do backend                                                                   |
| Sessions               | Não é sobre escala — fica só como exercício avulso caso queira comparar com JWT, sem entrar no roadmap principal |




## 6. Roadmap sugerido

1. **Fase 0** — setup: projeto Vite, Postgres local via Docker, Prisma schema inicial, CI básico.
2. **Fase 1** — MVP single-user: features 1 a 4 (CRUD de gastos, limites, histórico com gráficos, lembretes via cron).
3. **Fase 2** — deploy real: tudo na Vercel + Postgres gerenciado (Neon/Supabase).
4. **Fase 3 (stretch)** — importação bancária via Open Finance (OAuth + agregador), staging em `jsonb`.
5. **Fase 4 (só se expandir pra multiusuário)** — reavaliar §5: WebSockets, Redis, fila, NoSQL dedicado, load balancing.



## 7. Estrutura do projeto (fase 0 — só scaffold, sem lógica)

```
expense-tracker/
├── docker-compose.yml       # Postgres local
├── .github/workflows/ci.yml # lint + test + build (front e back)
├── backend/
│   ├── prisma/schema.prisma # sem models ainda
│   └── src/
│       ├── index.ts         # só o wiring do Express (sem rotas)
│       ├── routes/  controllers/  services/  middlewares/  config/  lib/
└── frontend/
    └── src/
        ├── components/  pages/  hooks/  services/  types/  contexts/
```

Rodar em dev:

```
docker compose up -d          # sobe o Postgres
cd backend  && npm run dev    # API em http://localhost:3333
cd frontend && npm run dev    # Vite em http://localhost:5173
```

> Nota: o `prisma init` (versão atual do Prisma) também gerou `.claude/skills`, `.agents/skills`, `.windsurf/skills` e `skills-lock.json` dentro de `backend/` — são guias de referência do Prisma pra assistentes de IA, não fazem parte do código do projeto. Posso remover se preferir não versionar isso.



## 8. Decisões em aberto

- Nome do projeto.
- App mobile (React Native/PWA) ou só web responsiva no início?
- Qual agregador de Open Finance usar na fase 3 (sandbox gratuito?).

