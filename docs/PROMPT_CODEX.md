# PROMPT MESTRE — AZZO ROOM
## Escritório virtual corporativo 3D com avatares totalmente personalizáveis

Você é um engenheiro de software sênior especializado em Next.js/React, TypeScript, jogos 3D web, WebRTC, multiplayer, UX de produtos SaaS e segurança multiempresa. Sua missão é construir o produto **AZZO ROOM**, da **AZZO TECH**, aproveitando o repositório inicial fornecido. Ele pode conter o nome antigo **AZZO SPACE**; a partir de agora, o **único nome público e comercial é AZZO ROOM**.

**INSTRUÇÕES INICIAIS OBRIGATÓRIAS:** examine todo o repositório, especialmente `README.md`, `docs/ARQUITETURA.md`, código em `apps/web` e `apps/game-server`, migrações SQL e as duas imagens em `docs/referencias/`. Faça um inventário do que realmente funciona antes de alterar arquivos. Preserve a estrutura funcional existente e implemente evoluções incrementais. Não substitua comportamento real por telas estáticas. Não afirme que algo foi implementado sem testar.

### Referências visuais obrigatórias

1. `docs/referencias/login-azzo-room.png` — aparência aprovada da página de entrada: escritório futurista cinematográfico à esquerda; formulário de login/cadastro translúcido à direita. **Toda ocorrência visual de nome deve ser AZZO ROOM.**
2. `docs/referencias/avatares-azzo-room.png` — moodboard aprovado de avatares em estilo 3D cartoon/chibi corporativo: exemplos de personagens masculinos e femininos, cabelos, tons de pele, óculos, roupas, acessórios e personagens em um escritório. **A imagem é uma referência estética 2D; não são modelos GLB prontos, rigados ou editáveis.** Será necessário modelar/criar ativos 3D reais ou iniciar com modelos procedurais e substituí-los por GLB/GLTF próprios/licenciados. Não apresente recortes da imagem como “avatar 3D editável”.

---

## 1. VISÃO DO PRODUTO

Criar uma plataforma web onde empresas tenham escritórios 3D próprios, com colaboradores representados por avatares personalizáveis, controle híbrido de câmera (isométrica e terceira pessoa), presença multiplayer em tempo real, voz por proximidade, salas privadas de videoconferência, compartilhamento de tela e convites a visitantes.

**Referências de experiência:** colaboração espontânea do Gather + navegação amigável de jogo 3D + recursos profissionais de videoconferência. A estética deve ser uma **experiência corporativa premium e acolhedora, não um jogo de combate**.

**Idioma principal:** português do Brasil. **Branding:** AZZO ROOM no título da aplicação, interface, login, onboarding, telas de reunião, metatags, documentação de uso e nomes visíveis. Submarca discreta: “Uma plataforma da AZZO TECH”. Não renomear indiscriminadamente nomes internos de banco, chaves ou rotas em produção sem planejar compatibilidade/migração; atualizar nomes técnicos somente onde seguro.

## 2. STACK / ARQUITETURA

- Frontend: Next.js App Router, React, TypeScript, React Three Fiber, Three.js; CSS/Tailwind conforme o starter e sem dupla stack desnecessária.
- 3D: modelos `glb/gltf`, `@react-three/drei`, animações `AnimationMixer`/`useAnimations`, otimização com Draco/Meshopt quando apropriado; Blender para criar/editar assets de autoria própria.
- Multiplayer: servidor persistente **Colyseus** (respeitar a versão efetivamente instalada), validando movimentação e estados; cliente sincronizado por WebSocket com interpolação.
- Mídia: **LiveKit** para áudio, vídeo e screen share via WebRTC, com tokens de curta duração emitidos no backend.
- Autenticação e banco: **Supabase Auth + PostgreSQL com RLS**; separar usuários, workspaces, permissões, convites, configuração de avatar e salas.
- Deploy: frontend na Vercel; game server em host com WebSockets persistentes; Supabase e LiveKit nos seus serviços apropriados. Não assumir WebSocket persistente em funções serverless genéricas.
- Qualidade: TypeScript estrito, componentes reutilizáveis, tratamento de erros, acessibilidade, testes, logs básicos e variáveis de ambiente documentadas.

