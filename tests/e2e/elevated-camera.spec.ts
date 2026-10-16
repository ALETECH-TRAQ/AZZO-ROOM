import { expect, test, type Page } from "@playwright/test";

// Observe the actual renderer through React's DevTools protocol. No test hooks or
// debugging endpoints are shipped in the application.
async function observeCamera(page: Page) {
  await page.addInitScript(() => {
    const probe = { frames: [] as any[], player: null as any };
    (window as any).__cameraProbe = probe;
    const renderers = new Map();
    const observed = new WeakSet();
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      renderers,
      on() {},
      off() {},
      sub() {
        return () => {};
      },
      inject(renderer: any) {
        const id = renderers.size + 1;
        renderers.set(id, renderer);
        return id;
      },
      onCommitFiberUnmount() {},
      onCommitFiberRoot(_id: number, root: any) {
        const visit = (fiber: any) => {
          if (!fiber) return;
          const props = fiber.memoizedProps;
          if (props?.positionRef?.current?.x !== undefined) {
            probe.player = props.positionRef;
          }
          const state = props?.value?.getState?.();
          if (state?.gl && state?.scene && !observed.has(state.gl)) {
            const gl = state.gl;
            observed.add(gl);
            const render = gl.render;
            gl.render = function (scene: any, camera: any) {
              if (
                scene.getObjectByName("azzo-office-environment") &&
                probe.player
              ) {
                camera.updateMatrixWorld();
                const p = probe.player.current;
                const target = camera.position.clone().set(p.x, 1.1, p.z);
                const projected = target.clone().project(camera);
                const elements = camera.matrixWorld.elements;
                probe.frames.push({
                  id: camera.uuid,
                  position: camera.position.toArray(),
                  quaternion: camera.quaternion.toArray(),
                  player: [p.x, p.z, p.yaw],
                  rightY: elements[1],
                  pitch: Math.asin(elements[9]),
                  distance: camera.position.distanceTo(target),
                  projected: projected.toArray(),
                  aspect: camera.aspect,
                  perspective: camera.isPerspectiveCamera === true,
                });
              }
              return render.call(this, scene, camera);
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

const latest = (page: Page) =>
  page.evaluate(() => (window as any).__cameraProbe.frames.at(-1));
const first = (page: Page) =>
  page.evaluate(() => (window as any).__cameraProbe.frames[0]);
function level(frame: any) {
  expect(frame.perspective).toBe(true);
  expect(
    Math.abs(frame.rightY),
    "screen-right must be horizontal in world space",
  ).toBeLessThan(1e-6);
  expect(frame.pitch).toBeCloseTo(Math.PI / 4, 6);
}
function centered(frame: any, tolerance = 0.02) {
  expect(Math.abs(frame.projected[0])).toBeLessThan(tolerance);
  expect(Math.abs(frame.projected[1])).toBeLessThan(tolerance);
}
async function ready(page: Page) {
  await expect.poll(async () => (await latest(page))?.perspective).toBe(true);
}

test("elevated camera: first rendered frame, follow, fixed orientation and lifecycle", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await observeCamera(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/avatar?demo=1");
  await page
    .getByRole("button", { name: "Salvar avatar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Entrar no escritório", exact: true })
    .click();
  await ready(page);
  const initial = await first(page);
  level(initial);
  centered(initial);
  expect(initial.distance).toBeCloseTo(11.5, 6);
  const orientation = initial.quaternion;
  // Initialization may replace the avatar position after camera layout effects.
  // Observe the very next rendered frame, without giving damping time to settle.
  const marker = await page.evaluate(() => {
    const probe = (window as any).__cameraProbe;
    probe.player.current = { ...probe.player.current, x: 2, z: 4 };
    return probe.frames.length;
  });
  await expect
    .poll(async () =>
      page.evaluate(() => (window as any).__cameraProbe.frames.length),
    )
    .toBeGreaterThan(marker);
  const positioned = await page.evaluate(
    (index) => (window as any).__cameraProbe.frames[index],
    marker,
  );
  level(positioned);
  centered(positioned, 1e-6);
  expect(positioned.distance).toBeCloseTo(11.5, 6);

  await page.screenshot({ path: testInfo.outputPath("initial.png") });

  // No V key has been used: every direction must move both avatar and camera.
  for (const key of ["a", "d", "w", "s"]) {
    const before = await latest(page);
    await page.keyboard.down(key);
    await expect
      .poll(
        async () => {
          const frame = await latest(page);
          return Math.hypot(
            frame.player[0] - before.player[0],
            frame.player[1] - before.player[1],
          );
        },
        { timeout: 15000 },
      )
      .toBeGreaterThan(0.65);
    const moving = await latest(page);
    await page.keyboard.up(key);
    level(moving);
    centered(moving, 0.15);
    expect(moving.quaternion).toEqual(orientation);
    expect(
      Math.hypot(
        moving.player[0] - before.player[0],
        moving.player[1] - before.player[1],
      ),
    ).toBeGreaterThan(0.4);
    expect(
      Math.hypot(
        moving.position[0] - before.position[0],
        moving.position[2] - before.position[2],
      ),
    ).toBeGreaterThan(0.2);
    await page.waitForTimeout(450);
  }
  await page.screenshot({ path: testInfo.outputPath("after-wasd.png") });

  // Neither free mouse movement nor right-drag rotates the elevated camera.
  await page.mouse.move(900, 600);
  await page.mouse.move(1050, 650);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(1150, 550, { steps: 6 });
  await page.mouse.up({ button: "right" });
  await page.waitForTimeout(200);
  expect((await latest(page)).quaternion).toEqual(orientation);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(900);
  const zoomed = await latest(page);
  expect(zoomed.distance).toBeLessThan(initial.distance - 1);
  level(zoomed);

  // Third-person still responds to right-drag; its state is restored independently.
  await page.keyboard.press("v");
  await expect.poll(async () => (await latest(page))?.id).not.toBe(initial.id);
  const third = await latest(page);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(1000, 650, { steps: 6 });
  await page.mouse.up({ button: "right" });
  await page.waitForTimeout(250);
  const thirdRotated = await latest(page);
  expect(thirdRotated.quaternion).not.toEqual(third.quaternion);
  await page.keyboard.press("v");
  await expect.poll(async () => (await latest(page))?.id).toBe(initial.id);
  const returned = await latest(page);
  level(returned);
  centered(returned);
  expect(returned.quaternion).toEqual(orientation);
  expect(returned.distance).toBeCloseTo(zoomed.distance, 2);
  await page.keyboard.press("v");
  await expect.poll(async () => (await latest(page))?.id).toBe(third.id);
  expect((await latest(page)).quaternion).toEqual(thirdRotated.quaternion);
  await page.keyboard.press("v");
  await expect.poll(async () => (await latest(page))?.id).toBe(initial.id);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect
    .poll(async () => (await latest(page))?.aspect)
    .toBeCloseTo(1.6, 3);
  level(await latest(page));
  centered(await latest(page));
  await page.screenshot({ path: testInfo.outputPath("resized.png") });
  const idle = await latest(page);
  await page.waitForTimeout(30000);
  const afterIdle = await latest(page);
  level(afterIdle);
  expect(afterIdle.quaternion).toEqual(orientation);
  expect(afterIdle.distance).toBeCloseTo(idle.distance, 3);
  afterIdle.position.forEach((value: number, axis: number) => {
    expect(value).toBeCloseTo(idle.position[axis], 6);
  });
  const elevatedFrames = await page.evaluate(
    (id) =>
      (window as any).__cameraProbe.frames.filter(
        (frame: any) => frame.id === id,
      ),
    initial.id,
  );
  for (const frame of elevatedFrames) {
    level(frame);
    expect(frame.quaternion).toEqual(orientation);
  }

  // Real document reload: inspect the FIRST render again, not a settled frame.
  await page.reload();
  await ready(page);
  const reloaded = await first(page);
  level(reloaded);
  centered(reloaded);
  expect(reloaded.quaternion).toEqual(orientation);
  expect(reloaded.distance).toBeCloseTo(initial.distance, 6);

  await page.goto("/avatar?demo=1");
  await page
    .getByRole("button", { name: "Salvar avatar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Entrar no escritório", exact: true })
    .click();
  await ready(page);
  const reentered = await first(page);
  level(reentered);
  centered(reentered);
  expect(reentered.quaternion).toEqual(orientation);
  expect(errors).toEqual([]);
  await testInfo.attach("first-frame-camera.json", {
    body: JSON.stringify({ initial, reloaded, reentered }),
    contentType: "application/json",
  });
});
