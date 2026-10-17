"use client";
import { createPortal } from "@react-three/fiber";
import type { Group } from "three";
import { clothingColors, type AvatarConfig } from "@/lib/avatars";
function Block({
  size,
  color,
  position = [0, 0, 0],
}: {
  size: [number, number, number];
  color: string;
  position?: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
}
export default function AvatarAccessories({
  config: c,
  anchors: a,
}: {
  config: AvatarConfig;
  anchors: Record<string, Group>;
}) {
  const has = (id: number) => c.accessories.includes(id);
  const cloth = clothingColors[c.topColor];
  return (
    <>
      {createPortal(
        <>
          {has(0) && (
            <group>
              <Block
                size={[0.016, 0.32, 0.012]}
                color="#407fa9"
                position={[0, 0.04, 0]}
              />
              <Block
                size={[0.11, 0.15, 0.018]}
                color="#e5edf1"
                position={[0, -0.12, 0.008]}
              />
              <Block
                size={[0.07, 0.045, 0.02]}
                color="#4ea9df"
                position={[0, -0.1, 0.013]}
              />
            </group>
          )}
          {c.top === 1 && (
            <group position={[0, 0.1, -0.015]}>
              <Block size={[0.05, 0.25, 0.012]} color="#294268" />
            </group>
          )}
          {c.top === 4 && <Block size={[0.014, 0.42, 0.014]} color="#a6b4c3" />}
        </>,
        a.chest,
      )}
      {createPortal(
        <>
          {has(7) && (
            <group>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.105, 0.008, 8, 32]} />
                <meshStandardMaterial
                  color="#c8a461"
                  metalness={0.7}
                  roughness={0.25}
                />
              </mesh>
              <mesh position={[0, -0.08, 0.1]}>
                <sphereGeometry args={[0.022, 12, 8]} />
                <meshStandardMaterial color="#c8a461" metalness={0.7} />
              </mesh>
            </group>
          )}
          {c.top === 3 && (
            <group position={[0, 0, -0.1]}>
              <mesh position={[0, 0.07, -0.04]} scale={[1, 1.1, 0.5]}>
                <sphereGeometry args={[0.22, 24, 16]} />
                <meshStandardMaterial color={cloth} roughness={0.9} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.13, 0.035, 8, 24]} />
                <meshStandardMaterial color={cloth} />
              </mesh>
            </group>
          )}
        </>,
        a.neck,
      )}
      {createPortal(
        <>
          {has(1) && (
            <group>
              <mesh position={[0, 0.07, 0]}>
                <torusGeometry args={[0.32, 0.023, 8, 32, Math.PI]} />
                <meshStandardMaterial color="#21324b" />
              </mesh>
              {[-1, 1].map((s) => (
                <mesh
                  key={s}
                  position={[s * 0.31, 0.05, 0]}
                  scale={[0.045, 0.09, 0.075]}
                >
                  <sphereGeometry args={[1, 16, 12]} />
                  <meshStandardMaterial color="#21324b" />
                </mesh>
              ))}
            </group>
          )}
          {(has(5) || has(6)) && (
            <group position={[0, 0.31, 0]}>
              <mesh scale={[1, 0.65, 1]}>
                <sphereGeometry
                  args={[0.33, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
                />
                <meshStandardMaterial color={cloth} roughness={0.85} />
              </mesh>
              {has(6) ? (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.24, 0.43, 40]} />
                  <meshStandardMaterial color={cloth} side={2} />
                </mesh>
              ) : (
                <mesh position={[0, 0, 0.23]} scale={[1, 0.15, 1]}>
                  <sphereGeometry args={[0.23, 20, 12]} />
                  <meshStandardMaterial color={cloth} />
                </mesh>
              )}
            </group>
          )}
        </>,
        a.head,
      )}
      {has(2) &&
        createPortal(
          <mesh scale={[0.23, 0.3, 0.11]} castShadow>
            <sphereGeometry args={[1, 24, 18]} />
            <meshStandardMaterial color="#8e694b" roughness={0.85} />
          </mesh>,
          a.back,
        )}
      {has(4) &&
        createPortal(
          <group>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.055, 0.013, 8, 20]} />
              <meshStandardMaterial color="#253346" />
            </mesh>
            <Block
              size={[0.065, 0.045, 0.025]}
              position={[0, 0, 0.06]}
              color="#172231"
            />
          </group>,
          a.wrist,
        )}
      {has(3) &&
        createPortal(
          <group>
            <mesh>
              <cylinderGeometry args={[0.055, 0.04, 0.14, 20]} />
              <meshStandardMaterial color="#f2f0e6" />
            </mesh>
            <mesh position={[0, 0.071, 0]}>
              <cylinderGeometry args={[0.058, 0.058, 0.012, 20]} />
              <meshStandardMaterial color="#26364c" />
            </mesh>
          </group>,
          a.hand,
        )}
    </>
  );
}
