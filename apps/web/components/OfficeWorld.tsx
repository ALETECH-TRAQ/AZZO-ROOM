"use client";
import { Html } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraMode, OnlinePlayer, Position } from "@/lib/types";
import AvatarRenderer, { type Pose } from "./avatar/AvatarRenderer";
import { defaultAvatar, type AvatarConfig, collides } from "@azzo/avatar";
import { MEETING_CENTER } from "@/lib/types";
import SimsCamera from "./SimsCamera";
import { networkLog } from "@/lib/multiplayer";

type Props = {
  mode: CameraMode;
  color: string;
  avatar: AvatarConfig | null;
  players: OnlinePlayer[];
  onPosition: (position: Position) => void;
  networkSpawn?: (Position & { sessionId: string }) | null;
};

function dampAngle(
  current: number,
  target: number,
  speed: number,
  delta: number,
) {
  const shortestDelta = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current),
  );
  return current + shortestDelta * (1 - Math.exp(-speed * delta));
}

function Box({
  position,
  scale,
  color,
  metalness = 0,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  metalness?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={scale} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={0.6}
      />
    </mesh>
  );
}
function Desk({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box position={[0, 0.77, 0]} scale={[2.15, 0.13, 1.05]} color="#a17f61" />
      <Box
        position={[-0.83, 0.38, 0]}
        scale={[0.1, 0.72, 0.75]}
        color="#38434a"
      />
      <Box
        position={[0.83, 0.38, 0]}
        scale={[0.1, 0.72, 0.75]}
        color="#38434a"
      />
      <Box
        position={[0, 1.12, -0.25]}
        scale={[0.7, 0.49, 0.09]}
        color="#182e3c"
      />
      <Box
        position={[0, 1.05, -0.192]}
        scale={[0.57, 0.35, 0.015]}
        color="#4de0dc"
      />
      <Box
        position={[0, 0.91, 0.18]}
        scale={[0.72, 0.045, 0.19]}
        color="#34363c"
      />
      <Box
        position={[0, 0.44, 1.02]}
        scale={[0.78, 0.12, 0.72]}
        color="#3a5660"
      />
      <Box
        position={[0, 0.81, 1.15]}
        scale={[0.66, 0.6, 0.12]}
        color="#32434f"
      />
    </group>
  );
}
function Plant({ x, z, size = 1 }: { x: number; z: number; size?: number }) {
  return (
    <group position={[x, 0, z]} scale={size}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.64, 12]} />
        <meshStandardMaterial color="#c6aa8d" />
      </mesh>
      <mesh position={[0, 1, 0]} castShadow>
        <coneGeometry args={[0.55, 1.45, 8]} />
        <meshStandardMaterial color="#347c70" />
      </mesh>
      <mesh position={[0.1, 1.5, 0.1]} castShadow>
        <coneGeometry args={[0.36, 1.02, 8]} />
        <meshStandardMaterial color="#4ca38b" />
      </mesh>
    </group>
  );
}
function OfficeEnvironment() {
  return (
    <group name="azzo-office-environment">
      <ambientLight intensity={1.05} color="#bedcf3" />
      <hemisphereLight args={["#d8fbfa", "#294153", 2]} />
      <directionalLight
        position={[5, 12, 6]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <pointLight
        position={[7, 5, -3]}
        intensity={24}
        distance={16}
        color="#63b4db"
      />
      <Box
        position={[0, -0.24, 0]}
        scale={[27.4, 0.35, 18.2]}
        color="#273642"
      />
      <Box
        position={[0, -0.055, 0]}
        scale={[25.7, 0.025, 16.6]}
        color="#394958"
      />
      <Box
        position={[0, 1.6, -8.6]}
        scale={[27.4, 3.5, 0.28]}
        color="#172a38"
      />
      <Box
        position={[-13.45, 1.5, 0]}
        scale={[0.3, 3.2, 18.1]}
        color="#1b3441"
      />
      <Box
        position={[13.45, 1.5, 0]}
        scale={[0.3, 3.2, 18.1]}
        color="#1b3441"
      />
      <Box
        position={[0, 0.1, 8.95]}
        scale={[27.4, 0.36, 0.3]}
        color="#172b39"
      />
      <Box
        position={[0, 2.6, -8.3]}
        scale={[7.6, 0.065, 0.08]}
        color="#5ce3d7"
      />
      <Box
        position={[0, 2.0, -8.24]}
        scale={[3.1, 0.8, 0.12]}
        color="#0e1921"
      />
      {/* Janelas panorâmicas e skyline procedural, sem downloads externos. */}
      {[-10, -7, -4, -1, 2, 5, 8, 11].map((x, i) => (
        <group key={x}>
          <Box
            position={[x, 2, -8.39]}
            scale={[2.7, 2.7, 0.04]}
            color={i % 2 ? "#153d59" : "#15304c"}
          />
          <Box
            position={[x, 3.38, -8.3]}
            scale={[2.5, 0.04, 0.05]}
            color="#85b9d8"
          />
          <Box
            position={[x, 1.6, -8.32]}
            scale={[0.04, 3.3, 0.05]}
            color="#192b3b"
          />
        </group>
      ))}
      <Box
        position={[-8.6, 0.015, 5.4]}
        scale={[6.5, 0.025, 3.8]}
        color="#263b54"
      />
      <Box
        position={[7.8, 0.02, 2.2]}
        scale={[5.8, 0.03, 3.2]}
        color="#253e52"
      />
      <Box
        position={[7.8, 0.76, 2.2]}
        scale={[3.4, 0.14, 1.3]}
        color="#ad8a6a"
      />
      <Box
        position={[6.6, 0.37, 2.2]}
        scale={[0.12, 0.75, 0.8]}
        color="#384c5d"
      />
      <Box
        position={[9, 0.37, 2.2]}
        scale={[0.12, 0.75, 0.8]}
        color="#384c5d"
      />
      {[6.5, 7.8, 9.1].map((x) => (
        <Box
          key={x}
          position={[x, 0.4, 3.35]}
          scale={[0.68, 0.7, 0.6]}
          color="#3b5670"
        />
      ))}
      <pointLight
        position={[-8, 4, 4]}
        color="#f4c892"
        intensity={20}
        distance={9}
      />
      {/* Escritório aberto */}
      <Desk x={-9.3} z={-4.7} />
      <Desk x={-5.65} z={-4.7} />
      <Desk x={-9.3} z={0.2} />
      <Desk x={-5.65} z={0.2} />
      <Desk x={-1.75} z={-4.7} />
      <Desk x={-1.75} z={0.2} />
      {/* Mesa de reunião */}
      <Box
        position={[7.6, 0.65, -3.7]}
        scale={[5.5, 0.22, 2.0]}
        color="#b78f65"
      />
      <Box
        position={[6.1, 0.34, -3.7]}
        scale={[0.28, 0.68, 1.6]}
        color="#465862"
      />
      <Box
        position={[9.1, 0.34, -3.7]}
        scale={[0.28, 0.68, 1.6]}
        color="#465862"
      />
      <Box
        position={[7.7, 1.65, -8.26]}
        scale={[4.5, 2.1, 0.12]}
        color="#0a1826"
      />
      <Box
        position={[7.7, 1.65, -8.16]}
        scale={[4.15, 1.75, 0.07]}
        color="#277687"
      />
      {[-1.9, -0.6, 0.6, 1.9].map((d, i) => (
        <group key={i}>
          <Box
            position={[7.6 + d, 0.4, -5.35]}
            scale={[0.72, 0.6, 0.62]}
            color="#426777"
          />
          <Box
            position={[7.6 + d, 0.4, -2.05]}
            scale={[0.72, 0.6, 0.62]}
            color="#426777"
          />
        </group>
      ))}
      {/* Zona de reunião */}
      <mesh
        position={[MEETING_CENTER.x, -0.04, MEETING_CENTER.z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[3.6, 3.68, 72]} />
        <meshBasicMaterial
          color="#67e9d3"
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Recepção */}
      <Box position={[5, 0.7, 6.0]} scale={[4.5, 1.25, 1.1]} color="#b18b67" />
      <Box
        position={[5, 1.35, 6.07]}
        scale={[4.7, 0.15, 1.3]}
        color="#d5ad80"
      />
      <Box
        position={[5, 1.0, 6.58]}
        scale={[2.8, 0.15, 0.08]}
        color="#42dcc9"
      />
      {/* Área de descanso */}
      <Box
        position={[-8.6, 0.35, 5.55]}
        scale={[3.6, 0.65, 1]}
        color="#447b8b"
      />
      <Box
        position={[-8.6, 0.88, 5.87]}
        scale={[3.6, 1.0, 0.32]}
        color="#375b70"
      />
      <Box
        position={[-4.9, 0.25, 5.45]}
        scale={[1.55, 0.5, 1.2]}
        color="#9b7557"
      />
      <Plant x={-11.4} z={-7.3} />
      <Plant x={12} z={-7.4} />
      <Plant x={11.8} z={6.8} />
      <Plant x={-11.5} z={7.0} />
      {/* Separador discreto de espaços */}
      <Box
        position={[3.05, 0.5, -4.6]}
        scale={[0.12, 1.05, 7.5]}
        color="#526778"
      />
    </group>
  );
}

function RemoteAvatar({ player }: { player: OnlinePlayer }) {
  const ref = useRef<THREE.Group>(null);
  // Stable JSX position prevents network renders from bypassing interpolation.
  const [initialPosition] = useState<[number, number, number]>(() => [
    player.x,
    player.y || 0,
    player.z,
  ]);
  useEffect(() => {
    networkLog("remote-rendered", { sessionId: player.sessionId });
    return () => networkLog("remote-removed", { sessionId: player.sessionId });
  }, [player.sessionId]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x = THREE.MathUtils.damp(
      ref.current.position.x,
      player.x,
      12,
      delta,
    );
    ref.current.position.y = THREE.MathUtils.damp(
      ref.current.position.y,
      player.y || 0,
      12,
      delta,
    );
    ref.current.position.z = THREE.MathUtils.damp(
      ref.current.position.z,
      player.z,
      12,
      delta,
    );
    ref.current.rotation.y = dampAngle(
      ref.current.rotation.y,
      player.yaw,
      12,
      delta,
    );
  });
  return (
    <group
      ref={ref}
      name={`remote-player:${player.sessionId}`}
      userData={{
        sessionId: player.sessionId,
        target: [player.x, player.y || 0, player.z],
        animation: player.animation,
      }}
      position={initialPosition}
    >
      <AvatarRenderer
        config={player.avatar || defaultAvatar}
        pose={(player.animation || "idle") as Pose}
      />
      <Html
        position={[0, 2.8, 0]}
        center
        distanceFactor={14}
        style={{ pointerEvents: "none" }}
      >
        <span
          className="player-label"
          data-player-session={player.sessionId}
          data-player-x={player.x}
          data-player-z={player.z}
          data-player-yaw={player.yaw}
          data-player-animation={player.animation}
          data-avatar-base={(player.avatar || defaultAvatar).base}
        >
          {player.name}
        </span>
      </Html>
    </group>
  );
}