**Esquema de alto nível:**

`Navegador (Next.js + React Three Fiber)` → `Supabase Auth/Postgres (identidade, dados, RLS)`; → `Colyseus (posição, presença, zona, avatar, validação)`; → `LiveKit (microfone, vídeo, tela, canais autorizados)`.

O servidor deve autorizar cada conexão a partir de uma sessão real e do `workspaceId`; nunca confiar em IDs, papéis ou posições declarados pelo cliente como prova de permissão.

---

## 3. PRIORIDADE 0 — RENOMEAR DE AZZO SPACE PARA AZZO ROOM

1. Trocar todo **texto exibido ao usuário**, inclusive página inicial, título HTML, login, botões, HUD, cadastro, painel da empresa, mensagens e textos de ajuda, para **AZZO ROOM**.
2. Aplicar logotipo tipográfico “AZZO ROOM” conforme a referência: `AZZO` branco/claro, `ROOM` azul, letras bem espaçadas, composição elegante. Manter “Uma plataforma da AZZO TECH”.
3. Atualizar nomes e documentação sem quebrar importações, scripts, configurações de infraestrutura, links, migrações ou dados previamente existentes. Se forem necessários renames internos, criar uma etapa de migração explícita, com compatibilidade temporária.
4. Nenhuma tela ou UI final pode continuar com o nome AZZO SPACE. As imagens antigas do repositório podem existir só como referência histórica, jamais como branding publicado.

## 4. PRIORIDADE 1 — LOGIN E CADASTRO (FIEL AO MOCKUP)

Criar uma tela de autenticação **funcional**, com design desktop dividido: hero cinematográfico de escritório virtual noturno à esquerda (aprox. 55–60%) e card de login/cadastro glassmorphism escuro à direita (aprox. 40–45%). Usar `login-azzo-room.png` como referência. Construir campos e controles reais em React/HTML/CSS — não reproduzir o formulário com uma única imagem.

### Identidade visual

- Azul-marinho profundo, grafite, branco e azul elétrico/ciano em detalhes, gradiente azul no CTA; tipografia geométrica + Inter/alternativa legível.
- Hero: `AZZO ROOM`; `Seu escritório virtual em 3D.`; `Mais do que reuniões, um novo jeito de trabalhar.`; destaques para escritórios personalizados, reuniões mais humanas e colaboração.
- Imagem/cena de escritório com janelas panorâmicas, skyline e avatar corporativo ao fundo; animações leves, sem prejudicar tempo de carregamento.
- Card arredondado, translúcido, borda azul discreta, inputs altos, ícones, estados de foco, transição entre abas e microinterações; respeitar `prefers-reduced-motion`.

### Aba Entrar

Campos e ações: e-mail; senha com ícone mostrar/ocultar; `Lembrar de mim` com semântica real, se suportado; `Esqueceu sua senha?`; CTA **`Entrar no AZZO ROOM`**; opções Google e Microsoft **somente quando OAuth estiver configurado**; LinkedIn apenas se houver integração funcionando. Estados de loading, erro, sucesso e sessão expirada. Entrar deve levar ao workspace autorizado ou ao onboarding.

### Aba Criar conta

Campos: nome completo, e-mail, senha e confirmação; requisitos e validações claras. Após cadastro, escolher **Criar meu escritório** (cria workspace e define owner pelo servidor) ou **Entrar com convite** (aceita convite criptograficamente válido, com escopo e validade). Incluir confirmação de e-mail, recuperação de acesso, estados de convite inválido/expirado e links para Termos/Privacidade reais quando aplicáveis. Nunca conceder participação em empresas pela mera digitação de um nome.

