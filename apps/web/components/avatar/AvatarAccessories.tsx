"use client";
import { createPortal } from "@react-three/fiber";
import type { Group } from "three";
import { clothingColors, type AvatarConfig } from "@/lib/avatars";

function Box({
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
      <meshStandardMaterial color={color} roughness={0.58} />
    </mesh>
  );
}
function Glasses({ style, color }: { style: number; color: string }) {
  const frame = style === 4 ? "#b99553" : style === 6 ? "#17232f" : "#253346";
  const halfWidth = style === 3 ? 0.069 : style === 6 ? 0.078 : 0.062;
  const halfHeight = style === 3 ? 0.041 : style === 6 ? 0.048 : 0.054;
  const lensX = style === 6 ? 0.091 : 0.079;
  const bar = 0.008;
  return (
    <group position={[0, -0.025, 0.245]}>
      {[-1, 1].map((side) =>
        style === 1 || style === 4 ? (
          <mesh
            key={side}
            position={[side * lensX, 0, 0]}
            scale={[1, style === 4 ? 1.2 : 1, 1]}
          >
            <torusGeometry args={[0.05, bar, 8, 28]} />
            <meshStandardMaterial
              color={frame}
              metalness={style === 4 ? 0.6 : 0.25}
              roughness={0.3}
            />
          </mesh>
        ) : (
          <group key={side} position={[side * lensX, 0, 0]}>
            <Box
              size={[halfWidth * 2, bar, 0.012]}
              color={frame}
              position={[0, halfHeight, 0]}
            />
            <Box
              size={[halfWidth * 2, bar, 0.012]}
              color={frame}
              position={[0, -halfHeight, 0]}
            />
            <Box
              size={[bar, halfHeight * 2, 0.012]}
              color={frame}
              position={[-halfWidth, 0, 0]}
            />
            <Box
              size={[bar, halfHeight * 2, 0.012]}
              color={frame}
              position={[halfWidth, 0, 0]}
            />
            {style === 5 && (
              <Box
                size={[halfWidth * 2.35, 0.009, 0.01]}
                color={frame}
                position={[0, halfHeight + 0.011, 0]}
              />
            )}
          </group>
        ),
      )}
      <Box size={[0.034, 0.008, 0.012]} color={frame} />
      <Box
        size={[0.12, 0.007, 0.008]}
        color={frame}
        position={[-0.15, 0.014, -0.015]}
      />
      <Box
        size={[0.12, 0.007, 0.008]}
        color={frame}
        position={[0.15, 0.014, -0.015]}
      />
      {style === 6 && (
        <mesh>
          <planeGeometry args={[0.24, 0.072]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.18}
            roughness={0.2}
          />
        </mesh>
      )}
    </group>
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
          {has(0) && c.base === "fem" && (
            <group position={[-0.13, -0.04, 0.025]}>
              <Box
                size={[0.012, 0.2, 0.008]}
                color="#c2a665"
                position={[-0.04, 0.09, 0]}
              />
              <Box
                size={[0.012, 0.2, 0.008]}
                color="#c2a665"
                position={[0.04, 0.09, 0]}
              />
              <Box
                size={[0.115, 0.145, 0.018]}
                color="#e9edf1"
                position={[0, -0.035, 0.018]}
              />
              <Box
                size={[0.105, 0.025, 0.006]}
                color="#4baeff"
                position={[0, 0.014, 0.03]}
              />
              <Box
                size={[0.032, 0.032, 0.004]}
                color="#d5b76c"
                position={[0, -0.07, 0.03]}
              />
            </group>
          )}
          {c.top === 1 && c.base === "fem" && (
            <group position={[0, 0.08, 0.035]}>
              <mesh position={[-0.035, -0.08, 0]} rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.037, 0.075, 3]} />
                <meshStandardMaterial color="#f4f0e8" />
              </mesh>
              <mesh position={[0.035, -0.08, 0]} rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.037, 0.075, 3]} />
                <meshStandardMaterial color="#f4f0e8" />
              </mesh>
              <Box
                size={[0.045, 0.12, 0.022]}
                color={cloth}
                position={[0, -0.18, 0.012]}
              />
              <mesh position={[0, -0.25, 0.012]}>
                <coneGeometry args={[0.036, 0.09, 4]} />
                <meshStandardMaterial color={cloth} />
              </mesh>
            </group>
          )}
          {c.top === 4 && (
            <Box
              size={[0.012, 0.38, 0.012]}
              color="#b6c7d8"
              position={[0, -0.06, 0.03]}
            />
          )}
        </>,
        a.chest,
      )}

      {createPortal(
        <>
          {has(7) && (
            <group>
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <torusGeometry args={[0.14, 0.009, 8, 36]} />
                <meshStandardMaterial
                  color="#c8a461"
                  metalness={0.7}
                  roughness={0.25}
                />
              </mesh>
              <mesh position={[0, -0.105, 0.105]}>
                <octahedronGeometry args={[0.026, 0]} />
                <meshStandardMaterial
                  color="#c8a461"
                  metalness={0.65}
                  roughness={0.24}
                />
              </mesh>
            </group>
          )}
          {c.top === 3 && (
            <group position={[0, 0.015, -0.105]}>
              <mesh position={[0, 0.09, -0.02]} scale={[1, 0.8, 0.45]}>
                <sphereGeometry args={[0.18, 24, 16]} />
                <meshStandardMaterial color={cloth} roughness={0.9} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <torusGeometry args={[0.125, 0.022, 8, 28]} />
                <meshStandardMaterial color={cloth} roughness={0.85} />
              </mesh>
            </group>
          )}
          {has(1) && !has(5) && !has(6) && (
            <group>
              <mesh position={[0, 0.04, -0.005]}>
                <torusGeometry args={[0.235, 0.011, 8, 36, Math.PI]} />
                <meshStandardMaterial color="#21324b" />
              </mesh>
              {[-1, 1].map((side) => (
                <group key={side} position={[side * 0.235, 0.015, 0]}>
                  <mesh scale={[0.055, 0.083, 0.07]}>
                    <sphereGeometry args={[1, 20, 14]} />
                    <meshStandardMaterial color="#26384d" />
                  </mesh>
                  <Box
                    size={[0.066, 0.052, 0.018]}
                    color="#26384d"
                    position={[0, 0, 0.04]}
                  />
                  <Box
                    size={[0.045, 0.025, 0.009]}
                    color="#4baeff"
                    position={[0, 0, 0.052]}
                  />
                </group>
              ))}
            </group>
          )}
          {has(5) && (
            <group position={[0, 0.34, 0]}>
              <mesh position={[0, 0.015, 0]} scale={[1, 0.64, 0.92]}>
                <sphereGeometry
                  args={[0.25, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
                />
                <meshStandardMaterial color={cloth} roughness={0.85} />
              </mesh>
              <mesh position={[0, 0.095, 0.17]} scale={[1, 0.12, 0.58]}>
                <sphereGeometry args={[0.24, 24, 12]} />
                <meshStandardMaterial color={cloth} roughness={0.82} />
              </mesh>
            </group>
          )}
          {has(6) && !has(5) && (
            <group position={[0, 0.34, 0]}>
              <mesh position={[0, 0.035, 0]} scale={[1, 0.62, 1]}>
                <sphereGeometry
                  args={[0.23, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2]}
                />
                <meshStandardMaterial color={cloth} roughness={0.78} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[0.21, 0.34, 36]} />
                <meshStandardMaterial color={cloth} side={2} roughness={0.82} />
              </mesh>
            </group>
          )}
        </>,
        a.head,
      )}
      {c.glasses > 0 &&
        createPortal(<Glasses style={c.glasses} color={c.eyes} />, a.head)}
      {has(2) &&
        createPortal(
          <group>
            <Box
              size={[0.31, 0.39, 0.14]}
              color="#374b63"
              position={[0, 0, -0.07]}
            />
            <Box
              size={[0.24, 0.17, 0.035]}
              color="#456381"
              position={[0, -0.1, -0.16]}
            />
            <Box
              size={[0.11, 0.012, 0.008]}
              color="#c4a35c"
              position={[0, 0.12, 0.008]}
            />
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[side * 0.105, 0.04, 0.025]}
                rotation={[0, 0, side * 0.14]}
              >
                <torusGeometry args={[0.16, 0.016, 7, 24, Math.PI]} />
                <meshStandardMaterial color="#24374e" />
              </mesh>
            ))}
          </group>,
          a.back,
        )}
      {has(4) &&
        createPortal(
          <group>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.045, 0.012, 8, 20]} />
              <meshStandardMaterial color="#202a36" />
            </mesh>
            <Box
              size={[0.062, 0.045, 0.022]}
              color="#172231"
              position={[0, 0, 0.035]}
            />
            <Box
              size={[0.034, 0.02, 0.005]}
              color="#4baeff"
              position={[0, 0, 0.049]}
            />
          </group>,
          a.wrist,
        )}
      {has(3) &&
        createPortal(
          <group rotation={[0, 0, -0.2]}>
            <mesh position={[0, 0.045, 0]}>
              <cylinderGeometry args={[0.047, 0.04, 0.11, 20]} />
              <meshStandardMaterial color="#f4f0e7" roughness={0.52} />
            </mesh>
            <mesh position={[0, 0.105, 0]}>
              <cylinderGeometry args={[0.049, 0.049, 0.012, 20]} />
              <meshStandardMaterial color="#25364b" />
            </mesh>
          </group>,
          a.hand,
        )}
    </>
  );
}
