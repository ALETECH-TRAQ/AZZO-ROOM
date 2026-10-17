import * as THREE from "three";
import {
  clothingColors,
  hairColors,
  skins,
  type AvatarConfig,
} from "@/lib/avatars";

/** Color_0 stores smooth hair, top and bottom weights authored on the GLB vertices. */
export function avatarMaterial(config: AvatarConfig) {
  const values = {
    avatarSkin: { value: new THREE.Color() },
    avatarHair: { value: new THREE.Color() },
    avatarTop: { value: new THREE.Color() },
    avatarBottom: { value: new THREE.Color() },
    avatarShoes: { value: new THREE.Color() },
  };
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.68,
    metalness: 0,
    vertexColors: true,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, values);
    shader.vertexShader =
      "varying vec3 avatarRegions; varying float avatarHeight;\n" +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <color_vertex>",
      "#include <color_vertex>\n avatarRegions = vColor; avatarHeight = position.y;",
    );
    shader.fragmentShader =
      `varying vec3 avatarRegions; varying float avatarHeight;
      uniform vec3 avatarSkin,avatarHair,avatarTop,avatarBottom,avatarShoes;
      ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
       float hairWeight=clamp(avatarRegions.r,0.0,1.0);
       float topWeight=clamp(avatarRegions.g,0.0,1.0);
       float bottomWeight=clamp(avatarRegions.b,0.0,1.0);
       float shoeWeight=(1.0-smoothstep(0.12,0.19,avatarHeight))*(1.0-hairWeight-topWeight-bottomWeight);
       float skinWeight=max(0.0,1.0-hairWeight-topWeight-bottomWeight-shoeWeight);
       diffuseColor.rgb=avatarSkin*skinWeight+avatarHair*hairWeight+avatarTop*topWeight+
         avatarBottom*bottomWeight+avatarShoes*shoeWeight;
      `,
    );
  };
  material.customProgramCacheKey = () => "azzo-avatar-vertex-regions-v2";
  function update(next: AvatarConfig) {
    values.avatarSkin.value.set(skins[next.skin]);
    values.avatarHair.value.set(hairColors[next.hairColor]);
    values.avatarTop.value.set(clothingColors[next.topColor]);
    values.avatarBottom.value.set(clothingColors[next.bottomColor]);
    values.avatarShoes.value.set(next.shoes === 1 ? "#e7edf4" : "#222a36");
  }
  update(config);
  return { material, update };
}
