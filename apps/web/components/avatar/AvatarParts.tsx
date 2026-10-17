"use client";
import { hairColors, type AvatarConfig } from "@/lib/avatars";
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
export function Hair({ config: c }: { config: AvatarConfig }) {
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
