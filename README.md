# Mini-Projeto Fullstack - Backend

API REST desenvolvida em Node.js com TypeScript, Express e MongoDB, implementando autenticação baseada em JWT e estrutura em camadas (middlewares, routes, controllers, services, models e database). O projeto contempla validações robustas, hash de senhas com **bcrypt**, logs estruturados e exemplos de requisições via `curl`.

Na evolução desta versão foi adicionado um CRUD completo e autenticado de **tarefas** (to-do list) permitindo criar, listar, buscar por filtros, atualizar (PUT/PATCH) e remover itens associados ao usuário autenticado.

## Sumário

- [Tecnologias](#tecnologias)
- [Arquitetura de pastas](#arquitetura-de-pastas)
- [Configuração](#configuração)
- [Configuração do MongoDB](#configuração-do-mongodb)
- [Execução local](#execução-local)
- [Execução no GitHub Codespaces](#execução-no-github-codespaces)
- [Scripts de requisição](#scripts-de-requisição)
- [Boas práticas implementadas](#boas-práticas-implementadas)
- [Hospedagem e vídeo](#hospedagem-e-vídeo)
- [Deploy na Vercel](#deploy-na-vercel)

## Tecnologias

- Node.js & TypeScript
- Express
- MongoDB & Mongoose
- JWT (`jsonwebtoken`)
- Hash de senha com `bcryptjs`
- Validações com `zod`
- Logs estruturados com `winston`

## Arquitetura de pastas

```
src/
├── app.ts
├── config/
├── controllers/
├── database/
├── errors/
├── middlewares/
├── models/
├── routes/
├── services/
└── utils/
requests/
```

Cada camada possui responsabilidade única e isolada, facilitando a manutenção e evolução.

## Configuração

1. (Opcional, mas recomendado) Suba o MongoDB local com Docker Compose:

   ```bash
docker compose up -d mongo
   ```

   > Caso prefira utilizar MongoDB Atlas ou outra instância remota, consulte a seção [Configuração do MongoDB](#configuração-do-mongodb).

2. Copie o arquivo `.env.example` para `.env` e ajuste as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

3. Configure os valores necessários (veja detalhes em [`docs/mongodb.md`](docs/mongodb.md)):

   ```env
   PORT=3333
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/mini_projeto_fullstack
   MONGO_URI_PROD= # URI do cluster Atlas ou equivalente
   JWT_SECRET=dev-secret-change-me # substitua por uma chave segura em produção
   ```

   Para gerar uma chave aleatória, execute `openssl rand -base64 32` ou utilize a alternativa descrita na documentação.

4. Instale as dependências:

   ```bash
   npm install
   ```

## Configuração do MongoDB

O repositório inclui um guia completo em [`docs/mongodb.md`](docs/mongodb.md) com três abordagens:

- **Docker Compose local** — basta executar `docker compose up -d mongo` para ter um banco pronto para uso.
- **MongoDB Atlas (nuvem)** — passo a passo para criar cluster, usuário e copiar a string `mongodb+srv://`.
- **GitHub Codespaces** — orientações específicas sobre portas, variáveis e execução no ambiente remoto.

Escolha a opção que melhor se adequa ao seu cenário e preencha `MONGO_URI`/`MONGO_URI_PROD` conforme indicado.

## Execução local

1. Certifique-se de que o MongoDB esteja ativo (via `docker compose up -d mongo` ou Atlas).
2. Inicie o servidor em modo desenvolvimento:

   ```bash
   npm run dev
   ```

O servidor sobe na porta definida em `PORT` (padrão `3333`). As rotas disponíveis são:

- `POST /register`
- `POST /login`
- `GET /protected` (necessita header `Authorization: Bearer <token>`)
- `POST /tasks` (cria tarefa)
- `GET /tasks` (lista tarefas com suporte a filtros por `status`, `title` e `dueDate`)
- `GET /tasks/:id`
- `PUT /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

Todos os endpoints de tarefas exigem autenticação via JWT.

### Estrutura da entidade `Task`

Cada tarefa criada pertence exclusivamente ao usuário autenticado e possui os seguintes campos:

| Campo       | Tipo                    | Obrigatório | Descrição |
|-------------|-------------------------|-------------|-----------|
| `title`     | `string`                | Sim         | Título da tarefa (mínimo 3 caracteres). |
| `description` | `string`             | Não         | Texto livre para detalhamento (máx. 500 caracteres). |
| `status`    | `"pending" \| "in_progress" \| "completed"` | Não (default `pending`) | Estado atual da tarefa. |
| `dueDate`   | `string (ISO 8601)`     | Não         | Data limite. Envie `null` em PATCH/PUT para remover. |
| `createdAt`/`updatedAt` | `Date`      | Automático  | Campos de auditoria gerenciados pelo Mongoose. |

Requisições de usuários diferentes nunca acessam dados entre si — o serviço retorna **403** quando detecta tentativa de acesso a tarefas de outro usuário.

Para encerrar os serviços locais, utilize `Ctrl+C` no terminal da API e `docker compose down` para desligar o banco.

## Execução no GitHub Codespaces

1. Crie o Codespace a partir deste repositório selecionando o template padrão de Node.js.
2. Copie o arquivo `.env.example` para `.env` e informe as variáveis necessárias (você pode usar Docker ou uma URI do MongoDB Atlas).
3. No terminal do Codespace, instale as dependências e inicie o banco/servidor:

   ```bash
   npm install
   docker compose up -d mongo # ou configure MONGO_URI com Atlas
   npm run dev
   ```

4. Utilize a aba **Ports** para expor a porta `3333` e acesse a URL pública fornecida pelo Codespace para testar os endpoints (os scripts em [`requests/`](requests/) também funcionam ajustando `BASE_URL`).

## Scripts de requisição

A pasta [`requests/`](requests/) contém arquivos `.sh` com exemplos de requisições utilizando `curl`. Execute-os conforme necessário:

```bash
bash requests/register_success.sh
bash requests/login_success.sh
# ...
```

Os scripts aceitam variáveis de ambiente (`BASE_URL`, `EMAIL`, `PASSWORD`, `TOKEN`, etc.) para reutilização em ambientes locais ou hospedados.

Além dos arquivos `.sh`, disponibilizamos `requests/requests.yaml` que pode ser importado diretamente no Insomnia/Postman. A coleção inclui exemplos de sucesso e erros para:

- Cadastro e login;
- Rotas protegidas sem token e com token inválido;
- CRUD completo de tarefas (criar, listar com filtros, detalhar, atualizar por PUT/PATCH e remover);
- Casos negativos: requisição mal formatada, token ausente/inválido e simulação de tentativa de acesso a tarefa de outro usuário.

Antes de executar as requisições de tarefas configure, no Insomnia/Postman, os seguintes valores no ambiente da coleção:

- `base_url`: URL local ou hospedada da API;
- `token`: token JWT do usuário principal;
- `token_outro_usuario`: token JWT de um usuário diferente (para simular a resposta 403);
- `task_id`: ID de uma tarefa criada pelo usuário principal (usado em GET/PUT/PATCH/DELETE);
- `task_id_outro_usuario`: ID de uma tarefa pertencente a outro usuário (para o cenário 403).

## Boas práticas implementadas

- Estrutura em camadas seguindo o padrão solicitado.
- Conexão com MongoDB configurável para ambientes local e produção.
- Validações semânticas para cadastro e login (tamanho mínimo, formato de e-mail, política de senhas forte).
- Hash de senha com `bcrypt` e campo `password` não selecionável.
- Tratamento centralizado de erros e respostas com status HTTP adequados.
- Logs de requisições e de eventos importantes (sucesso/erro) utilizando Winston.
- Scripts de exemplo para todos os cenários exigidos.

## Hospedagem e vídeo

- **Link da aplicação hospedada:** <!-- Adicione aqui o link após publicar -->
- **Vídeo demonstrativo:** <!-- Adicione aqui o link do vídeo (até 2 minutos) -->

## Deploy na Vercel

1. Instale a CLI da Vercel (localmente ou no Codespace):

   ```bash
   npm install -g vercel
   ```

2. Autentique-se e associe o projeto:

   ```bash
   vercel login
   vercel link
   ```

3. Configure as variáveis de ambiente no painel da Vercel (`MONGO_URI_PROD`, `JWT_SECRET`, `NODE_ENV=production`) ou via CLI:

   ```bash
   vercel env add MONGO_URI_PROD production
   vercel env add JWT_SECRET production
   vercel env add NODE_ENV production
   ```

4. Faça o deploy (primeiro um preview, depois produção):

   ```bash
   vercel --prod
   ```

O arquivo [`vercel.json`](vercel.json) direciona todas as requisições para o handler serverless em [`api/index.ts`](api/index.ts), que reutiliza a mesma aplicação Express do ambiente local. Após o deploy, atualize a seção [Hospedagem e vídeo](#hospedagem-e-vídeo) com a URL final e grave a demonstração solicitada.

Atualize esta seção após realizar o deploy (ex.: Vercel, Render) e gravar o vídeo demostrando as funcionalidades exigidas.
