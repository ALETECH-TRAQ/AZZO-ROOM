# AZZO ROOM — Etapa A: auditoria e proposta de migração

Data: 19/10/2026. Escopo: auditoria, testes e planejamento. A Etapa B não foi
iniciada. Nenhuma mudança de aplicação, protocolo ou banco de produção foi feita.

## Segurança e estado inicial

- Commit de partida: `2d013055d2b09f60fb1295c551c4f55e05942d96`.
- Branch exclusiva: `migration/cartoon-isometric-25d` (local).
- Tag de retorno ao código 3D: `rollback-3d-before-isometric-20261019`.
- A branch anterior `work` foi preservada. Nenhum arquivo antigo foi excluído.
- Havia estudos v2/v3, catálogo modular, scripts e documentos de avatares não
  rastreados. Foram mantidos e arquivados em
  `/tmp/azzo-untracked-before-isometric-20261019.tar.gz`.
- Os PNGs anteriores foram copiados para
  `/tmp/azzo-baseline-artifacts-20261019.tar.gz` antes dos testes visuais.
- A tag protege arquivos commitados; não inclui arquivos não rastreados.
  Os arquivos em `/tmp` são backups desta execução, não backup remoto permanente.
- Apenas este relatório será commitado nesta etapa; sem push ou deploy.

## Arquitetura encontrada

Monorepo npm workspaces, TypeScript e Node (ambiente atual: Node 24; requisito
do projeto: Node >=22). Next instalado 16.4.1, React 19.3.1, Three.js 0.180.x,
React Three Fiber 9.8.2, Drei 10.7.9, Colyseus/SDK 0.18.x. Supabase fornece Auth
e PostgreSQL; LiveKit fornece áudio/vídeo. Chromium e Docker estão disponíveis.

| Área | Arquivos principais | Responsabilidade atual |
| --- | --- | --- |
| Páginas/autenticação | `apps/web/app`, `components/auth`, `lib/auth` | Login, onboarding, seleção de workspace |
| Orquestração do escritório | `apps/web/components/OfficeApp.tsx` | Sessão, conexão, snapshots, envio de movimento, HUD e reuniões |
| Mundo e controle | `apps/web/components/OfficeWorld.tsx` | Canvas, móveis procedurais, input, colisões locais, câmera terceira pessoa, avatares locais/remotos |
| Câmera elevada | `apps/web/components/SimsCamera.tsx` | PerspectiveCamera, orientação fixa, seguimento e zoom |
| Avatar/editor | `apps/web/components/avatar/*` | GLB, AnimationMixer, acessórios, materiais, editor e prévia |
| Contrato compartilhado | `packages/avatar/index.js`, `index.d.ts` | AvatarConfig v1, validação, obstáculos e movimento varrido |
| Rede no navegador | `apps/web/lib/multiplayer.ts` | Adaptador do estado Colyseus e filtro da sessão local |
| Sala no servidor | `apps/game-server/src/rooms/OfficeRoom.ts`, `OfficeState.ts` | Entrada, spawn, presença, validação, reconexão |
| Autorização | `apps/game-server/src/auth/session.ts` | Validação de usuário Supabase e participação no workspace |
| Comunicação | `VoiceManager.tsx`, `app/api/livekit/token` | Tokens autorizados, reuniões e volume por distância |
| Banco | `supabase/migrations/*.sql` | Workspaces, membros, reuniões, perfis, convites, RLS e grants |
| Infraestrutura | `render.yaml`, `deploy/`, `scripts/` | Backend Docker/Render, execução local, testes |

### Representação espacial e estado de rede

O chão usa `(x,z)`; `y=0` no servidor, `yaw` em radianos. Não há tilemap nem
coordenadas isométricas na rede. Cada sala filtra por `officeId` e contém um mapa
de jogadores indexado por **sessionId**, distinto de userId. Cada jogador contém
userId, nome, cor, avatar JSON, animação, x/y/z e yaw.

Há até 20 conexões por sala. Uma sala cheia pode gerar outra instância com o mesmo
officeId via joinOrCreate; “mesmo escritório” não garante a mesma instância acima
desse limite. Não há estado replicado de móveis, cadeiras ou ocupação.

Cliente publica movimento a aproximadamente 10 Hz; servidor limita frequência,
velocidade, limites e atravessamento de obstáculos. Mensagens operam somente no
jogador da sessão remetente. Autorização de produção valida token e membership.
Convidados são restritos ao desenvolvimento e workspace demo.

O estado inicial é aguardado antes de aplicar o spawn e marcar Online. Remotos
são filtrados por sessionId, renderizados com chave estável e interpolados.
Colyseus reserva reconexão por 15 s; após expiração há nova entrada/spawn.
O processo atual não configura presença/driver Redis; escalar horizontalmente
sem revisar matchmaking/presença pode separar jogadores. Não é necessário
introduzir Redis para o primeiro protótipo em uma única instância.

