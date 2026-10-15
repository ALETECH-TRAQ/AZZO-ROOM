"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  skins,
  hairColors,
  clothingColors,
  type AvatarConfig,
} from "@/lib/avatars";
export type Pose = "idle" | "walk" | "run" | "sit";
function Ball({
  at = [0, 0, 0],
  size = [1, 1, 1],
  color,
}: {
  at?: [number, number, number];
  size?: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={at} scale={size} castShadow>
      <sphereGeometry args={[1, 24, 18]} />
      <meshStandardMaterial color={color} roughness={0.67} />
    </mesh>
  );
}
function Block({
  at,
  size,
  color,
}: {
  at: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={at} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
  );
}
function Hair({ config: c }: { config: AvatarConfig }) {
  const color = hairColors[c.hairColor],
    length = c.hair === 8 ? 0.38 : c.hair === 7 ? 0.6 : 0.55,
    long = c.hair >= 7 && c.hair <= 10,
    curly = c.hair === 4 || c.hair === 10;
  return (
    <group>
      <Ball
        at={[0, 0.3, -0.07]}
        size={[0.48, c.hair === 5 ? 0.25 : 0.35, 0.43]}
        color={color}
      />
      {long && (
        <>
          <Ball
            at={[-0.38, -length * 0.55, -0.1]}
            size={[0.18, length, 0.29]}
            color={color}
          />
          <Ball
            at={[0.38, -length * 0.55, -0.1]}
            size={[0.18, length, 0.29]}
            color={color}
          />
          <Ball at={[0, -0.3, -0.3]} size={[0.4, 0.55, 0.2]} color={color} />
        </>
      )}
      {curly
        ? Array.from({ length: 17 }, (_, i) => {
            const a = i * 2.399;
            return (
              <Ball
                key={i}
                at={[
                  Math.cos(a) * 0.39,
                  0.27 + Math.sin(i * 3.7) * 0.18,
                  Math.sin(a) * 0.34,
                ]}
                size={[0.18, 0.17, 0.18]}
                color={color}
              />
            );
          })
        : c.hair !== 5 &&
          Array.from({ length: c.hair === 6 ? 3 : 5 }, (_, i) => (
            <group
              key={i}
              rotation={[
                0,
                0,
                (c.hair === 1 ? -0.5 : c.hair === 13 ? 0.18 : -0.2) +
                  (i % 3) * 0.2,
              ]}
            >
              <Ball
                at={[
                  -0.31 + i * 0.15 + (c.hair === 1 ? 0.06 : 0),
                  0.26 + Math.sin(i + c.hair) * 0.06,
                  0.28,
                ]}
                size={[0.19, c.hair === 13 ? 0.27 : 0.19, 0.15]}
                color={color}
              />
            </group>
          ))}
      {c.hair === 9 &&
        [-1, 1].map((s) =>
          [0, 1, 2].map((i) => (
            <Ball
              key={`${s}-${i}`}
              at={[s * (0.34 + Math.sin(i * 2) * 0.05), -0.12 - i * 0.22, 0.1]}
              size={[0.19, 0.22, 0.22]}
              color={color}
            />
          )),
        )}
      {c.hair === 11 && (
        <Ball at={[0, 0.55, -0.2]} size={[0.27, 0.26, 0.26]} color={color} />
      )}
      {c.hair === 12 && (
        <Ball at={[0, 0.15, -0.47]} size={[0.23, 0.38, 0.24]} color={color} />
      )}
      {(c.hair === 2 || c.hair === 3 || c.hair === 9) && (
        <Ball at={[-0.3, 0.49, 0.02]} size={[0.25, 0.18, 0.29]} color={color} />
      )}
    </group>
  );
}
export default function AvatarRenderer({
  config: c,
  pose = "idle",
}: {
  config: AvatarConfig;
  pose?: Pose;
}) {
  const root = useRef<THREE.Group>(null),
    la = useRef<THREE.Group>(null),
    ra = useRef<THREE.Group>(null),
    ll = useRef<THREE.Group>(null),
    rl = useRef<THREE.Group>(null);
  const skin = skins[c.skin],
    cloth = clothingColors[c.topColor],
    pants = clothingColors[c.bottomColor],
    jacket = c.top === 1 || c.top === 4;
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const speed = pose === "run" ? 12 : 7,
      amp = pose === "walk" ? 0.55 : pose === "run" ? 0.85 : 0;
    const damp = (a: number, b: number) =>
      THREE.MathUtils.damp(a, b, 12, delta);
    if (root.current)
      root.current.position.y = damp(
        root.current.position.y,
        pose === "sit"
          ? -0.4
          : Math.sin(t * (amp ? speed * 2 : 2)) * (amp ? 0.035 : 0.012),
      );
    if (la.current)
      la.current.rotation.x = damp(
        la.current.rotation.x,
        Math.sin(t * speed) * amp,
      );
    if (ra.current)
      ra.current.rotation.x = damp(
        ra.current.rotation.x,
        -Math.sin(t * speed) * amp - (c.accessories.includes(3) ? 0.65 : 0),
      );
    if (ll.current)
      ll.current.rotation.x = damp(
        ll.current.rotation.x,
        pose === "sit" ? -1.5 : -Math.sin(t * speed) * amp,
      );
    if (rl.current)
      rl.current.rotation.x = damp(
        rl.current.rotation.x,
        pose === "sit" ? -1.5 : Math.sin(t * speed) * amp,
      );
  });
  return (
    <group scale={[c.body, c.height, 1]}>
      <group ref={root}>
        <group position={[0, 1.13, 0]}>
          <Ball
            size={[c.top === 3 ? 0.37 : 0.34, c.top === 2 ? 0.39 : 0.43, 0.22]}
            color={jacket ? "#edf0f7" : cloth}
          />
          <Block at={[0, -0.32, 0]} size={[0.56, 0.07, 0.38]} color="#29242d" />
          <Block
            at={[0, -0.32, 0.201]}
            size={[0.09, 0.065, 0.025]}
            color="#bfa780"
          />
          {jacket && (
            <>
              <Ball
                at={[-0.23, 0.04, 0]}
                size={[0.17, 0.4, 0.24]}
                color={cloth}
              />
              <Ball
                at={[0.23, 0.04, 0]}
                size={[0.17, 0.4, 0.24]}
                color={cloth}
              />
              <mesh position={[0, 0.1, 0.24]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.055, 0.26, 0.035]} />
                <meshStandardMaterial color="#4e82bd" />
              </mesh>
            </>
          )}
          {!jacket &&
            [0, 0.12, 0.24].map((y) => (
              <Ball
                key={y}
                at={[0, y, 0.22]}
                size={[0.018, 0.018, 0.01]}
                color="#6d7b8c"
              />
            ))}
          <Ball
            at={[-0.1, 0.36, 0.18]}
            size={[0.1, 0.06, 0.08]}
            color={c.top === 2 ? "#c7d9e3" : "#f3f3ed"}
          />
          <Ball
            at={[0.1, 0.36, 0.18]}
            size={[0.1, 0.06, 0.08]}
            color={c.top === 2 ? "#c7d9e3" : "#f3f3ed"}
          />
          <group name="leftShoulder" ref={la} position={[-0.36, 0.25, 0]}>
            <Ball
              at={[-0.02, -0.16, 0]}
              size={[0.12, c.top === 2 ? 0.17 : 0.27, 0.13]}
              color={cloth}
            />
            <Ball
              at={[-0.02, -0.42, 0.01]}
              size={[0.09, 0.16, 0.1]}
              color={skin}
            />
            <Ball
              at={[-0.02, -0.59, 0.01]}
              size={[0.095, 0.11, 0.08]}
              color={skin}
            />
            {c.accessories.includes(4) && (
              <Block
                at={[-0.02, -0.48, 0.1]}
                size={[0.14, 0.11, 0.05]}
                color="#172539"
              />
            )}
          </group>
          <group name="rightShoulder" ref={ra} position={[0.36, 0.25, 0]}>
            <Ball
              at={[0.02, -0.16, 0]}
              size={[0.12, c.top === 2 ? 0.17 : 0.27, 0.13]}
              color={cloth}
            />
            <Ball
              at={[0.02, -0.42, 0.01]}
              size={[0.09, 0.16, 0.1]}
              color={skin}
            />
            <Ball
              at={[0.02, -0.59, 0.01]}
              size={[0.095, 0.11, 0.08]}
              color={skin}
            />
            {c.accessories.includes(3) && (
              <group name="rightHand" position={[0.02, -0.53, 0.14]}>
                <mesh>
                  <cylinderGeometry args={[0.09, 0.065, 0.23, 20]} />
                  <meshStandardMaterial color="#f5f3e8" />
                </mesh>
                <mesh position={[0, 0.12, 0]}>
                  <cylinderGeometry args={[0.1, 0.1, 0.04, 20]} />
                  <meshStandardMaterial color="#28486d" />
                </mesh>
              </group>
            )}
          </group>
          {c.accessories.includes(0) && (
            <group name="badge">
              <Block
                at={[0, 0.02, 0.25]}
                size={[0.025, 0.44, 0.018]}
                color="#356c9e"
              />
              <Block
                at={[0, -0.15, 0.27]}
                size={[0.17, 0.22, 0.025]}
                color="#f6f4ec"
              />
              <Block
                at={[0, -0.12, 0.288]}
                size={[0.08, 0.07, 0.01]}
                color="#4386bc"
              />
            </group>
          )}
          {c.accessories.includes(2) && (
            <group name="back">
              <Ball
                at={[0, -0.03, -0.33]}
                size={[0.3, 0.36, 0.15]}
                color="#a9794e"
              />
              <Block
                at={[0, -0.13, -0.47]}
                size={[0.4, 0.25, 0.05]}
                color="#8e603d"
              />
              {[-0.23, 0.23].map((x) => (
                <Block
                  key={x}
                  at={[x, 0.1, 0.2]}
                  size={[0.05, 0.5, 0.035]}
                  color="#a9794e"
                />
              ))}
            </group>
          )}
        </group>
        <group position={[0, 0.81, 0]}>
          <group ref={ll} name="leftHip" position={[-0.15, 0, 0]}>
            <Ball at={[0, -0.32, 0]} size={[0.14, 0.36, 0.15]} color={pants} />
            <Ball
              at={[0, -0.66, 0.055]}
              size={[0.15, 0.095, 0.23]}
              color={c.shoes === 0 ? "#252535" : "#f0eee4"}
            />
          </group>
          <group ref={rl} name="rightHip" position={[0.15, 0, 0]}>
            <Ball at={[0, -0.32, 0]} size={[0.14, 0.36, 0.15]} color={pants} />
            <Ball
              at={[0, -0.66, 0.055]}
              size={[0.15, 0.095, 0.23]}
              color={c.shoes === 0 ? "#252535" : "#f0eee4"}
            />
          </group>
          {c.bottom === 1 && (
            <mesh position={[0, -0.19, 0]}>
              <cylinderGeometry args={[0.29, 0.44, 0.48, 24]} />
              <meshStandardMaterial color={pants} />
            </mesh>
          )}
        </group>
        <Ball at={[0, 1.61, 0]} size={[0.12, 0.18, 0.12]} color={skin} />
        <group name="head" position={[0, 1.99, 0]} scale={[c.face, 1, 1]}>
          <Ball size={[0.44, 0.49, 0.39]} color={skin} />
          <Ball at={[-0.44, -0.04, 0]} size={[0.09, 0.13, 0.07]} color={skin} />
          <Ball at={[0.44, -0.04, 0]} size={[0.09, 0.13, 0.07]} color={skin} />
          <Hair config={c} />
          {[-1, 1].map((s) => (
            <group key={s}>
              <Ball
                at={[s * 0.17, -0.005, 0.351]}
                size={[0.105, 0.126, 0.052]}
                color="#fffcf6"
              />
              <Ball
                at={[s * 0.165, -0.012, 0.395]}
                size={[0.062, 0.084, 0.028]}
                color={c.eyes}
              />
              <Ball
                at={[s * 0.15, 0.017, 0.421]}
                size={[0.023, 0.025, 0.008]}
                color="white"
              />
              <Ball
                at={[s * 0.17, 0.163, 0.353]}
                size={[0.115, 0.025, 0.027]}
                color={hairColors[c.hairColor]}
              />
            </group>
          ))}
          <Ball
            at={[0, -0.105, 0.394]}
            size={[0.055, 0.068, 0.055]}
            color={skin}
          />
          <Ball
            at={[0, -0.251, 0.322]}
            size={[0.075, 0.018, 0.025]}
            color="#a3695e"
          />
          {c.glasses > 0 && (
            <group position={[0, 0.005, 0.431]}>
              {[-1, 1].map((s) => (
                <mesh
                  key={s}
                  position={[s * 0.175, 0, 0]}
                  rotation={[0, 0, c.glasses === 4 ? s * 0.15 : 0]}
                  scale={[1, c.glasses === 3 ? 0.65 : 1, 1]}
                >
                  <torusGeometry
                    args={[
                      0.132,
                      0.015,
                      8,
                      c.glasses === 2 || c.glasses === 6 ? 4 : 32,
                    ]}
                  />
                  <meshStandardMaterial
                    color={c.glasses === 4 ? "#cbb680" : "#253346"}
                    metalness={0.4}
                  />
                </mesh>
              ))}
              <Block
                at={[0, 0, 0]}
                size={[0.1, 0.022, 0.025]}
                color="#253346"
              />
            </group>
          )}
          {c.accessories.includes(1) && (
            <group name="headset">
              <mesh rotation={[0, 0, 0]}>
                <torusGeometry args={[0.51, 0.035, 8, 32, Math.PI]} />
                <meshStandardMaterial color="#1e2a40" />
              </mesh>
              {[-0.49, 0.49].map((x) => (
                <Ball
                  key={x}
                  at={[x, 0, 0]}
                  size={[0.075, 0.15, 0.13]}
                  color="#25374e"
                />
              ))}
              <Block
                at={[0.35, -0.17, 0.31]}
                size={[0.27, 0.025, 0.035]}
                color="#354d66"
              />
            </group>
          )}
        </group>
      </group>
    </group>
  );
}
