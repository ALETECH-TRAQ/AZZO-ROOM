import * as THREE from "three";
import {
  clothingColors,
  hairColors,
  skins,
  type AvatarConfig,
} from "@/lib/avatars";

/** Continuous PBR pigmentation, sampled in bind space so cloth follows the rig. */
export function avatarMaterial(config: AvatarConfig) {
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.7,
    metalness: 0,
  });
  const values = {
    avatarSkin: { value: new THREE.Color(skins[config.skin]) },
    avatarHair: { value: new THREE.Color(hairColors[config.hairColor]) },
    avatarTop: { value: new THREE.Color(clothingColors[config.topColor]) },
    avatarBottom: {
      value: new THREE.Color(clothingColors[config.bottomColor]),
    },
    avatarEyes: { value: new THREE.Color(config.eyes) },
    avatarFemale: { value: config.base === "fem" ? 1 : 0 },
    avatarStyle: { value: config.top },
    avatarShorts: { value: config.bottom },
    avatarShoes: { value: config.shoes },
    avatarHairStyle: { value: config.hair },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, values);
    shader.vertexShader =
      "varying vec3 avatarPosition; uniform float avatarStyle;\n" +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      avatarPosition = position;
      float garmentRegion = smoothstep(1.03, 1.05, position.y) * (1.0 - smoothstep(1.62, 1.66, position.y));
      float garmentThickness = avatarStyle > 2.5 ? .018 : avatarStyle > .5 && avatarStyle < 1.5 ? .014 : .004;
      transformed += normal * garmentRegion * garmentThickness;`,
    );
    shader.fragmentShader =
      `varying vec3 avatarPosition;
      uniform vec3 avatarSkin,avatarHair,avatarTop,avatarBottom,avatarEyes;
      uniform float avatarFemale,avatarStyle,avatarShorts,avatarShoes,avatarHairStyle;
      float ellipse(vec2 p,vec2 radius) {return 1.0-smoothstep(.90,1.0,length(p/radius));}
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      vec3 p=avatarPosition; float ax=abs(p.x);
      vec3 pigment=avatarSkin;
      float legs=1.0-smoothstep(1.035,1.045,p.y);
      float legLength=mix(.17,.58,avatarShorts);
      float pants=legs*smoothstep(legLength,legLength+.008,p.y)*(1.0-smoothstep(.29,.32,ax));
      pigment=mix(pigment,avatarBottom,pants);
      float sleeve=mix(.36,.64,step(2.5,avatarStyle));
      float shirt=smoothstep(1.03,1.04,p.y)*(1.0-smoothstep(1.64,1.65,p.y));
      shirt*=1.0-smoothstep(sleeve,sleeve+.015,ax);
      float neck=ellipse(vec2(p.x,(p.y-1.69)*.6),vec2(.105,.09))*smoothstep(.01,.1,p.z);
      shirt*=1.0-neck;
      vec3 cloth=avatarTop;
      float front=smoothstep(.06,.11,p.z);
      float buttons=(1.0-smoothstep(.008,.013,ax))*front*step(.5,fract(p.y*11.0))*step(1.14,p.y)*step(p.y,1.57);
      if(avatarStyle<1.5)cloth=mix(cloth,vec3(.78),buttons*.7);
      float lapel=(1.0-smoothstep(.012,.022,abs(ax-(1.62-p.y)*.42)))*step(1.24,p.y)*front;
      if(avatarStyle>.5&&avatarStyle<1.5)cloth=mix(cloth,avatarTop*.55,lapel);
      float weave=sin(p.x*850.0)*sin(p.y*850.0)*.012;
      pigment=mix(pigment,cloth+weave,shirt);
      float shoes=1.0-smoothstep(.17,.18,p.y);
      pigment=mix(pigment,mix(vec3(.025,.035,.055),vec3(.8,.82,.78),avatarShoes),shoes);
      // Follow the sculpted hairline, including Willow's long lateral/back locks.
      float hairline=2.085-.13*smoothstep(.16,.32,ax)+.015*sin(p.x*20.0);
      float hair=smoothstep(hairline-.005,hairline+.005,p.y);
      hair=max(hair,smoothstep(-.02,.03,-p.z)*smoothstep(1.91,1.96,p.y));
      float locks=smoothstep(.205,.25,ax)*smoothstep(1.38,1.52,p.y)*(1.0-smoothstep(.03,.12,p.z));
      hair=max(hair,locks*avatarFemale);
      if(avatarHairStyle>.5&&hair>.5)discard;
      pigment=mix(pigment,avatarHair,hair);
      float eyeFront=smoothstep(.12,.18,p.z);
      vec2 eye=vec2(ax-.128,p.y-1.975);
      float sclera=ellipse(eye,vec2(.057,.073))*eyeFront;
      float iris=ellipse(eye,vec2(.031,.047))*eyeFront;
      float pupil=ellipse(eye,vec2(.016,.032))*eyeFront;
      pigment=mix(pigment,vec3(.92,.92,.86),sclera);
      pigment=mix(pigment,avatarEyes,iris);
      pigment=mix(pigment,vec3(.008),pupil);
      float glint=ellipse(eye-vec2(-.011,.023),vec2(.008))*eyeFront;
      pigment=mix(pigment,vec3(1.),glint);
      diffuseColor.rgb=pigment;
    `,
    );
  };
  material.customProgramCacheKey = () => "azzo-meshy-pbr-v1";
  return {
    material,
    update(c: AvatarConfig) {
      values.avatarSkin.value.set(skins[c.skin]);
      values.avatarHair.value.set(hairColors[c.hairColor]);
      values.avatarTop.value.set(clothingColors[c.topColor]);
      values.avatarBottom.value.set(clothingColors[c.bottomColor]);
      values.avatarEyes.value.set(c.eyes);
      values.avatarFemale.value = c.base === "fem" ? 1 : 0;
      values.avatarStyle.value = c.top;
      values.avatarShorts.value = c.bottom;
      values.avatarShoes.value = c.shoes;
      values.avatarHairStyle.value = c.hair;
    },
  };
}