### Persistência

- `avatar_profiles.config` é JSONB, exige schemaVersion=1 e tamanho <2000 bytes.
- Validação JS limita IDs numéricos, paletas, dimensões e acessórios; campos
  desconhecidos são descartados. Não cabem IDs arbitrários ou imagens no payload.
- `azzo-room-avatar-v1` em localStorage guarda a aparência local; o editor lê
  e grava o perfil Supabase autenticado. RLS restringe o perfil ao proprietário.
- `azzo-room-workspace` guarda a escolha local; participação real está no banco.
- Posição, yaw, animação e sessão da sala são transitórios; não há persistência
  de posição/assento após reinício do servidor ou nova entrada.
- O editor grava primeiro localmente e depois na nuvem: falha de rede pode deixar
  local e remoto diferentes. O escritório lê o perfil local na entrada.
- O editor atual normaliza cabelo para ID 0 por limitação do modelo fundido.

## Achados e riscos

Os itens abaixo são evidências de código; resultados reproduzidos estão na seção
de testes. Não atribuir todos os problemas históricos a uma única causa sem prova.

1. **Câmera:** `iso` instala uma câmera perspectiva de FOV 42°, yaw/pitch de 45°,
   distância inicial 11,5 e limites 6–19. Não é projeção ortográfica. O foco segue
   o jogador, sem limite de mapa ou compensação da área útil entre painéis.
   Há troca do objeto câmera e restauração ao alternar para terceira pessoa;
   acrescentar outro controlador no mesmo objeto reintroduziria disputa.
2. **Controles:** WASD/setas são relativos à câmera somente em terceira pessoa;
   no modo elevado seguem X/Z do mundo. A nova projeção precisa de um adaptador
   explícito de direção de tela para chão, seguido de normalização diagonal.
3. **Posição autorizada:** o cliente aplica posição própria do servidor apenas
   no spawn. Correções posteriores não reconciliam continuamente o jogador local.
   Reconectar na mesma sessão também não força essa reconciliação.
4. **Colisões:** cliente usa teste por eixo; servidor usa varredura. Limites
   locais ±12,5/±8,1 diferem dos limites de servidor ±12,8/±8,6.
   O catálogo de obstáculos cobre mesas/divisória/recepção/sofá, não todas as
   cadeiras e plantas desenhadas. Cenário e footprint estão codificados separados.
5. **Animação bloqueada:** cliente usa input para walk/run; servidor usa distância
   solicitada antes da resolução. Um personagem contra a mesa pode andar no lugar.
6. **Interação ausente:** existe clip sit na prévia, mas não estado seatId,
   ocupação, sentar/levantar/usar computador no protocolo. `remotePlayers`
   normaliza tudo fora walk/run para idle. A tecla E abre reunião LiveKit por
   proximidade, não senta. Interações serão extensão pequena, não mera troca visual.
7. **Aparência em reconexão:** o efeito de conexão não depende de avatar; atualizações
   são enviadas à conexão aberta. A função de reentrada pode reusar o avatar
   capturado antes de alterações. Mudanças durante desconexão precisam de teste
   e reenvio da aparência atual na retomada.
8. **Persistência:** ampliar o catálogo exige mapeamento compatível. Introduzir
   schemaVersion=2 agora seria rejeitado pelo banco e validator atuais.
9. **Arte:** GLBs atuais têm roupa/cabelo fundidos; estudos novos foram rejeitados.
   Não há spritesheets finais, oito direções ou camadas ilustradas prontas.
   Arte 2D precisa de produção e aprovação; um pipeline não equivale a arte final.
10. **Profundidade:** sprites transparentes em um motor 3D não resolvem oclusão
    automaticamente. Testar profundidade pelo pé, alturas, paredes e mesas.
11. **Desempenho:** eliminar rig/GLB pode reduzir custo por jogador, mas atlases
    grandes, sobreposição transparente e muitas camadas podem elevar memória/draw
    calls. Não presumir que 2.5D ficará rápido sem medir.
12. **Documentação antiga:** README ainda promete opções de cabelo e bases que
    não correspondem ao editor atual. O plano usa código e testes como evidência.

## Escolha: opção B, 2.5D no motor existente

| Critério | A: novo renderizador 2D | B: Three.js + ortográfica + sprites |
| --- | --- | --- |
| Rede, coordenadas e áudio | Precisam adaptadores | Mantidos no plano X/Z |
| Cenário e colisões atuais | Reconstrução de mapa/render | Reuso e extração incremental |
| Profundidade | Ordenação própria de todos os objetos | Depth buffer + regra explícita para sprites |
| Custo/risco inicial | Maior troca de infraestrutura | Menor superfície de mudança |
| Limite | Mais trabalho antes de validar multiplayer | WebGL e transparência ainda exigem cuidado |

