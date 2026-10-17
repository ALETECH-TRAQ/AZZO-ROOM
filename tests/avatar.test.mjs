import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultAvatar,
  validateAvatar,
  presets,
  hairs,
  skins,
  glasses,
  collides,
  resolveMovement,
} from "@azzo/avatar";
test("catálogo completo e presets válidos", () => {
  assert.equal(hairs.length, 14);
  assert.equal(skins.length, 7);
  assert.equal(glasses.length, 7);
  assert.ok(presets.length >= 14);
  for (const p of presets) assert.ok(validateAvatar(p.config), p.name);
});
test("rejeita payloads, IDs e dimensões inválidas", () => {
  for (const patch of [
    { hair: 14 },
    { skin: -1 },
    { height: Infinity },
    { height: 2 },
    { displayName: "" },
    { accessories: [0, 0] },
    { accessories: [99] },
    { glasses: 1.5 },
    { schemaVersion: 2 },
    { eyes: "javascript:alert(1)" },
    { pronoun: "a".repeat(25) },
  ])
    assert.equal(validateAvatar({ ...defaultAvatar, ...patch }), null);
  const sanitized = validateAvatar({
    ...defaultAvatar,
    url: "https://malicious.example/avatar.glb",
  });
  assert.equal(sanitized.url, undefined);
  assert.equal(
    validateAvatar({ ...defaultAvatar, base: "custom" }).base,
    "masc",
  );
  assert.equal(validateAvatar({ huge: "a".repeat(3000) }), null);
});
test("colisões de mesas, paredes internas e espaço livre", () => {
  assert.equal(collides(-9.3, -4.7), true);
  assert.equal(collides(7.6, -3.7), true);
  assert.equal(collides(5, 6), true);
  assert.equal(collides(0, 5), false);
  assert.equal(collides(0, 3), false);
});

test("movimento não atravessa divisórias com pacotes atrasados", () => {
  const p = resolveMovement(2, -4.6, 5, -4.6);
  assert.ok(p.x < 2.72);
  assert.equal(collides(p.x, p.z), false);
});
