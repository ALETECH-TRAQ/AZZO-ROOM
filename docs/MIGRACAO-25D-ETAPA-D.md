# Migração 2.5D isométrica — Etapa D

## Entrega

Os avatares-base cartoon 2D foram integrados ao modo isométrico com oito direções de visualização:

- masculino;
- feminino;
- frente, diagonais, laterais e costas;
- escala e ponto de apoio consistentes;
- animação de caminhada com balanço visual suave;
- seleção de direção baseada na orientação da câmera e do movimento.

O modo 3D e a câmera de terceira pessoa continuam usando o `AvatarRenderer` original. O novo renderer só é ativado com `view=isometric`.

## Recursos criados

- `apps/web/public/sprites/avatars/masc-base-8dir.png`
- `apps/web/public/sprites/avatars/fem-base-8dir.png`
- `apps/web/components/avatar/IsometricSpriteAvatar.tsx`
- `scripts/avatar/prepare_sprite_assets.py`

As imagens foram geradas a partir da referência aprovada e passam por limpeza determinística de transparência antes de serem usadas pelo jogo. A spritesheet usa oito colunas e uma linha, com fundo transparente.

## Personalização

O componente já recebe o `AvatarConfig` completo e grava no objeto renderizado os identificadores de base, cabelo, cor de cabelo, roupa, calçado e acessórios. Esses dados continuam sendo persistidos e enviados pelo multiplayer sem alteração de contrato.

A aplicação visual das peças separadas será a Etapa E: ela precisa de folhas de camadas alinhadas para cada direção, evitando sobreposição incorreta de cabelos, roupas e acessórios. Nesta etapa, o foco foi substituir os corpos-base 3D provisórios por arte 2D direcional sem inventar camadas desalinhadas.

## Validação

- `npm run typecheck`: passou.
- Teste isométrico: passou, incluindo presença do objeto de sprite, oito direções, movimento, zoom, resize, reload e rollback.
- Teste multiplayer isométrico: passou com dois clientes, presença, movimento remoto e remoção.
- Regressão da câmera 3D/elevada: passou.

## Próxima etapa

A Etapa E deve transformar o catálogo existente em camadas de sprites equipáveis e aplicar as escolhas do editor ao avatar local e aos jogadores remotos, mantendo o mesmo `AvatarConfig` e o mesmo protocolo.