Escolha B. Preservar React/R3F, servidor Colyseus e Supabase. Introduzir um
renderizador alternativo atrás de uma flag de apresentação **local**, sem gravar
a flag no perfil e sem mudar as mensagens. A versão 3D permanece selecionável
para rollback; terceira pessoa não controla a câmera do renderizador novo.

### Separação proposta

- `WorldState`: coordenadas, direção, aparência e estado recebidos/previstos.
- `WorldLayout`: IDs estáveis, footprints, alturas e futuros pontos de interação.
- `IsoProjection`: conversão de direção da tela para X/Z e projeção apenas visual.
- `IsoCamera`: único dono da câmera ortográfica; yaw fixo de 45° e inclinação
  isométrica derivada da projeção (aprox. 35,264° para isometria exata).
- `SpriteAvatar`: atlas por base, direção e ação; pivot comum nos pés; frame único
  sincronizando todas as camadas. Sem espelhamento automático de itens assimétricos.
- `SpriteCatalog`: frames, dimensões lógicas, pivot, FPS, duração, looping,
  compatibilidade e ordem por direção/ação. Catálogo versionado, sem URLs do usuário.
- `AvatarAppearanceAdapter`: traduz AvatarConfig v1 para IDs de sprites. Defaults
  apenas de renderização, sem apagar valores antigos incompatíveis.

Arquivos candidatos novos: `components/isometric/{IsoWorld,IsoCamera,SpriteAvatar}`,
`lib/isometric/{projection,spriteCatalog,appearanceAdapter}`. Extrair partes do
controlador em commits próprios somente se necessário; não refatorar o backend.

### Câmera e profundidade

O tamanho ortográfico é definido em unidades de mundo, ajustado à área útil entre
painéis e ao aspect ratio. Inicializar foco no spawn autorizado antes de exibir
o mundo; suavizar apenas deslocamento contínuo. Entrada/troca de sala/reconexão
explicitam reset do foco. Zoom limitado em unidades visíveis, sem enquadramento
automático da sala inteira. Restringir foco pelo mapa e tratar o caso em que o
viewport é maior que o mapa, sem expulsar o jogador da área visível.

Piso e móveis baixos usam geometria simplificada e profundidade real. Sprites
se ancoram no chão; profundidade de ordenação é calculada pela posição do pé no
eixo de visão, não pelo centro da imagem nem por Y de pixels. Camadas do mesmo
avatar usam offsets mínimos e ordem do catálogo. Preferir recorte alpha/depth
test; validar paredes/mesas com testes antes de escolher o material definitivo.
Objetos altos podem ser divididos em base/copa e paredes receber fade local
quando bloqueiam o jogador. Não confiar apenas em renderOrder para oclusão 3D.

### Contrato de arte

Duas bases ilustradas, mesma escala e ponto de pé, oito direções reais, animações
idle/walk/sit/stand/interact. Todas as camadas compartilham registro e relógio.
Atlases com padding contra bleeding, cache de texturas por recurso e descarte
somente quando não houver consumidores. Cores por máscaras autorizadas pelo
artista; não tingir olhos/roupa/pele indiscriminadamente.

Na Etapa B, usar marcadores de teste claramente identificados. Na D, apresentar
uma prévia das duas bases antes da produção completa de roupas. Ferramenta de
geração de imagem pode ajudar na ilustração, mas não garante spritesheet coerente;
é obrigatório revisar registro, direções e continuidade, sem alegar arte final
quando o material for provisório.

## Sequência proposta e critérios de aceite

| Etapa | Alteração limitada | Verificação para concluir |
| --- | --- | --- |
| B, após aprovação | Novo modo opt-in, cenário simples reaproveitado, câmera ortográfica e adaptador de input | Spawn/refresh/resize, oito direções, diagonal normalizada, colisão, zoom, limites e orientação invariável |
| C | Ligar novo renderizador aos mesmos snapshots e sockets; corrigir reconciliação se reproduzida | Dois navegadores independentes se veem/andam; terceiro recebe snapshot; saída e reconexão sem duplicação |
| D | Integrar bases e atlases de animação; apresentar arte para aprovação | Oito direções, pés estáveis, oclusão, idle/walk; states sit/stand/interact só ativados com suporte do servidor |
| E | Camadas, miniaturas e prévia no editor, adaptador v1; persistência existente | Troca de roupa local/remota, reload, mesma aparência; roupas padrão e combinações compatíveis |
| F | Polimento, interação autoritativa, testes completos e desempenho | Disputa de assento, rejeição à distância, levantar/desconectar libera cadeira; múltiplas resoluções e 20 jogadores |

