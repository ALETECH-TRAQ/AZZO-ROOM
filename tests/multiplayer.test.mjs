import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "@colyseus/sdk";
import { defaultAvatar } from "@azzo/avatar";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn) {
  const end = Date.now() + 6000;
  while (Date.now() < end) {
    if (fn()) return;
    await sleep(50);
  }
  throw new Error("Estado multiplayer não sincronizou");
}
test("dois clientes recebem presença, avatar, movimento e remoção", async () => {
  const c = new Client("http://127.0.0.1:2567");
  const a = await c.joinOrCreate("office", {
    officeId: "azzo-hq",
    userId: "test_a",
    avatar: { ...defaultAvatar, displayName: "Ana", hair: 7 },
  });
  let b;
  try {
    b = await c.joinOrCreate("office", {
      officeId: "azzo-hq",
      userId: "test_b",
      avatar: { ...defaultAvatar, displayName: "Bruno", hair: 6, skin: 5 },
    });
    await waitFor(
      () => a.state.players?.size === 2 && b.state.players?.size === 2,
    );
    assert.equal(JSON.parse(a.state.players.get(b.sessionId).avatar).hair, 6);
    b.send("avatar", { ...defaultAvatar, displayName: "Bruno", glasses: 4 });
    await waitFor(
      () => JSON.parse(a.state.players.get(b.sessionId).avatar).glasses === 4,
    );
    await sleep(150);
    b.send("move", { x: 0, z: 4.6, yaw: 0, animation: "walk" });
    await waitFor(() => a.state.players.get(b.sessionId).z < 5);
    assert.equal(a.state.players.get(b.sessionId).animation, "walk");
    await sleep(150);
    b.send("move", { x: 10000, z: 10000, yaw: 0 });
    await sleep(200);
    assert.ok(Math.abs(a.state.players.get(b.sessionId).x) < 3);
    b.send("avatar", { ...defaultAvatar, hair: 999 });
    await sleep(150);
    assert.equal(JSON.parse(a.state.players.get(b.sessionId).avatar).hair, 0);
    await b.leave();
    b = null;
    await waitFor(() => a.state.players.size === 1);
  } finally {
    if (b) await b.leave();
    await a.leave();
  }
});
test("nega entrada demo em outra empresa e identidade inválida", async () => {
  const c = new Client("http://127.0.0.1:2567");
  await assert.rejects(() =>
    c.joinOrCreate("office", { officeId: "empresa-alheia", userId: "test_a" }),
  );
  await assert.rejects(() =>
    c.joinOrCreate("office", { officeId: "azzo-hq", userId: "bad/identity" }),
  );
});
