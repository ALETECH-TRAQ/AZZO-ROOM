import { test, expect, type Page } from "@playwright/test";

async function probe(page: Page) {
  await page.addInitScript(() => {
    const observed = new WeakSet();
    (window as any).__iso = null;
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      renderers: new Map(),
      inject() {
        return 1;
      },
      on() {},
      off() {},
      sub() {
        return () => {};
      },
      onCommitFiberUnmount() {},
      onCommitFiberRoot(_id: number, root: any) {
        const visit = (fiber: any) => {
          if (!fiber) return;
          const state = fiber.memoizedProps?.value?.getState?.();
          if (state?.gl && state?.scene && !observed.has(state.gl)) {
            observed.add(state.gl);
            const original = state.gl.render;
            state.gl.render = function (scene: any, camera: any) {
              const player = scene.getObjectByName("local-player");
              if (player) {
                const target = camera.position
                  .clone()
                  .set(player.position.x, 1.1, player.position.z);
                camera.updateMatrixWorld();
                (window as any).__iso = {
                  ortho: camera.isOrthographicCamera === true,
                  q: camera.quaternion.toArray(),
                  zoom: camera.zoom,
                  player: player.position.toArray(),
                  camera: camera.position.toArray(),
                  sprite: Boolean(
                    scene.getObjectByName("isometric-sprite-avatar"),
                  ),
                  projected: target.project(camera).toArray(),
                  right: camera.matrixWorld.elements.slice(0, 3),
                  up: camera.matrixWorld.elements.slice(4, 7),
                };
              }
              return original.call(this, scene, camera);
            };
          }
          visit(fiber.child);
          visit(fiber.sibling);
        };
        visit(root.current);
      },
    };
  });
}
const frame = (page: Page) => page.evaluate(() => (window as any).__iso);

test("orthographic opt-in: screen directions, follow, zoom, resize, reload and rollback", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await probe(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/avatar?demo=1");
  await page
    .getByRole("button", { name: "Salvar avatar", exact: true })
    .click();
  await page.goto("/app?demo=1&view=isometric");
  await expect(page.locator(".pill.online")).toHaveText("Online");
  await expect.poll(async () => (await frame(page))?.ortho).toBe(true);
  await expect.poll(async () => (await frame(page))?.sprite).toBe(true);
  const initial = await frame(page);
  for (const [key, x, y] of [
    ["w", 0, 1],
    ["s", 0, -1],
    ["a", -1, 0],
    ["d", 1, 0],
    ["ArrowUp", 0, 1],
    ["ArrowDown", 0, -1],
    ["ArrowLeft", -1, 0],
    ["ArrowRight", 1, 0],
  ] as const) {
    const before = await frame(page);
    await page.keyboard.down(key);
    try {
      await expect
        .poll(async () => {
          const after = await frame(page);
          return Math.hypot(
            after.player[0] - before.player[0],
            after.player[2] - before.player[2],
          );
        })
        .toBeGreaterThan(0.25);
    } finally {
      await page.keyboard.up(key);
    }
    const after = await frame(page);
    const dx = after.player[0] - before.player[0],
      dz = after.player[2] - before.player[2];
    if (x)
      expect((dx * after.right[0] + dz * after.right[2]) * x).toBeGreaterThan(
        0,
      );
    if (y) expect((dx * after.up[0] + dz * after.up[2]) * y).toBeGreaterThan(0);
    expect(after.q).toEqual(initial.q);
  }
  for (const [keys, x, y] of [
    [["w", "d"], 1, 1],
    [["w", "a"], -1, 1],
    [["s", "d"], 1, -1],
    [["s", "a"], -1, -1],
  ] as const) {
    const before = await frame(page);
    for (const key of keys) await page.keyboard.down(key);
    try {
      await expect
        .poll(async () => {
          const after = await frame(page);
          return Math.hypot(
            after.player[0] - before.player[0],
            after.player[2] - before.player[2],
          );
        })
        .toBeGreaterThan(0.25);
    } finally {
      for (const key of [...keys].reverse()) await page.keyboard.up(key);
    }
    const after = await frame(page);
    const dx = after.player[0] - before.player[0],
      dz = after.player[2] - before.player[2];
    expect((dx * after.right[0] + dz * after.right[2]) * x).toBeGreaterThan(0);
    expect((dx * after.up[0] + dz * after.up[2]) * y).toBeGreaterThan(0);
    expect(after.q).toEqual(initial.q);
  }
  await page.mouse.move(700, 550);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(850, 450, { steps: 5 });
  await page.mouse.up({ button: "right" });
  await page.keyboard.press("v");
  expect((await frame(page)).q).toEqual(initial.q);
  expect((await frame(page)).ortho).toBe(true);
  await page.mouse.wheel(0, -1200);
  await expect.poll(async () => (await frame(page)).zoom).toBeGreaterThan(1.6);
  expect((await frame(page)).zoom).toBeLessThanOrEqual(1.7);
  await page.mouse.wheel(0, 2400);
  await expect.poll(async () => (await frame(page)).zoom).toBeLessThan(0.8);
  expect((await frame(page)).zoom).toBeGreaterThanOrEqual(0.7);
  await page.waitForTimeout(600);
  const stable = await frame(page);
  await page.waitForTimeout(1000);
  expect((await frame(page)).q).toEqual(stable.q);
  expect((await frame(page)).camera[0]).toBeCloseTo(stable.camera[0], 2);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(500);
  expect(Math.abs((await frame(page)).projected[0])).toBeLessThan(0.8);
  expect(Math.abs((await frame(page)).projected[1])).toBeLessThan(0.3);
  await page.screenshot({ path: "/tmp/azzo-isometric-prototype.png" });
  await page.reload();
  await expect(page.locator(".pill.online")).toHaveText("Online");
  await expect.poll(async () => (await frame(page))?.ortho).toBe(true);
  expect((await frame(page)).q).toEqual(initial.q);
  await page.getByRole("button", { name: "Voltar à visão 3D" }).click();
  await expect.poll(async () => (await frame(page))?.ortho).toBe(false);
  await page.getByRole("button", { name: "Testar visão isométrica" }).click();
  await expect.poll(async () => (await frame(page))?.ortho).toBe(true);
  expect((await frame(page)).q).toEqual(initial.q);
  expect(errors).toEqual([]);
});
