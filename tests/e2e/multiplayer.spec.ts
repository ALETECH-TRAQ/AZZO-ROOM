import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { defaultAvatar } from "@azzo/avatar";
const fixtures = process.env.MULTIPLAYER_FIXTURES
  ? JSON.parse(readFileSync(process.env.MULTIPLAYER_FIXTURES, "utf8"))
  : null;

async function observe(page: Page) {
  await page.addInitScript(() => {
    const observed = new WeakSet();
    const renderers = new Map();
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      renderers,
      on() {},
      off() {},
      sub() {
        return () => {};
      },
      inject(r: any) {
        const id = renderers.size + 1;
        renderers.set(id, r);
        return id;
      },
      onCommitFiberUnmount() {},
      onCommitFiberRoot(_id: number, root: any) {
        function visit(f: any) {
          if (!f) return;
          const state = f.memoizedProps?.value?.getState?.();
          if (state?.scene && state?.gl && !observed.has(state.gl)) {
            observed.add(state.gl);
            (window as any).__networkScene = state.scene;
            const original = state.gl.render;
            state.gl.render = function (scene: any, camera: any) {
              (window as any).__networkScene = scene;
              return original.call(this, scene, camera);
            };
          }
          visit(f.child);
          visit(f.sibling);
        }
        visit(root.current);
      },
    };
  });
}
async function snapshot(p: Page) {
  return p.evaluate(() => {
    return [
      ...document.querySelectorAll<HTMLElement>(
        ".people-card .person[data-player-session]",
      ),
    ].map((element) => ({
      sessionId: element.dataset.playerSession,
      position: [
        Number(element.dataset.playerX),
        0,
        Number(element.dataset.playerZ),
      ],
      yaw: Number(element.dataset.playerYaw),
      animation: element.dataset.playerAnimation,
      base: element.dataset.avatarBase,
    }));
  });
}
const remote = async (p: Page) =>
  (await snapshot(p)).find((o: any) => o.sessionId);
async function enter(
  p: Page,
  index = 0,
  office = fixtures?.offices[0],
  view?: "isometric",
) {
  if (fixtures) {
    await observe(p);
    await p.addInitScript(
      ({ session, url, office, avatar }) => {
        localStorage.setItem(
          `sb-${new URL(url).hostname.split(".")[0]}-auth-token`,
          JSON.stringify(session),
        );
        localStorage.setItem("azzo-room-workspace", office);
        localStorage.setItem("azzo-room-avatar-v1", JSON.stringify(avatar));
      },
      {
        session: fixtures.users[index].session,
        url: fixtures.url,
        office,
        avatar: { ...defaultAvatar, displayName: fixtures.users[index].name },
      },
    );
    await p.goto("/app");
    await expect(p.locator(".pill.online")).toHaveText("Online", {
      timeout: 60000,
    });
    return;
  }
  await observe(p);
  await p.goto("/avatar?demo=1");
  await p.getByRole("button", { name: "Salvar avatar", exact: true }).click();
  if (view) {
    await p.goto(`/app?demo=1&view=${view}`);
  } else {
    await p
      .getByRole("button", { name: "Entrar no escritório", exact: true })
      .click();
  }
  await expect(p.locator(".pill.online")).toHaveText("Online");
}
test("real sockets: late join, separate spawns, bidirectional movement, camera and rejoin", async ({
  browser,
}) => {
  test.setTimeout(150000);
  const ca = await browser.newContext(),
    cb = await browser.newContext();
  const a = await ca.newPage(),
    b = await cb.newPage();
  try {
    await enter(a);
    await enter(b, 1);
    for (const p of [a, b]) {
      await expect(p.locator(".person")).toHaveCount(2);
      await expect(
        p.locator(".people-card .person[data-player-session]"),
      ).toHaveCount(1);
      await expect.poll(async () => Boolean(await remote(p))).toBe(true);
    }
    const seenByA = await remote(a);
    const seenByB = await remote(b);
    expect(
      Math.hypot(
        seenByA.position[0] - seenByB.position[0],
        seenByA.position[2] - seenByB.position[2],
      ),
    ).toBeGreaterThan(1);
    for (const [sender, receiver] of [
      [a, b],
      [b, a],
    ]) {
      const before = await remote(receiver);
      await sender.keyboard.down("w");
      await expect
        .poll(async () => {
          const r = await remote(receiver);
          return Math.hypot(
            r.position[0] - before.position[0],
            r.position[2] - before.position[2],
          );
        })
        .toBeGreaterThan(0.5);
      await expect
        .poll(async () => (await remote(receiver)).animation)
        .toBe("walk");
      await sender.keyboard.up("w");
      await expect
        .poll(async () => (await remote(receiver)).animation)
        .toBe("idle");
    }

    // Saving in the avatar editor emits a storage event in the active office.
    // The complete profile must cross the socket and replace the remote model.
    const editor = await ca.newPage();
    await editor.goto("/avatar?demo=1");
    await editor.evaluate(() => {
      const key = "azzo-room-avatar-v1";
      const profile = JSON.parse(localStorage.getItem(key)!);
      localStorage.setItem(
        key,
        JSON.stringify({
          ...profile,
          base: "fem",
          hair: 9,
          top: 3,
          accessories: [4, 7],
        }),
      );
    });
    await expect.poll(async () => (await remote(b)).base).toBe("fem");
    await editor.close();

    const id = (await remote(a)).sessionId;
    for (const p of [a, b]) {
      await p.keyboard.press("v");
      await expect(
        p.locator(".people-card .person[data-player-session]"),
      ).toHaveCount(1);
      await p.keyboard.press("v");
      await expect(
        p.locator(".people-card .person[data-player-session]"),
      ).toHaveCount(1);
    }
    await cb.setOffline(true);
    await expect(b.locator(".pill.online")).toContainText("Reconectando");
    await cb.setOffline(false);
    await expect(b.locator(".pill.online")).toHaveText("Online", {
      timeout: 30000,
    });
    await expect(a.locator(".person")).toHaveCount(2);
    expect((await remote(a)).sessionId).toBe(id);
    await b.goto("about:blank");
    await expect(a.locator(".person")).toHaveCount(1, { timeout: 30000 });
    await enter(b, 1);
    await expect(a.locator(".person")).toHaveCount(2);
    await expect(
      a.locator(".people-card .person[data-player-session]"),
    ).toHaveCount(1);
    await a.screenshot({ path: "/tmp/azzo-multiplayer-two-clients.png" });
    if (fixtures) {
      await b.goto("about:blank");
      await expect(a.locator(".person")).toHaveCount(1, { timeout: 30000 });
      await enter(b, 1, fixtures.offices[1]);
      await expect(b.locator(".person")).toHaveCount(1);
      await expect(a.locator(".person")).toHaveCount(1);
      await expect(
        b.locator(".people-card .person[data-player-session]"),
      ).toHaveCount(0);
    }
  } finally {
    await ca.close();
    await cb.close();
  }
});