**Rotas sugeridas:** `/login`, `/cadastro`, `/recuperar-senha`, `/auth/callback`, `/onboarding`, `/avatar`, `/app` (ou `/room`) e `/configuracoes/avatar`.

**Mobile:** tela de login prioriza o formulário, hero vira banner ou fundo otimizado, sem sobreposição ou scroll horizontal. Testar 375, 390, 768, 1024, 1440 e 1920px.

---

## 5. PRIORIDADE 2 — ESTÚDIO DE AVATARES 3D EDITÁVEIS

Este é um **recurso central do AZZO ROOM, não um extra opcional**. Seguir a linguagem visual da referência `avatares-azzo-room.png`: personagens 3D cartoon corporativos, proporções simpáticas com cabeça um pouco maior, olhos expressivos, mãos e pernas completas, materiais suaves, roupas modernas e variações suficientes para a equipe se reconhecer. Criar modelos masculinos e femininos **como presets de apresentação**, mas permitir que o usuário misture livremente cabelos, roupas e acessórios sem restringi-los por gênero. Não copiar rostos reais da referência e não fazer suposições automáticas sobre identidade do usuário.

### Catálogo inicial e opções mínimas

**Corpo e identidade:**
- Preset visual `Masculino`, `Feminino` ou `Personalizado` (apenas ponto de partida, não trava roupas/cabelos).
- Campo para nome exibido e pronome opcional.
- Ajustes moderados de estatura, proporções de corpo e forma do rosto, com limites para não quebrar roupas, colisões e animações.
- 7 tons de pele iniciais (muito clara, clara, média clara, média, morena, negra e negra escura), com materiais PBR consistentes e possibilidade de expandir a paleta.
- Opções de cor dos olhos, sobrancelhas e pequenos detalhes faciais; evitar aparência artificial quando renderizar de longe.

**Cabelos:**
- Pelo menos **7 modelos inicialmente associados à galeria masculina**: clássico com franja, moderno lateral, despenteado, ondulado, cacheado, curto e undercut.
- Pelo menos **7 modelos inicialmente associados à galeria feminina**: liso longo, liso médio, ondulado, cacheado, coque, meio preso e curto.
- Qualquer cabelo deve poder ser aplicado a qualquer avatar. Implementar opções de cores (preto, castanhos, loiro, ruivo, grisalho e alternativas discretas). Cada escolha deve atualizar **a geometria/material do avatar 3D imediatamente**.

**Óculos:** sem óculos, redondo, quadrado, retangular, aviador, moderno e esportivo. Escolhas posicionadas e ajustadas ao rosto em 3D.

**Roupas corporativas (variações para cada categoria):**
- Camisa social (branca, azul, preta, rosa e outras cores discretas).
- Blazer (preto, cinza, azul-marinho, bege).
- Polo (preta, azul, branca, verde etc.).
- Business casual (suéter, cardigan, camisa aberta/fechada, combinações de escritório).
- Executivo (terno completo, blazer com calça, conjunto executivo, vestido ou saia social opcional).
- Partes combináveis: topo, peça inferior e calçado, com validação de compatibilidade de malha e materiais. Criar variações com diferentes cortes, sem apenas pintar o corpo de outra cor.

**Acessórios:** crachá + cordão, headset/fone, bolsa ou mochila, copo de café, smartwatch; cada um pode ser ativado/desativado. Acessórios precisam aparecer como meshes presos ao osso/ponto correspondente do esqueleto, e não como sobreposição HTML. Copo de café pode ser um acessório de mão com animação opcional; headset não deve atravessar cabelo/orelhas.

**Presets de inspiração:** clássico, tech casual, executivo, criativo, business casual, feminina clássica, executiva, tech, criativa, minimalista, moderna, despojada e executiva sênior. Cada preset aplica uma combinação real e editável de peças. Entregar **pelo menos 14 presets prontos** distribuídos entre estilos variados.

### Interface do editor de avatares

