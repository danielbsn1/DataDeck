# Roteiro de Estudo — Como Operar a Infraestrutura do DataDeck

Este não é um plano, é um **manual de consulta**: pra quando bater a dúvida "como que eu faço X nesse projeto". Cobre exatamente o que já está montado — Git flow, Docker, back-end (Node+TS+Prisma) e o CI/CD.

---

## 1. Git — como as branches funcionam aqui

Seu fluxo: **`feature/*` → `development` → `main`**. Cada task tem a própria branch; só quando está tudo testado é que vira `main` (e só aí o CI publica imagem).

### No dia a dia

```bash
# 1. Começar uma task nova (sempre a partir da development atualizada)
git checkout development
git pull origin development
git checkout -b feature/nome-da-task

# 2. Trabalhar, commitar
git add .
git commit -m "descrição curta do que mudou"

# 3. Subir a branch e abrir PR pra development
git push -u origin feature/nome-da-task
# no GitHub: "Compare & pull request" → base: development
```

- O PR só deve ser mergeado se o **CI ficar verde** (job `api` + `web` do workflow).
- Quando `development` acumular tasks suficientes e tudo estiver validado, abre-se **um PR de `development` → `main`**. Esse é o único caminho que aciona o job `publish` (imagem no GHCR).
- Nunca commitar direto na `main` nem na `development` — sempre por PR, mesmo sozinho, porque é o PR que dispara o CI.

### Se a sua branch ficou desatualizada (alguém mergeou algo em `development` enquanto você trabalhava)

```bash
git checkout development
git pull origin development
git checkout feature/nome-da-task
git merge development   # ou git rebase development, se preferir histórico linear
```

---

## 2. Docker & Docker Compose — o que cada container faz

Arquivo: `docker-compose.yml` na raiz. Três serviços:

| Serviço | O que é | Porta no host |
|---|---|---|
| `api` | seu back-end Node+TS, buildado a partir de `api/Dockerfile` | `3000` |
| `postgres` | banco de dados | `5433` (mapeado assim porque você já tem um Postgres nativo na máquina usando a `5432`) |
| `redis` | cache/fila (ainda sem uso real — reservado pra fila de import) | `6379` |

### Comandos que você vai usar toda hora

```bash
docker compose up -d --build   # sobe tudo, reconstruindo imagens que mudaram
docker compose ps              # o que está rodando e em que porta
docker compose logs -f api     # acompanhar log de um serviço em tempo real
docker compose exec api sh     # abrir um shell dentro do container da API
docker compose stop            # para os containers sem apagar dado (volume continua)
docker compose down            # para E remove os containers (volume continua, é nomeado)
```

⚠️ **Nunca rode `docker compose down -v`** sem querer — o `-v` apaga o volume, ou seja, apaga o banco inteiro. Isso só faz sentido se você quiser resetar tudo do zero de propósito.

### Como saber se está tudo saudável

```bash
curl http://localhost:3000/health      # API está de pé?
curl http://localhost:3000/health/db   # API consegue falar com o Postgres?
```

---

## 3. Back-end — Node + TypeScript + Prisma

Pasta `api/`. Fluxo de arquivos:

```
api/
  src/
    index.ts        → sobe o servidor HTTP, define as rotas
    db.ts           → client do Prisma já configurado (importe daqui, nunca instancie de novo)
    generated/      → código gerado pelo Prisma, NÃO mexa aqui, é sobrescrito toda hora
  prisma/
    schema.prisma   → a fonte da verdade do banco: toda tabela nasce aqui
    migrations/     → histórico de cada mudança no banco, gerado automaticamente
    seed.ts         → dados de teste (roda com `npx prisma db seed`)
```

### Scripts do dia a dia (rodar dentro de `api/`)

```bash
npm run dev     # sobe a API local com hot-reload (tsx watch)
npm run build   # compila TypeScript → dist/ (é o que o Docker usa em produção)
npm run start   # roda a versão já compilada (dist/index.js)
```

### 🔑 Como criar uma tabela nova (ou mudar uma existente)

Esse é o fluxo que você vai repetir toda vez que o modelo de dados mudar:

