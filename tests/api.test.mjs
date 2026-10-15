import test from "node:test";
import assert from "node:assert/strict";
const url = "http://localhost:3000/api/livekit/token";
test("tokens rejeitam JSON inválido, tenant não autorizado e payload grande", async () => {
  for (const body of [
    "invalid",
    "null",
    "[]",
    JSON.stringify({ mode: "office", officeId: "bad/id" }),
    JSON.stringify({ padding: "x".repeat(5000) }),
  ]) {
    const r = await fetch(url, { method: "POST", body });
    assert.equal(r.status, 400);
  }
  const forbidden = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      mode: "meeting",
      officeId: "outra-empresa",
      userId: "fake",
    }),
  });
  assert.equal(forbidden.status, 403);
  const demo = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      mode: "office",
      officeId: "azzo-hq",
      userId: "guest_local",
    }),
  });
  assert.equal(demo.status, 503);
  assert.match((await demo.json()).error, /não estão configurados/);
});
