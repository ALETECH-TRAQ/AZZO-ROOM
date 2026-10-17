# Avatares Meshy — implementação e auditoria

Os dois FBX fornecidos são as bases oficiais do editor e do escritório:

| Base no editor | Fonte | Fonte original | Runtime |
| --- | --- | ---: | ---: |
| Central | `Meshy_AI_Extract_the_central_m_1016144934_generate.fbx` | 92.090 triângulos | até 40.000 triângulos |
| Willow | `Meshy_AI_Willow_Doll_1016144851_generate.fbx` | 140.418 triângulos | até 40.000 triângulos |

## O que havia nos arquivos

Cada FBX continha uma única malha sem UV, material, imagem, esqueleto, peso ou animação. Cabelo, corpo e roupa estavam esculpidos na mesma malha. Os hashes, contagens e dimensões das fontes estão em `assets/avatars/meshy/manifest.json`.

## Implementação

- As fontes foram normalizadas para Y vertical, frente +Z, pés no chão e 2,4 unidades de altura.
- Cada base recebeu um esqueleto de 16 ossos, pesos de deformação e clips `idle`, `walk`, `run` e `sit`. A locomoção continua no controlador existente; os clips não usam root motion.
- Os modelos de runtime foram reduzidos para até 40 mil triângulos e são reutilizados pelo cache do loader do Three.js.
- A cor é pintada por pesos suaves nos vértices do GLB: pele, cabelo, parte superior e inferior. O material aplica os tons sem recortar triângulos a cada atualização. Calçados usam a altura dos vértices.
- Olhos e óculos são peças 3D separadas. Crachá, headset, mochila, café, relógio, boné, chapéu e colar usam pontos presos ao esqueleto.
- O cabelo permanece no formato esculpido em cada FBX. A seleção de cortes adicionais foi retirada porque as fontes não têm cabelo separado; perfis antigos são normalizados para o penteado original. A cor continua editável.
- O editor oferece somente Central e Willow. Perfis antigos com a base procedural `custom` são migrados para Central durante a validação.
- A mesma configuração validada é usada na prévia, no avatar local e nos avatares remotos. Alterações continuam salvas localmente e no perfil Supabase, e o protocolo Colyseus transmite a configuração completa.

## Limites conhecidos das fontes

As peças originais do corpo, cabelo e roupa não vieram separadas. Novos cortes e troca de modelagem das roupas precisam de malhas preparadas para encaixar nesses dois modelos. Esta correção mantém os cabelos esculpidos e usa regiões suaves por vértice para as cores; não inventa texturas autorais inexistentes. Os scripts e GLBs intermediários ficam versionados para refinamento posterior sem trocar os IDs dos perfis.

`assets/avatars/meshy/central.glb` e `willow.glb` preservam as fontes para auditoria. `apps/web/public/avatars/meshy/` contém os GLBs otimizados usados pelo site.

## Reproduzir os assets

```bash
blender -b -t 2 --python scripts/avatar/prepare_fbx.py -- \
  --central /caminho/Meshy_AI_Extract_the_central_m_1016144934_generate.fbx \
  --willow /caminho/Meshy_AI_Willow_Doll_1016144851_generate.fbx \
  --output assets/avatars/meshy
blender -b -t 2 --python scripts/avatar/rig_bases.py -- assets/avatars/meshy
blender -b -t 2 --python scripts/avatar/style_bases.py -- \
  assets/avatars/meshy apps/web/public/avatars/meshy
node --test tests/meshy-assets.test.mjs
```

Ponto de restauração anterior à tarefa: `azzo-before-meshy-avatars-20261016`.
