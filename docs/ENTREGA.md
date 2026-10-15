# Entrega — AZZO ROOM

Implementação em `/workspace/AZZO-ROOM`, a partir de todos os arquivos do ZIP. O repositório estava sem commits e sem arquivos; não havia código de usuário a substituir. O prompt mestre e as duas referências visuais foram preservados em `docs/`.

## Auditoria do kit

O starter continha um escritório procedural com avatar simples, movimento e câmera, servidor Colyseus com demo local e integração LiveKit opcional. Não existiam login, Avatar Studio, Supabase conectado ou persistência de aparência. O pacote não fornecia modelos GLB/GLTF editáveis. As imagens foram inspecionadas como referência; não foram apresentadas como avatares editáveis.

## Implementação por fase

| Fase | Entrega e evidência | Limites |
| --- | --- | --- |
| A — Identidade e entrada | Marca pública AZZO ROOM, arte de escritório derivada da referência, formulário HTML de login/cadastro/recuperação, navegação e validação. Screenshots desktop/mobile. | OAuth oculto; não há fornecedor configurado. |
| B — Avatar Studio | Avatar procedural real, preview 360°/zoom, 14 cabelos, 7 peles, 7 estados de óculos, roupas, acessórios, 14 presets, nome/pronome, proporções, aleatório/restaurar, poses idle/walk/run/sit, salvar antes de entrar. | Meshes procedurais com hierarquia de articulações/ancoragens; não são GLBs finais ou skinning de produção. |
| C — Auth e dados | Cliente Supabase, cadastro com confirmação, recuperação, onboarding, workspace criado pelo servidor, convites com hash/validade/e-mail/uso único, avatar persistido por usuário. Migrações executadas e isolamento testado em PostgreSQL. | Credenciais ausentes: login/e-mail e persistência entre navegadores não foram testados contra Supabase real. Sessões no armazenamento padrão do SDK, sem cookies HttpOnly. |
| D — Mundo compartilhado | Dois clientes Colyseus reais, avatar e movimento sincronizados, atualização de aparência sem reconectar via mensagem, limites de velocidade/payload e colisão com varredura para evitar atravessar divisórias, controles touch, câmera híbrida, reconexão 15s, recepção/lounge/duas áreas de reunião. | Sem prediction/rollback completo, física avançada, portas funcionais, assento contextual ou câmera com oclusão completa. Reconexão foi implementada; cenário de queda/reentrada não foi automatizado. |
| E — Comunicação | Token backend verifica sessão/membership e sala visível por RLS; sala geral e reuniões têm nomes distintos. Áudio por proximidade e interface LiveKit de vídeo/tela/chat preservados. Sem configuração, exibe indisponibilidade em vez de simular chamada. | Sem credenciais LiveKit: nenhuma chamada com dois dispositivos foi validada. Não há agendamento de reuniões. |
| F — Administração e piloto | Painel de membros, geração/revogação de convites, autorização owner/admin no banco, layout responsivo, testes, scripts de setup/start e documentação. Produção bloqueia demo. | Sem edição de papéis/expulsão, revogação imediata de sessões ativas, testes de carga, métricas em hardware real ou publicação. Não é uma entrega de produção concluída. |

## Validações executadas nesta máquina

- `bash scripts/setup.sh`: reinstalação por `npm ci` com lockfile e build completo aprovados.
- `bash scripts/dev.sh`: frontend e game server iniciados e fluxo funcional exercitado após reinício.
- `npm run build`: servidor e Next.js aprovados, 14 rotas geradas.
- `npm run typecheck`: aprovado.
- `npm test`: **7 testes aprovados**, nenhum ignorado: catálogo, payloads inválidos, colisões/varredura, token API, dois clientes e acesso indevido.
- `npm run test:e2e`: **4 testes aprovados**, nenhum ignorado. Validação do login/cadastro/recuperação, seis larguras (375, 390, 768, 1024, 1440, 1920), editor 3D, salvamento, recarga, entrada no escritório, movimento, câmera V e mobile.
- `npm run test:db`: migrações e assertions de RLS aprovadas em PostgreSQL 17 isolado. Empresas A/B, perfil de avatar privado, reunião privada, convites com e-mail, uso único e permissão de admin. O teste usa um esquema Auth mínimo com fixtures e não demonstra integração remota Supabase.
- `npm run test:production`: **2 testes aprovados** com instâncias locais em NODE_ENV=production: demo não aparece no login, token sem sessão recebe 403 e o game server recusa convidados mesmo com flag de demo ligada.
- `npm run format:check`: aprovado.

O download do Chromium pelo Playwright foi bloqueado pela política de rede. Foi usado o Chromium já instalado em `/usr/bin/chromium`; nenhum bypass de TLS, assinatura ou checksum foi aplicado.

## Capturas do resultado real

- `artifacts/login-desktop.png`
- `artifacts/login-mobile.png`
- `artifacts/avatar-desktop.png`
- `artifacts/avatar-mobile.png`
- `artifacts/office-desktop.png`

## Configuração reutilizável

Foram salvos no rascunho do ambiente `install_script`, `start_skill` e os nomes das variáveis necessárias. Nenhum valor secreto foi incluído. A gravação do rascunho não aplica credenciais, não publica o ambiente e não hospeda o site.

Para contas e comunicação reais, configure Supabase e LiveKit com valores seguros nas configurações do ambiente e os hosts reais na política de rede. Depois aplique as migrações no projeto, configure os callbacks e valide o fluxo com duas contas/dispositivos. As instruções completas estão em `README.md`.

## Preparação de publicação posterior

Depois do pedido de publicação, foram acrescentados `apps/web/vercel.json`, `render.yaml`, o Dockerfile do game server, restrição de origins e endpoints de health/configuração, além da migração de grants explícitos. O container foi construído e iniciado localmente com usuário node e health check healthy. Foram aprovados novamente build/typecheck, 7 testes de integração, 4 E2E e 4 testes de produção (incluindo CORS e configuração ausente), além das migrações/RLS em PostgreSQL isolado.

A construção local do Docker usou o proxy e o certificado CA fornecidos pela plataforma via argumentos de proxy e secret de build temporário; não houve desativação de TLS ou armazenamento de credenciais na imagem.

As APIs dos provedores externos retornaram bloqueio de rede e não há credenciais Vercel/Supabase/LiveKit/Render ativas. Os domínios e requisitos de tokens foram salvos no rascunho para configuração segura. Isso não criou projetos nem publicou o site. Veja `docs/PUBLICACAO.md`.