- **Tela de criação obrigatória no primeiro acesso**, após autenticação/onboarding e antes de entrar pela primeira vez no escritório. Também acessível depois em `Perfil > Personalizar avatar`.
- Visual premium com painel de categorias à esquerda, **preview 3D em tempo real** ao centro (avatar inteiro, girável 360°, com zoom), e itens/presets à direita ou em galeria horizontal; adaptar para celular usando seções empilhadas.
- Categorias com abas: `Modelo`, `Pele`, `Rosto`, `Cabelo`, `Óculos`, `Roupas`, `Acessórios`, `Presets`.
- Para cada item, imagem/miniatura legível, nome, seleção ativa evidente; botões `Aleatório`, `Restaurar`, `Voltar`, `Salvar avatar` e `Entrar no escritório` (somente após salvar quando obrigatório).
- Pré-visualizar expressões e animações `Parado`, `Andando`, `Correndo`, `Sentado` no próprio editor; girar por drag e orbitar sem atravessar chão.
- Antes/depois da escolha: mudança suave e responsiva, sem recriar toda a cena a cada clique; sinalizar modelos pendentes de carregamento.
- No primeiro uso carregar um avatar padrão funcional, nunca uma tela vazia. Opções de personalização não podem ser controles decorativos.

### Implementação 3D obrigatória

- Criar um **rig/esqueleto base compartilhado** e malhas corporais com encaixes consistentes. Avatares e roupas/acessórios devem compartilhar pontos de ancoragem/bones. Para alternar roupas skinned, manter compatibilidade com a rig e poses.
- Arquivos GLB/GLTF de cabelos, corpos, roupas e acessórios armazenados em organização por catálogo, com `manifest` versionado contendo `id`, categoria, URL, variante, compatibilidade e ancoragens. Separar **configuração salva** dos arquivos 3D. Não serializar geometrias ou dados gigantes do avatar em banco e não permitir URL arbitrária enviada pelo usuário no MVP.
- Se os assets finalizados não estiverem disponíveis no repositório, iniciar com **avatares 3D procedurais realmente customizáveis** (geometrias R3F) e definir claramente quais itens ainda são placeholders. Deixar arquitetura para substituir cada mesh pelo GLB real sem alterar o formato do perfil.
- Animações: `idle`, `walk`, `run`, `sit` e, quando viável, `wave`/saudação. Usar máquina de estados de animação; transições suaves com crossfade; avatares remotos devem animar com base na movimentação sincronizada. Evitar custo alto com muitos skinned meshes, usar LOD/instancing quando fizer sentido.
- Colisores e velocidade dependem do avatar base e não devem permitir vantagens de movimento por trocar estatura/proporções.
- Padronizar estilo visual (cabeças, olhos, corpo, roupas) e garantir que avatares não atravessem a cadeira/mesa em uso.
- Otimizar para web: compressão de texturas, mesh simplificado, tamanhos de GLB sob controle, cache e fallback mobile; medir FPS/uso de memória antes de impor metas absolutas.

### Persistência e multiplayer de avatar

- Persistir configurações por `user_id` em `avatar_profiles` (ou campo JSONB versionado com validação) e opção de avatar por workspace se houver necessidade, com timestamp da atualização.
- **Configuração exemplo**, ajustável à base de dados real:

```json
{
  "schemaVersion": 1,
  "basePreset": "corporate_masc_01",
  "skinToneId": "skin_04",
  "hairStyleId": "hair_wavy_02",
  "hairColorId": "brown_dark",
  "eyeColorId": "brown",
  "glassesId": "round_black",
  "topId": "social_white",
  "bottomId": "pants_black",
  "shoesId": "shoes_classic_black",
  "accessoryIds": ["badge_blue", "smartwatch_black"],
  "heightScale": 1,
  "displayName": "Meu avatar"
}
```

