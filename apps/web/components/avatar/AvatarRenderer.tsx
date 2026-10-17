"use client";
import { Suspense, useEffect, useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, createPortal } from "@react-three/fiber";
import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { skins, type AvatarConfig } from "@/lib/avatars";
import { avatarMaterial } from "./meshMaterials";
import { Hair } from "./AvatarParts";
import AvatarAccessories from "./AvatarAccessories";
export type Pose = "idle" | "walk" | "run" | "sit";
function Model({ config, pose }: { config: AvatarConfig; pose: Pose }) {
  const id = config.base === "fem" ? "willow" : "central";
  const asset = useGLTF(`/avatars/meshy/${id}.glb`);
  const instance = useMemo(() => {
    const scene = clone(asset.scene);
    const paint = avatarMaterial(config);
    const bones = new Map<string, THREE.Bone>();
    scene.traverse((object) => {
      if ((object as THREE.Bone).isBone)
        bones.set(object.name, object as THREE.Bone);
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        mesh.material = paint.material;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
      }
    });
    const mixer = new THREE.AnimationMixer(scene);
    const actions = new Map(
      asset.animations.map((clip) => [clip.name, mixer.clipAction(clip)]),
    );
    scene.updateMatrixWorld(true);
    function anchor(boneName: string, position: [number, number, number]) {
      const bone = bones.get(boneName);
      const group = new THREE.Group();
      if (bone) {
        group.position.copy(bone.worldToLocal(new THREE.Vector3(...position)));
        bone.getWorldQuaternion(group.quaternion).invert();
        bone.add(group);
      }
      return group;
    }
    const willow = id === "willow";
    const anchors = {
      head: anchor("Head", [0, 2.005, 0]),
      chest: anchor("Spine", [0, 1.4, 0.17]),
      neck: anchor("Neck", [0, 1.65, 0]),
      back: anchor("Spine", [0, 1.3, -0.24]),
      wrist: anchor("LeftHand", [
        willow ? 0.58 : 0.37,
        willow ? 1.04 : 0.98,
        0.015,
      ]),
      hand: anchor("RightHand", [
        willow ? -0.6 : -0.39,
        willow ? 0.99 : 0.88,
        0.1,
      ]),
    };
    return {
      scene,
      paint,
      mixer,
      actions,
      headAnchor: anchors.head,
      anchors,
      bones,
    };
  }, [asset, id]);
  useLayoutEffect(() => {
    instance.paint.update(config);
    instance.scene.scale.set(config.body, 1, config.body);
    instance.bones.get("Head")?.scale.set(config.face, 1, 1);
  }, [instance, config]);
  useEffect(() => {
    const action =
      instance.actions.get(pose) ||
      [...instance.actions.entries()].find(([name]) =>
        name.toLowerCase().includes(pose),
      )?.[1];
    if (action) {
      action.reset().fadeIn(0.18).play();
      return () => {
        action.fadeOut(0.18);
      };
    }
  }, [instance, pose]);
  useEffect(
    () => () => {
      instance.mixer.stopAllAction();
      instance.paint.material.dispose();
    },
    [instance],
  );
  useFrame((_, delta) => instance.mixer.update(Math.min(delta, 0.1)));
  return (
    <group
      name={`avatar-${id}`}
      userData={{ model: id, pose }}
      scale={config.height}
    >
      <primitive object={instance.scene} dispose={null} />
      <AvatarAccessories config={config} anchors={instance.anchors} />
      {createPortal(
        <group>
          {config.hair > 0 && (
            <group scale={0.7}>
              <mesh position={[0, 0.14, -0.02]}>
                <sphereGeometry
                  args={[0.41, 28, 20, 0, Math.PI * 2, 0, Math.PI / 2]}
                />
                <meshStandardMaterial color={skins[config.skin]} />
              </mesh>
              <Hair config={config} />
            </group>
          )}
          {config.glasses > 0 && (
            <group position={[0, -0.03, 0.285]}>
              {[-1, 1].map((sign) => (
                <mesh
                  key={sign}
                  position={[sign * 0.13, 0, 0]}
                  scale={[1, config.glasses === 3 ? 0.65 : 1, 1]}
                >
                  <torusGeometry
                    args={[0.079, 0.009, 8, config.glasses === 2 ? 4 : 32]}
                  />
                  <meshStandardMaterial
                    color="#253346"
                    metalness={0.45}
                    roughness={0.3}
                  />
                </mesh>
              ))}
              <mesh>
                <boxGeometry args={[0.09, 0.012, 0.01]} />
                <meshStandardMaterial color="#253346" />
              </mesh>
            </group>
          )}
        </group>,
        instance.headAnchor,
      )}
    </group>
  );
}
export default function AvatarRenderer({
  config,
  pose = "idle",
}: {
  config: AvatarConfig;
  pose?: Pose;
}) {
  return (
    <Suspense fallback={null}>
      <Model config={config} pose={pose} />
    </Suspense>
  );
}

useGLTF.preload("/avatars/meshy/central.glb");
useGLTF.preload("/avatars/meshy/willow.glb");
