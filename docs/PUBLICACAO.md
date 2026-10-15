# Publicação AZZO ROOM

A publicação externa ainda depende de contas, autorização e configuração de rede. Os arquivos abaixo preparam a implantação, mas não são evidência de serviços criados.

## Contas e acessos

- Vercel: https://vercel.com/signup — frontend e API de tokens. Para automação, cadastre `VERCEL_TOKEN` nas configurações seguras do ambiente. Gere em https://vercel.com/account/settings/tokens.
- Supabase: https://supabase.com/dashboard — Postgres e Auth. Para criar/configurar o projeto por API, cadastre `SUPABASE_ACCESS_TOKEN` (https://supabase.com/dashboard/account/tokens).
- LiveKit Cloud: https://cloud.livekit.io — crie um projeto e cadastre `LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET` como variáveis seguras do backend. Nenhuma chave deve ser enviada no chat ou commitada.
- Render: https://dashboard.render.com — game server persistente. A automação requer `RENDER_API_KEY` (Account Settings → API Keys). O blueprint solicita plano free, que pode hibernar; um plano sempre ativo depende de decisão explícita sobre custos.

Os tokens de Vercel, Supabase e Render podem usar os bindings de proxy para os hosts de suas respectivas APIs. Já `LIVEKIT_API_SECRET` precisa ser um valor real no processo que assina JWT; um placeholder substituído apenas em chamadas HTTPS não é suficiente.

A rede precisa liberar `api.vercel.com`, `vercel.com`, `api.supabase.com`, `cloud.livekit.io` e `api.render.com`. Depois de criar os serviços, adicione também os hosts reais do projeto Supabase, do LiveKit e do game server. As regras foram propostas no rascunho; salvá-lo não prova que a rede já foi atualizada.

## Ordem de implantação

1. Crie um projeto Supabase. Guarde com segurança a senha do banco e escolha região disponível próxima dos usuários, sem habilitar plano pago.
2. Aplique as migrações de `supabase/migrations` em ordem numérica. Em projeto novo, elas criam somente o esquema da aplicação; não desativam RLS. Em projeto existente, revise o schema antes de aplicar. As migrações não devem ser reaplicadas como SQL avulso depois de concluídas.
3. Crie o projeto LiveKit Cloud e obtenha URL e chaves. Não habilite gravações ou serviços pagos automaticamente.
4. Importe `ALETECH-TRAQ/AZZO-ROOM` na Vercel com **Root Directory `apps/web`**, framework Next.js e acesso aos arquivos do monorepo fora desse diretório. `apps/web/vercel.json` já define instalação e build a partir da raiz.
5. No Render, crie um Blueprint a partir do mesmo repositório (`render.yaml`). O Dockerfile usa Node 22, roda sem root, expõe `/healthz` e mantém o Colyseus como processo. Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `ALLOWED_ORIGINS` com a origem HTTPS exata do frontend. Não use `*`. O hostname WebSocket é o mesmo do serviço Render, via WSS.
6. Cadastre na Vercel as variáveis abaixo e faça um novo deploy. As variáveis `NEXT_PUBLIC_` são incorporadas no build e exigem rebuild quando mudam.

| Variável Vercel | Fonte |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anon do mesmo projeto, nunca service_role |
| `NEXT_PUBLIC_GAME_SERVER_URL` | URL HTTPS/WSS do serviço Render |
| `LIVEKIT_URL` | URL WSS do projeto LiveKit |
| `LIVEKIT_API_KEY` | API key do projeto LiveKit, apenas no backend |
| `LIVEKIT_API_SECRET` | API secret real do LiveKit, marcado como sensível |

7. No Supabase Auth, configure Site URL para a URL pública da Vercel e Redirect URL para `https://HOST/auth/callback`. Habilite confirmação de e-mail e valide a entrega. Se usar preview deployments, autorize apenas os previews necessários e atualize ALLOWED_ORIGINS.
8. Execute a verificação pública e um teste com duas contas do mesmo escritório, além de uma conta de outra empresa.

## Validação de produção

- `npm run check:production`: valida presença e formato seguro da configuração, sem imprimir valores. Não substitui teste de conectividade.
- Frontend `/api/health`: informa somente quais grupos de configuração estão presentes; retorna 503 se faltarem. Não prova login nem chamadas reais.
- Game server `/healthz`: processo vivo; `/readyz`: variáveis Supabase e origins configuradas. A autenticação exige sessão verificada e membership mesmo que CORS permita a origem.
- Conferir cadastro → confirmação → criação de escritório → avatar → presença entre duas contas.
- Conferir negativa de acesso de outra empresa e de reunião privada.
- Microfone, câmera e tela somente por ação explícita; valide com dois dispositivos e fones em HTTPS.
- A demonstração permanece bloqueada em produção.

## Comandos do game server

```bash
docker build -f deploy/Dockerfile.game-server -t azzo-room-game .
# As variáveis devem existir no ambiente do operador; nenhum valor é embutido na imagem.
docker run --rm -p 2567:2567 \
  -e SUPABASE_URL -e SUPABASE_ANON_KEY -e ALLOWED_ORIGINS \
  azzo-room-game
```

O frontend Vercel não hospeda esse container. O banco PostgreSQL usado nos testes locais não é um banco de produção e não é publicado.