- Validar no **servidor** catálogo permitido, ranges, comprimento de nomes, tamanho do payload e permissões. Nunca aceitar paths, script ou asset URL arbitrários.
- Ao salvar o avatar, refletir as mudanças no editor, no próprio personagem dentro do escritório e nos outros clientes conectados, enviando **IDs e parâmetros**, não meshes pela rede. Broadcast de alterações de avatar para os demais jogadores da mesma sala/empresa, com atualização visual sem desconexão e sem piscar o modelo inteiro.
- Em reconexões ou troca de sala, restaurar corretamente a aparência persistida, com avatar padrão seguro se algum item do catálogo tiver sido removido.
- Editor deve funcionar tanto com teclado/mouse quanto por toque.

**Critérios de aceite específicos:** escolher preset feminino, trocar por cabelo originalmente catalogado como masculino, mudar pele, roupa, óculos e mochila; o avatar **3D real** muda em cada operação. Salvar, atualizar a página e reconectar em outro navegador: a aparência continua igual. Dois jogadores veem as personalizações um do outro no ambiente ao mesmo tempo. Avatar executa idle/walk/run/sit sem peças flutuando.

---

## 6. PRIORIDADE 3 — ESCRITÓRIO 3D COM CÂMERA HÍBRIDA

- Mundo inicial com recepção AZZO ROOM, estações de trabalho, lounge, espaço de coworking e ao menos duas salas de reunião; objetos interativos, portas, sofá, monitores e decoração elegante.
- **Modo isométrico:** câmera elevada inclinada, visão estratégica do escritório, acompanha personagem suavemente.
- **Modo terceira pessoa:** câmera atrás do personagem, rotação suave e ajuste automático para evitar paredes.
- Tecla `V` e botão na HUD alternam os modos com transição de 0,4–0,8 s sem teleporte; o estado do jogador não deve ser reiniciado. Controles `WASD`/setas, `Shift` correr, `E` interagir; mouse/joystick no mobile.
- Colisões reais com cenário, portas e móveis. Personagens podem se aproximar e sentar em mesas/cadeiras com interação contextual.
- Exibir nome/avatar/indicador de voz acima de cada jogador; não sobrepor labels com câmera em zoom distante. Adicionar mini HUD com status da conexão, online, microfone, câmera, FPS/opções gráficas.
- Cenas otimizadas com objetos instanciados onde possível, sombras controladas, LOD e presets gráficos baixo/médio/alto.

## 7. PRIORIDADE 4 — MULTIPLAYER REAL E PRESENÇA

- Colyseus autoritativo. Cada sala identifica `workspaceId` e, se necessário, `instanceId`, validando sessão, membership e visibilidade.
- Sincronizar posição, rotação, estado (`idle/walk/run/sit`), zona, status online e **configuração compacta de avatar**; usar interpolação para usuários remotos.
- Prevenir speed hack, teleporte, posição fora do mapa, mensagens inválidas, flood e entrada em escritório não autorizado. Não confundir filtros de matchmaking com autorização.
- Reconexão, remoção de avatares fantasma, indicadores de desconexão, tratamento de versão incompatível do catálogo de avatares.
- Simular no mínimo dois clientes simultâneos em testes; perfis A/B isolados entre empresas distintas.

## 8. PRIORIDADE 5 — ÁUDIO POR PROXIMIDADE

- LiveKit com microfone acionado voluntariamente; **nunca ligar microfone/câmera automaticamente sem consentimento**.
- Para participantes autorizados no canal geral, aplicar volume por distância no plano x/z, com referência inicial: volume integral até 1,2 unidade e atenuação quadrática até 8 unidades, zerando ao ultrapassar alcance (parâmetros configuráveis). Exibir indicadores de fala, mic on/off, controle de volume e dispositivo.
- Tratar autoplay bloqueado, desconexão, reconexão e áudio duplicado/eco; testar com dois navegadores e fones.
- **Segurança:** silenciar localmente ou atenuar volume não torna uma conversa privada. Reuniões privadas usam **salas LiveKit separadas e tokens autorizados**.