test("isometric renderer: remote players enter, move and leave", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const ca = await browser.newContext();
  const cb = await browser.newContext();
  const a = await ca.newPage();
  const b = await cb.newPage();
  try {
    await enter(a, 0, fixtures?.offices[0], "isometric");
    await enter(b, 1, fixtures?.offices[0], "isometric");
    for (const p of [a, b]) {
      await expect(p.locator(".pill.online")).toHaveText("Online");
      await expect(p.locator(".people-card .person")).toHaveCount(2);
      await expect
        .poll(async () => {
          return await p.evaluate(() => {
            const scene = (window as any).__networkScene;
            let found = false;
            scene?.traverse?.((child: any) => {
              if (String(child.name).startsWith("remote-player:")) found = true;
            });
            return found;
          });
        })
        .toBe(true);
    }
    const before = await b.evaluate(() => {
      const scene = (window as any).__networkScene;
      let remote: any;
      scene?.traverse?.((child: any) => {
        if (!remote && String(child.name).startsWith("remote-player:"))
          remote = child;
      });
      return remote ? [remote.position.x, remote.position.z] : null;
    });
    expect(before).not.toBeNull();
    await a.keyboard.down("w");
    try {
      await expect
        .poll(async () => {
          const after = await b.evaluate(() => {
            const scene = (window as any).__networkScene;
            let remote: any;
            scene?.traverse?.((child: any) => {
              if (!remote && String(child.name).startsWith("remote-player:"))
                remote = child;
            });
            return remote ? [remote.position.x, remote.position.z] : null;
          });
          if (!after || !before) return 0;
          return Math.hypot(after[0] - before[0], after[1] - before[1]);
        })
        .toBeGreaterThan(0.25);
    } finally {
      await a.keyboard.up("w");
    }
    await expect.poll(async () => (await snapshot(b)).length).toBe(1);
    await a.goto("about:blank");
    await expect(b.locator(".people-card .person")).toHaveCount(1, {
      timeout: 30000,
    });
    await expect
      .poll(async () => {
        return await b.evaluate(() => {
          const scene = (window as any).__networkScene;
          let found = false;
          scene?.traverse?.((child: any) => {
            if (String(child.name).startsWith("remote-player:")) found = true;
          });
          return found;
        });
      })
      .toBe(false);
  } finally {
    await ca.close();
    await cb.close();
  }
});
