# Migração 2.5D isométrica — Etapa B

## Entrega

Foi adicionado um protótipo opt-in de câmera isométrica ortográfica dentro do renderizador 3D existente. A versão 3D original, a câmera de terceira pessoa, o controlador de movimento, as colisões, o servidor e os dados persistidos permanecem preservados.

Ativação:

- abrir `/app?view=isometric`; ou
- entrar no escritório e clicar em **Testar visão isométrica**.

O botão **Voltar à visão 3D** restaura o modo anterior. A ativação também pode ser mantida pelo parâmetro da URL após recarregar a página.

## Implementação

- `apps/web/components/isometric/IsoCamera.tsx` cria uma câmera ortográfica própria, com orientação fixa, foco suave no jogador, zoom limitado por roda do mouse e enquadramento calculado pela área útil entre os painéis.
- `apps/web/components/OfficeWorld.tsx` conecta o protótipo sem alterar a câmera de terceira pessoa. WASD e setas usam os eixos da tela, diagonais são normalizadas e o input fica bloqueado até o spawn autorizado. As etiquetas HTML dos jogadores remotos são omitidas somente no protótipo para evitar o erro de desmontagem do `Html` do Drei durante reload/navegação; os avatares continuam presentes.
- `apps/web/components/OfficeApp.tsx` adiciona a ativação opt-in, o indicador de modo e o rollback para a câmera 3D.
- `tests/e2e/isometric-prototype.spec.ts` cobre direções cardinais, diagonais, zoom, acompanhamento, estabilidade, redimensionamento, reload e rollback.

Os avatares usados nesta etapa continuam sendo os recursos 3D existentes e estão identificados na interface como provisórios. A arte 2D, camadas de personalização e o novo renderizador multiplayer ficam para as etapas seguintes.

## Diagnóstico relevante

O comportamento distante da tentativa anterior vinha da câmera elevada em perspectiva e de seu enquadramento fixo. Esta etapa não usa o auto-fit do escritório: a câmera ortográfica acompanha o jogador e limita apenas o foco ao mapa. O protótipo também não herda a rotação do avatar.

## Validação

- `npm run typecheck` — passou.
- `GAME_TEST_URL=http://127.0.0.1:2572 npm test` — 18/18 testes passaram em servidor isolado; o isolamento evitou que clientes de suítes diferentes compartilhassem a mesma sala de demonstração.
- `npx playwright test tests/e2e/isometric-prototype.spec.ts` — passou no servidor isolado, incluindo diagonais e rollback.
- `tests/e2e/elevated-camera.spec.ts` — passou antes da última alteração, confirmando a preservação da câmera elevada/terceira pessoa.
- `npm run build` — passou (servidor e aplicação web).

O teste visual foi registrado em `/tmp/azzo-isometric-prototype.png`. A captura mostra o personagem próximo ao centro útil, com o escritório parcialmente visível e sem auto-fit distante.

## Próxima etapa

A Etapa C deve implementar e validar o multiplayer básico no novo renderizador. Nenhuma alteração de protocolo, banco de dados ou publicação foi feita nesta etapa.
