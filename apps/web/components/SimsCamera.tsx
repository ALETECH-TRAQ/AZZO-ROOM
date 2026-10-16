"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import type { Position } from "@/lib/types";

const VIEW = {
  yaw: Math.PI / 4,
  pitch: Math.PI / 4,
  distance: 11.5,
  minDistance: 6,
  maxDistance: 19,
  targetHeight: 1.1,
  followSpeed: 8,
  zoomSpeed: 10,
};

export default function SimsCamera({
  active,
  positionRef,
}: {
  active: boolean;
  positionRef: RefObject<Position>;
}) {
  const { gl, size, get, set } = useThree();
  const rig = useMemo(() => {
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 130);
    camera.name = "azzo-sims-camera";
    camera.up.set(0, 1, 0);
    // YXZ expresses world yaw, then pitch, then local roll. Do not call lookAt
    // followed by rotation.z = 0 in XYZ: that rolls an otherwise level camera.
    camera.rotation.set(-VIEW.pitch, VIEW.yaw, 0, "YXZ");
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(
      camera.quaternion,
    );
    const focus = new THREE.Vector3();
    const target = new THREE.Vector3();
    const state = {
      camera,
      direction,
      focus,
      target,
      distance: VIEW.distance,
      zoom: VIEW.distance,
      playerPosition: positionRef.current,
    };
    const player = positionRef.current;
    focus.set(player.x, VIEW.targetHeight, player.z);
    camera.position.copy(focus).addScaledVector(direction, state.distance);
    camera.updateMatrixWorld();
    return state;
  }, [positionRef]);

  useLayoutEffect(() => {
    rig.camera.aspect = size.width / Math.max(size.height, 1);
    rig.camera.updateProjectionMatrix();
  }, [rig, size.width, size.height]);

  useLayoutEffect(() => {
    if (!active) return;
    const previousCamera = get().camera;
    const player = positionRef.current;
    rig.playerPosition = player;
    rig.focus.set(player.x, VIEW.targetHeight, player.z);
    rig.distance = rig.zoom;
    rig.camera.position
      .copy(rig.focus)
      .addScaledVector(rig.direction, rig.distance);
    rig.camera.updateMatrixWorld();
    // Install only after the pose and projection are ready, before any render.
    // This camera is not parented to the avatar or the office scene.
    set({ camera: rig.camera });
    return () => {
      set({ camera: previousCamera });
    };
  }, [active, get, set, positionRef, rig]);

  useLayoutEffect(() => {
    if (!active) return;
    const canvas = gl.domElement;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const pixels =
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? canvas.clientHeight
            : 1);
      rig.zoom = THREE.MathUtils.clamp(
        rig.zoom + pixels * 0.008,
        VIEW.minDistance,
        VIEW.maxDistance,
      );
    };
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => canvas.removeEventListener("wheel", wheel);
  }, [active, gl, rig]);

  useFrame((_, delta) => {
    if (!active) return;
    const player = positionRef.current;
    rig.target.set(player.x, VIEW.targetHeight, player.z);
    // A new position object denotes initialization/re-entry, not walking.
    // Layout effects can supply it after this camera's activation effect.
    // Snap before rendering that first frame; only continuous movement is damped.
    if (rig.playerPosition !== player) {
      rig.playerPosition = player;
      rig.focus.copy(rig.target);
    } else {
      rig.focus.lerp(rig.target, 1 - Math.exp(-VIEW.followSpeed * delta));
    }
    rig.distance = THREE.MathUtils.damp(
      rig.distance,
      rig.zoom,
      VIEW.zoomSpeed,
      delta,
    );
    rig.camera.position
      .copy(rig.focus)
      .addScaledVector(rig.direction, rig.distance);
    // Orientation is immutable; only the avatar position and explicit zoom move it.
    rig.camera.updateMatrixWorld();
  });

  return null;
}