## 9. PRIORIDADE 6 — SALAS DE REUNIÃO / APRESENTAÇÕES

- Ao chegar à mesa/porta, exibir `Pressione E para entrar na reunião` ou `Reservar sala`. Conferir autorização no servidor, inclusive para convidados com convite válido.
- Interface com participantes, grid de câmeras, microfone, câmera, compartilhamento de tela, sair, escolher dispositivos, chat e indicadores de quem está falando. Quando entrar, ingressar no canal LiveKit específico da reunião; não manter transmissão geral que viole privacidade.
- Agendamento e administração: título, horário, host, participantes, visitantes externos, permissões e encerramento. Permissões testadas no backend; não gravar áudio/vídeo/tela por padrão.
- Layout responsivo e possibilidade de manter jogo 3D em segundo plano com custo de render reduzido durante chamada.

## 10. PRIORIDADE 7 — CONTAS, EMPRESAS E ADMINISTRAÇÃO

- Supabase Auth real; `profiles`, `workspaces`, `workspace_members`, `workspace_invites`, `meeting_rooms`, `meeting_invites`, `avatar_profiles`, `avatar_catalog_items` (catálogo pode inicialmente ficar em arquivos versionados) e preferências do escritório.
- RBAC: `owner`, `admin`, `member`, `guest`; RLS adequada, autorização server-side, tokens LiveKit gerados após validação, segredos nunca no client; convites com prazo, revogação e escopo.
- Administração do workspace: membros, convites, salas, permissões, identidade visual da empresa e, futuramente, configurações visuais do escritório. Cada empresa isolada das demais.
- Demonstrar que usuários de uma empresa não leem posição, mídia privada, configurações de avatar não públicas ou registros de outra empresa.

## 11. INTERFACE, ANIMAÇÕES, MOBILE E ACESSIBILIDADE

- Visual coerente entre login, editor de avatares, lobby, HUD e reunião: fundo azul-marinho, superfícies glassmorphism moderadas, detalhes azuis e fonte de excelente legibilidade.
- Transições discretas e fluidas com GSAP/Framer Motion somente quando justificadas; não adicionar dependência sem necessidade. Respeitar preferência por movimento reduzido.
- Layout responsivo; em celular adaptar painéis para etapas/bottom sheet, preview do avatar ocupa espaço útil, controles touch e limites reais de desempenho do WebGL.
- UI com labels, foco visível, `aria-live`, operação por teclado e contraste acessível. Desabilitar itens ainda não disponíveis ou ocultá-los claramente, não usar botões falsos.
- Não carregar WebRTC, game server ou grandes GLBs no login antes de autenticar.

## 12. ESTRUTURA SUGERIDA

```text
apps/
  web/
    app/
      (auth)/login/
      (auth)/cadastro/
      onboarding/
      avatar/
      app/
      configuracoes/avatar/
      api/livekit/token/
    components/
      auth/
      avatar/AvatarEditor.tsx
      avatar/AvatarPreview3D.tsx
      avatar/AvatarCatalog.tsx
      avatar/AvatarRenderer.tsx
      office/OfficeWorld.tsx
      office/HybridCameraController.tsx
      meeting/
    lib/
      auth/
      avatars/catalog.ts
      avatars/schema.ts
      avatars/storage.ts
      multiplayer/
    public/models/avatars/
      base/
      hair/
      clothes/
      glasses/
      accessories/
  game-server/
    src/rooms/
    src/validation/
supabase/migrations/
docs/referencias/
  login-azzo-room.png
  avatares-azzo-room.png
```

Não reestruture apenas para reproduzir o desenho acima. Adapte ao projeto que já existe, mantendo imports e build funcionando. Nomes de arquivos são sugestões; contratos, modularidade e testes são requisitos.

## 13. CRITÉRIOS DE ACEITE E TESTES

