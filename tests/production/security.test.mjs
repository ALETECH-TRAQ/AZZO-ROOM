import test from "node:test";
import assert from "node:assert/strict";
import { Client } from "@colyseus/sdk";
test("produção oculta demo e nega token sem sessão", async () => {
  const h = await fetch("http://localhost:3001");
  assert.equal(h.status, 200);
  assert.equal((await h.text()).includes("Explorar demonstração"), false);
  const r = await fetch("http://localhost:3001/api/livekit/token", {
    method: "POST",
    body: JSON.stringify({
      mode: "office",
      officeId: "azzo-hq",
      userId: "test",
    }),
  });
  assert.equal(r.status, 403);
});
test("servidor de produção rejeita convidados mesmo com flag ligada", async () => {
  await assert.rejects(() =>
    new Client("http://localhost:2568").joinOrCreate("office", {
      officeId: "azzo-hq",
      userId: "test",
    }),
  );
});

test("readiness diferencia processo vivo de configuração ausente", async () => {
  const web = await fetch("http://localhost:3001/api/health");
  assert.equal(web.status, 503);
  assert.deepEqual((await web.json()).configuration, {
    authentication: false,
    multiplayer: false,
    media: false,
  });
  const live = await fetch("http://127.0.0.1:2568/healthz");
  assert.equal(live.status, 200);
  assert.equal((await live.json()).service, "azzo-room-game");
  const ready = await fetch("http://127.0.0.1:2568/readyz");
  assert.equal(ready.status, 503);
});
test("CORS do container não autoriza origem externa", async () => {
  const r = await fetch("http://127.0.0.1:2568/matchmake/joinOrCreate/office", {
    method: "OPTIONS",
    headers: {
      Origin: "https://outra-empresa.example",
      "Access-Control-Request-Method": "POST",
    },
  });
  assert.equal(r.headers.get("access-control-allow-origin"), "null");
  const allowed = await fetch(
    "http://127.0.0.1:2568/matchmake/joinOrCreate/office",
    {
      method: "OPTIONS",
      headers: {
        Origin: "https://azzo-room.example",
        "Access-Control-Request-Method": "POST",
      },
    },
  );
  assert.equal(
    allowed.headers.get("access-control-allow-origin"),
    "https://azzo-room.example",
  );
});
