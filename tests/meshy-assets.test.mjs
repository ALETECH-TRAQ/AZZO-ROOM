import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Box3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const directory = new URL("../assets/avatars/meshy/", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("manifest.json", directory), "utf8"),
);
for (const model of manifest.models) {
  test(`source-derived ${model.id} GLB: load, geometry integrity, grounded scale and explicit readiness`, async () => {
    const bytes = await readFile(new URL(model.file, directory));
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      model.sha256,
    );
    const gltf = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
    );
    const bounds = new Box3().setFromObject(gltf.scene);
    assert.ok(Math.abs(bounds.min.y) < 1e-5, "feet on ground");
    assert.ok(Math.abs(bounds.max.y - 2.4) < 1e-5, "correct avatar height");
    assert.ok(
      Math.abs(bounds.min.x + bounds.max.x) < 1e-5,
      "horizontal center",
    );
    assert.ok(Math.abs(bounds.min.z + bounds.max.z) < 1e-5, "depth center");
    let triangles = 0;
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      const position = o.geometry.attributes.position;
      for (const value of position.array) assert.ok(Number.isFinite(value));
      triangles += (o.geometry.index?.count || position.count) / 3;
      assert.equal(o.userData.source_sha256, model.source.sha256);
      assert.equal(o.userData.production_ready, false);
      assert.equal(o.isSkinnedMesh, undefined);
    });
    assert.equal(
      triangles,
      model.source.triangles,
      "source topology preserved",
    );
    assert.equal(
      gltf.animations.length,
      0,
      "never misrepresent absent animation clips",
    );
    assert.equal(manifest.productionReady, false);
  });
}

for (const id of ["central", "willow"]) {
  test(`runtime ${id}: optimized skinned asset and four clips`, async () => {
    const bytes = await readFile(
      new URL(`../apps/web/public/avatars/meshy/${id}.glb`, import.meta.url),
    );
    const gltf = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
    );
    let triangles = 0;
    let skinned = 0;
    let bones = 0;
    gltf.scene.traverse((object) => {
      if (object.isBone) bones += 1;
      if (!object.isMesh) return;
      if (object.isSkinnedMesh) skinned += 1;
      const position = object.geometry.attributes.position;
      triangles += (object.geometry.index?.count || position.count) / 3;
    });
    assert.equal(skinned, 1);
    assert.equal(bones, 16);
    assert.ok(triangles <= 40_000);
    assert.deepEqual(gltf.animations.map((clip) => clip.name).sort(), [
      "idle",
      "run",
      "sit",
      "walk",
    ]);
  });
}