function Controller({
  mode,
  color,
  avatar,
  onPosition,
  networkSpawn,
}: {
  mode: CameraMode;
  color: string;
  avatar: AvatarConfig | null;
  onPosition: (position: Position) => void;
  networkSpawn?: (Position & { sessionId: string }) | null;
}) {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const local = useRef<Position>({ x: 0, z: 5, yaw: 0 });
  const model = useRef<THREE.Group>(null);
  const lastPublish = useRef(0);
  const modeRef = useRef(mode);
  const cameraYaw = useRef(0);
  const cameraPitch = useRef(0.55);
  const rotatingCamera = useRef(false);
  const cameraOrientationDirty = useRef(true);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const focus = useMemo(() => new THREE.Vector3(0, 1.1, 5), []);
  const cameraForward = useMemo(() => new THREE.Vector3(), []);
  const cameraRight = useMemo(() => new THREE.Vector3(), []);
  modeRef.current = mode;

  useLayoutEffect(() => {
    if (!networkSpawn) return;
    local.current = {
      x: networkSpawn.x,
      y: 0,
      z: networkSpawn.z,
      yaw: networkSpawn.yaw,
      animation: "idle",
    };
    model.current?.position.set(networkSpawn.x, 0, networkSpawn.z);
  }, [networkSpawn]);

  useEffect(() => {
    if (mode !== "third") rotatingCamera.current = false;
    cameraOrientationDirty.current = true;
  }, [mode]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowleft",
          "arrowdown",
          "arrowright",
          "shift",
        ].includes(key)
      ) {
        keys.current.add(key);
        if (key.startsWith("arrow")) e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const clear = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);
  useEffect(() => {
    const dom = gl.domElement;
    const sensitivity = 0.006;
    const stopRotating = () => {
      rotatingCamera.current = false;
    };
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 2 || modeRef.current !== "third") return;
      event.preventDefault();
      rotatingCamera.current = true;
      dom.setPointerCapture?.(event.pointerId);
    };
    const pointerMove = (event: PointerEvent) => {
      if (!rotatingCamera.current || modeRef.current !== "third") return;
      event.preventDefault();
      cameraYaw.current -= event.movementX * sensitivity;
      cameraPitch.current = THREE.MathUtils.clamp(
        cameraPitch.current - event.movementY * sensitivity,
        0.18,
        1.2,
      );
      cameraOrientationDirty.current = true;
    };
    const pointerUp = (event: PointerEvent) => {
      if (event.button !== 2) return;
      stopRotating();
      if (dom.hasPointerCapture?.(event.pointerId)) {
        dom.releasePointerCapture?.(event.pointerId);
      }
    };
    const contextMenu = (event: MouseEvent) => event.preventDefault();
    dom.addEventListener("pointerdown", pointerDown);
    dom.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", stopRotating);
    window.addEventListener("blur", stopRotating);
    dom.addEventListener("contextmenu", contextMenu);
    return () => {
      stopRotating();
      dom.removeEventListener("pointerdown", pointerDown);
      dom.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", stopRotating);
      window.removeEventListener("blur", stopRotating);
      dom.removeEventListener("contextmenu", contextMenu);
    };
  }, [gl.domElement]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    let inputX =
      Number(k.has("d") || k.has("arrowright")) -
      Number(k.has("a") || k.has("arrowleft"));
    let inputZ =
      Number(k.has("s") || k.has("arrowdown")) -
      Number(k.has("w") || k.has("arrowup"));
    let dx = inputX;
    let dz = inputZ;
    if (mode === "third") {
      camera.getWorldDirection(cameraForward);
      cameraForward.y = 0;
      cameraForward.normalize();
      // Three.js cameras look down -Z, so screen-right is forward × up.
      cameraRight.set(-cameraForward.z, 0, cameraForward.x);
      dx = cameraForward.x * -inputZ + cameraRight.x * inputX;
      dz = cameraForward.z * -inputZ + cameraRight.z * inputX;
    }
    if (dx || dz) {
      const n = Math.hypot(dx, dz);
      dx /= n;
      dz /= n;
      const speed = k.has("shift") ? 5.2 : 3.7;
      const nx = THREE.MathUtils.clamp(
          local.current.x + dx * speed * dt,
          -12.5,
          12.5,
        ),
        nz = THREE.MathUtils.clamp(
          local.current.z + dz * speed * dt,
          -8.1,
          8.1,
        );
      if (!collides(nx, local.current.z)) local.current.x = nx;
      if (!collides(local.current.x, nz)) local.current.z = nz;
      local.current.yaw = Math.atan2(dx, dz);
    }
    local.current.animation =
      dx || dz ? (k.has("shift") ? "run" : "walk") : "idle";
    if (model.current) {
      model.current.position.set(local.current.x, 0, local.current.z);
      model.current.rotation.y = dampAngle(
        model.current.rotation.y,
        local.current.yaw,
        14,
        dt,
      );
    }
    const p = local.current;
    target.set(p.x, 1.1, p.z);
    if (mode === "third") {
      focus.lerp(target, 1 - Math.exp(-4.1 * dt));
      const horizontalDistance = 5.7 * Math.cos(cameraPitch.current);
      desired.set(
        focus.x - Math.sin(cameraYaw.current) * horizontalDistance,
        focus.y + 5.7 * Math.sin(cameraPitch.current),
        focus.z - Math.cos(cameraYaw.current) * horizontalDistance,
      );
      camera.position.copy(desired);
      if (cameraOrientationDirty.current) {
        camera.up.set(0, 1, 0);
        camera.rotation.order = "YXZ";
        camera.rotation.set(
          -cameraPitch.current,
          Math.PI + cameraYaw.current,
          0,
        );
        cameraOrientationDirty.current = false;
      }
    } else {
      // Keep the existing third-person focus synchronized while its camera is inactive.
      focus.copy(target);
    }
    lastPublish.current += dt;
    if (lastPublish.current >= 0.1) {
      onPosition({ ...p });
      lastPublish.current = 0;
    }
  });
  return (
    <>
      <group ref={model} name="local-player" position={[0, 0, 5]}>
        <MovingAvatar config={avatar || defaultAvatar} positionRef={local} />
      </group>
      <SimsCamera active={mode === "iso"} positionRef={local} />
    </>
  );
}
function MovingAvatar({
  config,
  positionRef,
}: {
  config: AvatarConfig;
  positionRef: React.RefObject<Position>;
}) {
  const [pose, setPose] = useState<Pose>("idle");
  useFrame(() => {
    const p = (positionRef.current.animation || "idle") as Pose;
    setPose((v) => (v === p ? v : p));
  });
  return <AvatarRenderer config={config} pose={pose} />;
}
export default function OfficeWorld({
  mode,
  color,
  avatar,
  players,
  onPosition,
  networkSpawn,
}: Props) {
  const initialCamera = useMemo(
    () => ({
      position: [6.5, 10.29, 11.5] as [number, number, number],
      fov: 48,
      near: 0.1,
      far: 130,
    }),
    [],
  );
  return (
    <Canvas
      fallback={
        <div className="world-loading">
          Ative o WebGL para explorar o escritório 3D.
        </div>
      }
      shadows
      dpr={[1, 1.6]}
      camera={initialCamera}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0b151d"]} />
      <OfficeEnvironment />
      {players.map((p) => (
        <RemoteAvatar key={p.sessionId} player={p} />
      ))}
      <Controller
        mode={mode}
        color={color}
        avatar={avatar}
        onPosition={onPosition}
        networkSpawn={networkSpawn}
      />
    </Canvas>
  );
}