1. **Edite `api/prisma/schema.prisma`** e adicione/mude um `model`:
   ```prisma
   model Import {
     id        String   @id @default(cuid())
     fileName  String
     status    String   @default("pending")
     createdAt DateTime @default(now())
     tenantId  String
     tenant    Tenant   @relation(fields: [tenantId], references: [id])
   }
   ```
2. **Gere a migration** (com o Postgres do Compose rodando: `docker compose up -d postgres`):
   ```bash
   npx prisma migrate dev --name add_import_table
   ```
   Isso faz três coisas de uma vez: cria o arquivo SQL em `prisma/migrations/`, aplica no banco, e regenera o client TypeScript (`src/generated/prisma`) — é por isso que depois disso o editor já tem autocomplete pra `prisma.import.findMany()` etc.
3. **Use no código:**
   ```ts
   import { prisma } from "./db";
   const imports = await prisma.import.findMany({ where: { tenantId } });
   ```

Se você só quer **ver o banco visualmente** (tipo um phpMyAdmin, mas do Prisma):
```bash
npx prisma studio
```
Abre no navegador, dá pra ver e editar linha por linha — ótimo pra debugar sem escrever SQL.

### Seed (dados de teste)

`prisma/seed.ts` cria 1 tenant + 1 admin. Pra rodar de novo (ex: depois de resetar o banco):
```bash
npx prisma db seed
```
Pra adicionar mais dados de teste, edite esse arquivo — ele usa `upsert`, então rodar de novo não duplica.

---

## 4. Front-end — Vite + React + TypeScript

Pasta `ui-dataDeck/`.

```bash
npm run dev      # servidor local com hot-reload (o jeito certo de desenvolver, não usa Docker)
npm run lint     # oxlint — roda no CI também, então rode antes de commitar
npm run build    # gera o dist/ estático (é o que o Nginx serve em produção)
```

O `Dockerfile` do front só existe pra simular produção (build → Nginx). No dia a dia você **não** roda o front via Docker — é mais lento que o hot-reload do Vite.

---

## 5. CI/CD — o que acontece quando você dá `git push`

Arquivo: `.github/workflows/ci.yml`. Ele reage a `pull_request` e `push` nas branches `main` e `development`:

```
PR pra development  →  job "api" + job "web" rodam (build, lint, valida imagem Docker)
merge em development →  os mesmos jobs rodam de novo, confirmando a branch
PR pra main          →  os mesmos jobs, última checagem
merge em main         →  api + web + job "publish" (só aqui sobe imagem pro GHCR)
```

### Como ler um CI que falhou

1. No GitHub, aba **Actions** → clique no run que falhou (ícone vermelho)
2. Clique no job (`api` ou `web`) que quebrou
3. Expanda o step vermelho — o log ali é o mesmo erro que apareceria rodando o comando local (`npm run build`, `npm run lint`)

Regra prática: **se rodar limpo local (`npm run build` e `npm run lint`), o CI passa**. Os jobs não fazem mágica nenhuma além disso.

### Por que o `publish` só roda na `main`

Ele builda as duas imagens Docker (api + web) e manda pro GHCR (registro de imagens do GitHub) com duas tags: `latest` e o hash do commit. É a partir dessas imagens que o servidor de produção vai puxar (`docker compose pull && up -d`) — por isso não faz sentido publicar antes de estar tudo validado.

---

## 6. Checklist rápido — "eu quero fazer X"

| Eu quero... | Comando |
|---|---|
| Começar uma task nova | `git checkout -b feature/nome` (a partir da `development` atualizada) |
| Rodar tudo local | `docker compose up -d --build` |
| Ver se está saudável | `curl localhost:3000/health/db` |
| Ver o banco visualmente | `npx prisma studio` |
| Criar/mudar uma tabela | editar `schema.prisma` → `npx prisma migrate dev --name algo` |
| Resetar o banco do zero | `npx prisma migrate reset` (apaga tudo, roda migrations + seed de novo) |
| Ver logs de um container | `docker compose logs -f api` |
| Saber se meu PR vai passar no CI | rodar `npm run build` e `npm run lint` local antes de dar push |
| Saber por que o CI falhou | aba **Actions** no GitHub → abrir o step vermelho |