Interações exigem extensão aditiva revisada: catálogo de chairId/objectId,
estado replicado de ocupação/ação, validação de distância/permissão, bloqueio
de movimento sentado e liberação na saída. Não há necessidade inicial de tabela
nova no banco. Planejar versões compatíveis se clientes antigos coexistirem.

Antes de ultrapassar as opções do AvatarConfig v1, propor separadamente migração
versionada do validator e da constraint SQL; manter valores antigos e estratégia
de leitura compatível. Sem essa necessidade, não tocar no banco.

Cada etapa terá commits pequenos, relatório próprio e retorno imediato ao renderer
3D via flag. Nenhum deploy de migração sem validação e autorização correspondentes.

## Testes de baseline desta execução

| Verificação executada | Resultado |
| --- | --- |
| `npm test`, web 3000 + Colyseus 2567 em desenvolvimento | **18/18 passaram**: validação, colisões, recursos GLB, importador, API e sockets |
| `npm run test:e2e -- --output=/tmp/azzo-isometric-baseline-e2e` | **6/6 passaram** em Chromium, 3,5 min |
| `npm run typecheck` | Passou, incluindo compilação do servidor |
| `npm run format:check` | Passou |
| `npm run build` | Passou, servidor e Next, 14 páginas geradas |
| `npm run test:production`, processos locais 3001/2568 | **4/4 passaram**: demo oculta, token sem sessão negado, convidado negado, readiness e CORS |
| `npm run test:db` | **Falhou na infraestrutura de espera**: socket PostgreSQL ausente durante inicialização |
| Mesmos arquivos SQL, manualmente após prontidão estável, PostgreSQL 17 isolado | **Passou**: workspaces, perfis, reuniões, convites e RLS |

Os testes de navegador exercitaram: primeiro frame da câmera, seguimento WASD,
orientação fixa, 30 s parado, zoom, troca de câmera, resize, reload e reentrada;
dois contextos independentes com sockets reais, entrada tardia do segundo cliente,
movimento bidirecional, aparência alterada em outra aba, desconexão, reconexão
mantendo sessionId, saída e nova entrada. Também editor, persistência local e
layouts móveis. O teste de câmera atual exige perspectiva; manter como regressão
3D e adicionar um teste próprio da ortográfica na B, sem simplesmente mudar a
asserção para ocultar regressões.

**Não reproduzidos nesta execução:** câmera travada no ingresso e invisibilidade
do segundo jogador. Isso não exclui problemas na implantação real ou em condições
de rede diferentes. Testes passaram em demo local; não foram usadas sessões
Supabase de produção. Terceiro cliente simultâneo, carga de 20 usuários, mídia
LiveKit real e persistência entre dispositivos não foram executados nesta etapa.
Sentar e usar computador não puderam ser validados como interações de rede porque
a funcionalidade autoritativa ainda não existe.

O script de banco verifica pg_isready durante a fase de inicialização, que pode
observar o servidor temporário do entrypoint e prosseguir antes do reinício final.
A segunda execução manual aguardou a mensagem de término da inicialização e
confirmou prontidão antes de aplicar os mesmos arquivos. Nenhuma alteração do
script foi feita na auditoria. O container de teste foi parado e removido pelo
modo `--rm`; continha somente fixtures descartáveis, reproduzíveis pelos scripts.

Revisão visual dos screenshots: cenário ainda 3D de materiais escuros, painéis
sobrepostos ao Canvas e avatares com acabamento irregular. Testes funcionais
passarem não significa que a direção artística esteja aprovada. O screenshot
de terceira pessoa mostra irregularidades na roupa/cabelo do modelo feminino;
a causa visual específica não foi isolada nesta auditoria de migração.

Evidências locais: screenshots de câmera em
`/tmp/azzo-isometric-baseline-e2e/elevated-camera-elevated-c-0e691-d-orientation-and-lifecycle/`,
dois clientes em `/tmp/azzo-multiplayer-two-clients.png`, screenshots da execução
arquivados em `/tmp/azzo-audit-generated-screenshots-20261019.tar.gz`.
Os PNGs versionados foram restaurados após o teste para não incluir ruído no commit.

### Reprodução dos checks de segurança locais

Após encerrar o dev e executar `npm run build`, iniciar em terminais separados:

```sh
node node_modules/next/dist/bin/next start apps/web -p 3001
NODE_ENV=production PORT=2568 ALLOW_DEV_GUESTS=true ALLOWED_ORIGINS=https://azzo-room.example node apps/game-server/dist/index.js
npm run test:production
```

Esses testes esperam **ausência de credenciais de produção** e serviços locais.
Não executar com credenciais reais esperando o mesmo resultado de readiness.
Não houve deploy, atualização de dependências ou conexão a banco de produção.

## Próximo passo

Aguardar aprovação explícita da proposta e da Etapa B. Esta etapa não cria
sprites, altera a câmera, substitui avatares ou executa migração de dados.
