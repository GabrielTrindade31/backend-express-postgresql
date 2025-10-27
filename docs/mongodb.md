# Configuração do MongoDB

Este guia apresenta diferentes formas de obter a string de conexão necessária para preencher o arquivo `.env` e executar o projeto.

## 1. Ambiente local com Docker Compose (recomendado)

1. Certifique-se de ter o Docker e o Docker Compose instalados (no GitHub Codespaces eles já vêm configurados).
2. Na raiz do projeto, suba o contêiner do MongoDB:

   ```bash
   docker compose up -d mongo
   ```

3. Aguarde alguns segundos e confirme que o contêiner está em execução:

   ```bash
   docker compose ps
   ```

4. A string de conexão padrão para este cenário já está preenchida no `.env.example`:

   ```env
   MONGO_URI=mongodb://localhost:27017/mini_projeto_fullstack
   ```

   Caso esteja executando dentro do Codespaces, utilize `127.0.0.1` em vez de `localhost` quando for testar a API externamente.

5. Para encerrar o banco local, execute:

   ```bash
   docker compose down
   ```

> O volume `mongo-data` garante que os dados persistam entre reinicializações do contêiner.

## 2. Utilizando o MongoDB Atlas (nuvem)

1. Crie uma conta gratuita em [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Crie um cluster gratuito (Shared) e aguarde a disponibilização.
3. No menu **Database Access**, crie um usuário com permissões de leitura e escrita no cluster.
4. Em **Network Access**, adicione o IP `0.0.0.0/0` (ou o IP específico do seu ambiente, se preferir).
5. Clique em **Connect → Drivers**, selecione o driver `Node.js` e copie a string de conexão. Ela terá o formato:

   ```
   mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/mini_projeto_fullstack?retryWrites=true&w=majority
   ```

6. Cole a string no `.env` em `MONGO_URI` (ambiente local) ou `MONGO_URI_PROD` (deploy na Vercel).

## 3. Variáveis de ambiente obrigatórias

Preencha o arquivo `.env` com base no `.env.example`:

```env
PORT=3333
NODE_ENV=development
MONGO_URI= # conexão local ou Atlas
MONGO_URI_PROD= # conexão utilizada no deploy
JWT_SECRET= # chave usada para assinar os tokens JWT
```

Para gerar uma chave segura para `JWT_SECRET`, utilize:

```bash
openssl rand -base64 32
```

No Windows, você pode usar o PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 4. GitHub Codespaces

1. Copie `.env.example` para `.env`:

   ```bash
   cp .env.example .env
   ```

2. Caso utilize Docker dentro do Codespaces, exponha a porta `27017` na aba **Ports** para acessar o MongoDB via ferramentas externas (opcional).
3. Inicie o banco local (`docker compose up -d mongo`) e, em seguida, o servidor Node.js (`npm run dev`).
4. Atualize a variável `BASE_URL` nos scripts da pasta `requests/` para utilizar a URL pública gerada pelo Codespaces.

Seguindo estas etapas você terá as variáveis necessárias para rodar o projeto localmente, em Codespaces ou em produção.
