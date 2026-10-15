# AZZO ROOM

Escritório virtual 3D da AZZO TECH. Implementação construída a partir do kit fornecido, preservando Next.js, React Three Fiber, Colyseus e LiveKit.

## Executar localmente

Requer Node.js 22+ e npm. Nesta máquina há Node 24 e Chromium disponíveis.

```bash
npm ci
bash scripts/dev.sh
```

O script inicia o frontend na porta 3000 e o Colyseus na 2567, com demonstração **somente em desenvolvimento**. Na tela de entrada, escolha **Explorar demonstração**, personalize e salve o avatar, depois entre no escritório. Não exige cadastro nem ativa microfone/câmera automaticamente. Em produção o link de demo desaparece e o servidor rejeita convidados, mesmo com as flags de demo habilitadas.

## Funcionalidades

- Login, cadastro e recuperação de senha com formulários reais, estados de validação e cliente Supabase configurável. OAuth oculto enquanto não configurado.
- Avatar Studio: modelos iniciais masculino/feminino/personalizado; 14 cabelos livres para qualquer modelo; sete tons de pele; sete estados de óculos; cinco categorias de roupa; calça/saia, dois calçados, cores, olhos, proporções e cinco acessórios.
- 14 presets, aleatório, restaurar, preview 3D girável com zoom e animações parado/andando/correndo/sentado.
- Persistência local na demo; persistência por usuário em Supabase quando configurado. Primeiro acesso passa pelo editor antes do escritório.
- Escritório procedural com recepção, estações, lounge e duas áreas de reunião; WASD/setas, Shift, câmera híbrida V e controles de toque.
- Avatares personalizados e presença sincronizados pelo Colyseus; limites, velocidade, colisões de móveis e validação compartilhada; janela de reconexão de 15 segundos.
- Supabase: criação transacional de workspace/owner, convites de uso único com hash, expiração, e-mail e escopo; painel de membros, convites e revogação; RLS e permissões no servidor.
- LiveKit: canal geral com atenuação de proximidade e reuniões separadas autorizadas; controles de câmera, microfone, tela e chat fornecidos pelo componente LiveKit. Depende das credenciais reais.

## Configurar serviços reais

Use `.env.example` como referência. Não coloque valores privados no Git.

No frontend (`apps/web/.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: URL e chave pública do seu projeto.
- `NEXT_PUBLIC_GAME_SERVER_URL`: endereço do servidor Colyseus acessível ao navegador. Se omitido em desenvolvimento usa o hostname atual e porta 2567.
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`: configuração **do backend** para assinar tokens de curta duração. O secret precisa ser um valor real injetado de forma segura no processo; um placeholder substituído apenas por proxy HTTP não serve para assinatura local.

No processo do game server: `SUPABASE_URL` e `SUPABASE_ANON_KEY`, correspondentes ao mesmo projeto. Exporte essas variáveis no terminal ou no host do processo; não existe carregamento automático de `apps/game-server/.env`.

Aplique, nesta ordem, no seu projeto Supabase:

1. `supabase/migrations/20261015190001_schema_inicial.sql`
2. `supabase/migrations/20261015190002_profiles_and_workspace_flows.sql`
3. `supabase/migrations/20261015190003_runtime_grants.sql`

Configure a URL do site e o redirecionamento `/auth/callback` no Supabase Auth. Habilite confirmação de e-mail e envio de recuperação. O cadastro autenticado leva a `/onboarding`, que cria um escritório ou aceita um convite válido; escrever o nome de uma empresa não concede acesso.

Destinos de rede externos: host do seu projeto Supabase, host LiveKit, host do game server, `registry.npmjs.org`. Configure os hosts reais nas regras do ambiente. Não há chaves privadas no kit ou nesta entrega.

## Validação

Com `bash scripts/dev.sh` ativo:

```bash
npm run typecheck
npm run build
npm test
npm run test:e2e
npm run test:db
```

`npm test` exercita catálogo, payloads adversos, colisões, endpoint de mídia e dois clientes reais Colyseus. `test:e2e` testa formulários, seis larguras (375/390/768/1024/1440/1920), avatar, persistência, câmera e escritório, e salva screenshots em `artifacts/`. O Playwright usa `/usr/bin/chromium`; fora desta máquina configure `CHROMIUM_PATH` ou instale Chromium. `test:db` requer Docker e sobe PostgreSQL 17 isolado, aplica as migrações e valida isolamento, acesso a reuniões e convites; remove apenas o container criado pelo teste. Os usuários e o esquema `auth` usados nesse teste são fixtures locais, não um serviço Supabase Auth real.

## Estrutura

- `apps/web`: telas, APIs e mundo 3D.
- `apps/game-server`: servidor persistente Colyseus.
- `packages/avatar`: catálogo versionado, contrato e validação usados no navegador e no servidor.
- `supabase/migrations`: tabelas, RLS e funções de domínio.
- `docs/referencias`: imagens originais preservadas.
- `docs/ENTREGA.md`: evidências e limites desta versão.

## Assets e limites atuais

Os avatares são **procedurais**: meshes próprios e hierarquia de articulações/pontos de ancoragem. Não são recortes do moodboard, nem modelos GLB finais com skinning. O catálogo mantém IDs estáveis para uma futura troca por assets licenciados. A imagem de abertura foi gerada a partir da referência do kit sem o formulário embutido; todos os controles são HTML reais.

A demo salva neste navegador; persistência entre dispositivos requer Supabase. Login/e-mail real, chamadas com dois dispositivos e deploy não foram validados porque não há serviços/credenciais configurados. A aplicação não foi publicada. Os testes de RLS em PostgreSQL não substituem um piloto contra Supabase Auth e LiveKit reais.

Pendências para piloto: assets GLB/rig finais, animação sentada contextual junto às cadeiras (o editor já mostra a pose), física/câmera com oclusão avançada, agendamento de reuniões, troca de dispositivo personalizada, edição de papéis/expulsão, testes de carga/revogação em sessões já conectadas e avaliação em aparelhos móveis reais. As sessões Supabase do frontend usam o armazenamento padrão do SDK; cookies HttpOnly e demais políticas de produção precisam de uma etapa de endurecimento. Não há gravação de mídia por padrão.

Frontend pode ser hospedado na Vercel. Colyseus exige um processo com WebSockets persistentes (não uma função serverless). Use HTTPS/WSS, origins explícitas e serviços autenticados antes de um piloto externo.

## Publicação

Os arquivos de deploy para Vercel e Render estão preparados; veja `docs/PUBLICACAO.md`. A implantação externa exige os acessos às contas e as variáveis reais dos serviços. `npm run check:production` lista apenas os nomes que faltam.
