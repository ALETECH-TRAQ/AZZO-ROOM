"use client";
import { Suspense, useEffect, useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, createPortal } from "@react-three/fiber";
import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { type AvatarConfig } from "@/lib/avatars";
import { avatarMaterial } from "./meshMaterials";
import AvatarAccessories from "./AvatarAccessories";
export type Pose = "idle" | "walk" | "run" | "sit";
function FaceEyes({
  color,
  positions,
}: {
  color: string;
  positions: [THREE.Vector3, THREE.Vector3];
}) {
  return (
    <group>
      {positions.map((position, index) => (
        <group key={index} position={position}>
          <mesh scale={[0.043, 0.054, 0.019]} castShadow>
            <sphereGeometry args={[1, 24, 18]} />
            <meshStandardMaterial color="#fbf7ef" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.017]} scale={[0.022, 0.032, 0.011]}>
            <sphereGeometry args={[1, 20, 16]} />
            <meshStandardMaterial color={color} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0, 0.025]} scale={[0.01, 0.02, 0.007]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color="#111820" roughness={0.25} />
          </mesh>
          <mesh position={[-0.006, 0.012, 0.031]} scale={[0.005, 0.007, 0.004]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
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
    scene.updateMatrixWorld(true);
    anchors.head.updateMatrixWorld(true);
    const eyePositions = ([-1, 1] as const).map((side) => {
      const targetX = side * 0.105;
      let front = -Infinity;
      scene.traverse((object) => {
        if (!(object as THREE.Mesh).isMesh) return;
        const mesh = object as THREE.Mesh;
        const position = mesh.geometry.getAttribute("position");
        if (!position) return;
        for (let i = 0; i < position.count; i++) {
          const point = new THREE.Vector3().fromBufferAttribute(position, i);
          mesh.localToWorld(point);
          scene.worldToLocal(point);
          if (
            Math.abs(point.x - targetX) < 0.035 &&
            Math.abs(point.y - 1.975) < 0.045
          )
            front = Math.max(front, point.z);
        }
      });
      const surface = new THREE.Vector3(
        targetX,
        1.975,
        (Number.isFinite(front) ? front : 0.2) + 0.012,
      );
      scene.localToWorld(surface);
      return anchors.head.worldToLocal(surface);
    }) as [THREE.Vector3, THREE.Vector3];
    return {
      scene,
      paint,
      mixer,
      actions,
      headAnchor: anchors.head,
      anchors,
      bones,
      eyePositions,
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
        <FaceEyes color={config.eyes} positions={instance.eyePositions} />,
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
