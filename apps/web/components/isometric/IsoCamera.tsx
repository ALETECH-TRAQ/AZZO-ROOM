"use client";

import { useLayoutEffect, useMemo, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Position } from "@/lib/types";

// Presentation only: world coordinates and network messages remain X/Z.
export default function IsoCamera({
  active,
  positionRef,
}: {
  active: boolean;
  positionRef: RefObject<Position>;
}) {
  const { gl, size, get, set } = useThree();
  const rig = useMemo(() => {
    const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 120);
    camera.name = "azzo-orthographic-prototype";
    camera.rotation.set(-Math.atan(1 / Math.sqrt(2)), Math.PI / 4, 0, "YXZ");
    const offset = new THREE.Vector3(0, 0, 35).applyQuaternion(
      camera.quaternion,
    );
    return {
      camera,
      offset,
      focus: new THREE.Vector3(),
      target: new THREE.Vector3(),
      player: positionRef.current,
      zoom: 1,
    };
  }, [positionRef]);

  useLayoutEffect(() => {
    if (!active) return;
    const canvas = gl.domElement;
    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      let left = 16,
        right = rect.width - 16;
      // Panels stay untouched. Measure their actual desktop overlap.
      for (const selector of [".sidebar", ".right-panel"]) {
        const panel = document.querySelector(selector)?.getBoundingClientRect();
        if (!panel || panel.width > rect.width * 0.4 || panel.height === 0)
          continue;
        if (panel.left + panel.width / 2 < rect.left + rect.width / 2)
          left = Math.max(left, panel.right - rect.left + 20);
        else right = Math.min(right, panel.left - rect.left - 20);
      }
      if (right - left < rect.width * 0.3) {
        left = 16;
        right = rect.width - 16;
      }
      const availableWidth = Math.max(1, right - left);
      const height = Math.max(1, rect.height);
      // At least 12 world units across the useful area; no full-room auto-fit.
      const span = Math.max(14, (12 * height) / availableWidth);
      rig.camera.left = (-span * rect.width) / height / 2;
      rig.camera.right = -rig.camera.left;
      rig.camera.top = span / 2;
      rig.camera.bottom = -span / 2;
      rig.camera.setViewOffset(
        Math.max(1, rect.width),
        height,
        -(left + right - rect.width) / 2,
        0,
        Math.max(1, rect.width),
        height,
      );
      rig.camera.updateProjectionMatrix();
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(canvas);
    for (const selector of [".sidebar", ".right-panel"]) {
      const element = document.querySelector(selector);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [active, gl, rig, size.width, size.height]);

  useLayoutEffect(() => {
    if (!active) return;
    const previous = get().camera;
    const p = positionRef.current;
    rig.player = p;
    rig.focus.set(p.x, 1.1, p.z);
    rig.camera.position.copy(rig.focus).add(rig.offset);
    rig.camera.updateMatrixWorld();
    set({ camera: rig.camera });
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const pixels =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.height : 1);
      rig.zoom = THREE.MathUtils.clamp(
        rig.zoom * Math.exp(-pixels * 0.001),
        0.7,
        1.7,
      );
    };
    gl.domElement.addEventListener("wheel", wheel, { passive: false });
    return () => {
      gl.domElement.removeEventListener("wheel", wheel);
      set({ camera: previous });
    };
  }, [active, get, set, gl, rig, positionRef, size.height]);

  useFrame((_, delta) => {
    if (!active) return;
    const p = positionRef.current;
    rig.target.set(
      THREE.MathUtils.clamp(p.x, -12.5, 12.5),
      1.1,
      THREE.MathUtils.clamp(p.z, -8.1, 8.1),
    );
    if (rig.player !== p) {
      rig.focus.copy(rig.target);
      rig.player = p;
    } else rig.focus.lerp(rig.target, 1 - Math.exp(-10 * Math.min(delta, 0.1)));
    rig.camera.position.copy(rig.focus).add(rig.offset);
    rig.camera.zoom = THREE.MathUtils.damp(
      rig.camera.zoom,
      rig.zoom,
      12,
      Math.min(delta, 0.1),
    );
    rig.camera.updateProjectionMatrix();
    rig.camera.updateMatrixWorld();
  });
  return null;
}
