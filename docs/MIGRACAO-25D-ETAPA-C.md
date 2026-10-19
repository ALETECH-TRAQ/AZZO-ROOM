# Migração 2.5D isométrica — Etapa C

## Entrega

O multiplayer básico foi validado no renderizador isométrico usando dois clientes independentes conectados à mesma sala Colyseus.

Cada cliente agora é verificado em quatro pontos do fluxo:

1. recebe o estado inicial e o jogador remoto;
2. renderiza o avatar remoto dentro da cena R3F isométrica;
3. recebe o movimento remoto pelo socket e o apresenta com interpolação;
4. remove o avatar quando o outro cliente sai da sala.

A sincronização continua usando o protocolo existente (`joinOrCreate`, `move` e `avatar`). Não houve mudança no backend, no banco, na autenticação, no formato persistido ou na câmera de terceira pessoa.

## Arquivos

- `tests/e2e/multiplayer.spec.ts`: o observador R3F passou a acompanhar o ciclo `gl.render`, que é onde a cena efetivamente muda, e ganhou o teste `isometric renderer: remote players enter, move and leave`.
- `apps/web/components/OfficeWorld.tsx`: o modo isométrico já usa os mesmos `RemoteAvatar` e interpolação do modo 3D; a etapa confirma esse caminho sem duplicar o controlador de rede.

Os avatares remotos continuam recebendo aparência, posição, yaw e animação a partir de `remotePlayers`. O servidor segue validando limites, velocidade, colisões e identidade da sala.

## Validação

- Teste dedicado de dois clientes no modo isométrico: passou.
- Testes de servidor multiplayer existentes: 18/18 passaram anteriormente em servidor isolado.
- O teste completo de sockets deve ser executado com uma instância limpa do servidor; durante a execução conjunta, reservas de reconexão de clientes de demonstração (15 segundos) contaminaram a mesma sala e produziram uma falha de contagem. Isso foi identificado como interferência de execução, não como divergência de estado entre clientes.

## Próxima etapa

A Etapa D pode substituir os avatares provisórios por sprites cartoon 2D em oito direções, mantendo os mesmos identificadores de jogador e o mesmo transporte multiplayer.
