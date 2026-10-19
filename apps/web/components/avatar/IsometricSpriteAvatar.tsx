"use client";

import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import type { AvatarConfig } from "@/lib/avatars";
import type { Pose } from "./AvatarRenderer";

const DIRECTIONS = 8;
const FRAME_WIDTH = 1 / DIRECTIONS;
const spriteUrls = {
  masc: "/sprites/avatars/masc-base-8dir.png",
  fem: "/sprites/avatars/fem-base-8dir.png",
} as const;

type Props = {
  config: AvatarConfig;
  yaw: number;
  pose: Pose;
};

function directionFrame(camera: THREE.Camera, yaw: number) {
  const cameraForward = new THREE.Vector3();
  camera.getWorldDirection(cameraForward);
  cameraForward.y = 0;
  if (cameraForward.lengthSq() < 0.001) return 0;
  cameraForward.normalize();
  const towardCamera = cameraForward.clone().negate();
  const screenRight = new THREE.Vector3(-cameraForward.z, 0, cameraForward.x);
  const movement = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const angle = Math.atan2(
    movement.dot(screenRight),
    movement.dot(towardCamera),
  );
  return (
    ((Math.round(angle / (Math.PI / 4)) % DIRECTIONS) + DIRECTIONS) % DIRECTIONS
  );
}

export default function IsometricSpriteAvatar({ config, yaw, pose }: Props) {
  const { camera } = useThree();
  const texture = useTexture(
    spriteUrls[config.base === "fem" ? "fem" : "masc"],
  );
  const sheet = useMemo(() => {
    const copy = texture.clone();
    copy.wrapS = THREE.ClampToEdgeWrapping;
    copy.wrapT = THREE.ClampToEdgeWrapping;
    copy.repeat.set(FRAME_WIDTH, 1);
    copy.offset.set(0, 0);
    copy.colorSpace = THREE.SRGBColorSpace;
    copy.needsUpdate = true;
    return copy;
  }, [texture]);
  const sprite = useRef<THREE.Sprite>(null);
  const phase = useRef(0);

  useEffect(() => () => sheet.dispose(), [sheet]);

  useFrame((_, delta) => {
    const object = sprite.current;
    if (!object) return;
    const frame = directionFrame(camera, yaw);
    sheet.offset.x = frame * FRAME_WIDTH;
    const moving = pose === "walk" || pose === "run";
    phase.current += Math.min(delta, 0.1) * (moving ? 9 : 2);
    object.position.y = 1.22 + (moving ? Math.sin(phase.current) * 0.035 : 0);
    object.scale.y = moving ? 2.55 + Math.sin(phase.current) * 0.025 : 2.55;
  });

  return (
    <sprite
      ref={sprite}
      name="isometric-sprite-avatar"
      position={[0, 1.22, 0]}
      scale={[1.65, 2.55, 1]}
      userData={{
        renderer: "isometric-sprite",
        base: config.base,
        hair: config.hair,
        hairColor: config.hairColor,
        top: config.top,
        bottom: config.bottom,
        shoes: config.shoes,
        accessories: [...config.accessories],
        pose,
      }}
    >
      <spriteMaterial
        map={sheet}
        transparent
        alphaTest={0.12}
        depthWrite
        depthTest
      />
    </sprite>
  );
}