1. Nenhum texto público usando AZZO SPACE; todos exibem **AZZO ROOM**.
2. Login e cadastro fiéis à imagem, com abas acessíveis, validação, auth real quando configurado e fluxos de convite corretos.
3. Editor 3D funcional com dois conjuntos de presets iniciais masculino/feminino e liberdade para misturar peças, sete tons de pele, 14 cabelos, sete estados de óculos (incluindo nenhum), cinco categorias de roupas com variações e cinco tipos de acessórios.
4. Seleções modificam **geometrias e/ou materiais reais em 3D**, não imagens estáticas. Preview gira e permite zoom.
5. Salvar → recarregar → entrar no escritório mantém aparência; mudar durante sessão propaga ao menos para outro jogador autenticado.
6. Avatar anima parado, andando, correndo e sentado; troca de câmera `V` suave, sem atravessar paredes.
7. Dois usuários da mesma empresa veem posições e avatares, usuários de empresas diferentes não.
8. Áudio por proximidade funciona com autorização e volume por distância, salas privadas não vazam mídia.
9. Videoconferência e compartilhamento de tela exigem permissão do navegador, acesso permitido e desligamento adequado.
10. Build/typecheck/testes básicos rodam; testar largura 390px e desktop; documentar limitações reais do starter e dos assets.

## 14. PLANO DE EXECUÇÃO OBRIGATÓRIO

**FASE A — Auditoria e identidade:** examinar starter, listar dependências e funcionalidades existentes, renomear textos para AZZO ROOM, aplicar nova tela login/cadastro de referência, implementar navegação e estados; fornecer screenshot do resultado real.

**FASE B — Avatar Studio jogável (prioridade alta):** criar editor 3D e catálogo local versionado, dois avatares base cartoon (presets masculino/feminino), 14 opções de cabelo, 7 tons de pele, 7 estados de óculos, roupas e acessórios, preview em tempo real, presets, salvar localmente para dev. O editor precisa operar com modelos procedurais quando não houver GLB final. NÃO ignorar essa fase.

**FASE C — Auth e dados:** integrar Supabase Auth, workspace e convites seguros, persistir o avatar por usuário, conectar fluxo primeiro login → criar/entrar na empresa → personalizar avatar → escritório. Testar isolamento.

**FASE D — Mundo compartilhado:** aprimorar escritório e câmera híbrida, rig/animator, Colyseus autoritativo, propagação de skins/roupas e reconexão de personagens.

**FASE E — Reuniões:** LiveKit com proximidade e salas privadas, vídeo, tela, permissões e convidados; testes com dois dispositivos.

**FASE F — Produto pronto para pilotos:** painel administrativo, indicadores de presença, otimizações, UX touch, testes e publicação segura em Vercel + servidor persistente + Supabase + LiveKit.

### Método de entrega

- **Comece agora pelas fases A e B**, sem pular a criação dos bonecos editáveis.
- Escreva código efetivo nos arquivos, sem responder apenas com ideias/pseudocódigo.
- Antes de cada mudança relevante, confira o que já existe e evite quebrar o starter.
- Ao final de cada fase, informar: arquivos criados/alterados, comandos executados, evidências de testes (`typecheck`, `build`, testes automáticos/manuais), recursos funcionais, recursos ainda simulados e requisitos de credenciais/serviços.
- Se estiver faltando um modelo 3D final ou licença de asset, **não diga que ele está pronto**; use temporariamente uma implementação procedural editável, documente e mantenha o componente apto a receber GLB definitivo.
- Manter segredos apenas no backend e um modo demo explícito apenas em ambiente de desenvolvimento. Não ativar permissões abertas em produção.

**AÇÃO IMEDIATA SOLICITADA:** leia o repositório e as duas referências visuais; apresente um plano técnico conciso; implemente a marca AZZO ROOM e a tela de login/cadastro, depois inicie o **Avatar Studio 3D realmente editável** com os presets e categorias do mockup. Não encerre o trabalho apenas alterando o nome de AZZO SPACE para AZZO ROOM.
