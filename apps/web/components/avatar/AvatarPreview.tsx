"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import AvatarRenderer, { type Pose } from "./AvatarRenderer";
import type { AvatarConfig } from "@/lib/avatars";
export default function AvatarPreview({
  config,
  pose,
}: {
  config: AvatarConfig;
  pose: Pose;
}) {
  return (
    <Canvas
      fallback={
        <div className="preview-loading">
          Ative o WebGL no navegador para editar seu avatar 3D.
        </div>
      }
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [0, 1.5, 4.8], fov: 37 }}
      gl={{ preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight castShadow position={[3, 5, 4]} intensity={2.6} />
      <pointLight position={[-3, 2, -2]} color="#5c9fff" intensity={14} />
      <AvatarRenderer config={config} pose={pose} />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={5}
        blur={2.5}
        far={4}
        resolution={256}
      />
      <mesh position={[0, -0.03, 0]} receiveShadow>
        <cylinderGeometry args={[1.1, 1.15, 0.06, 64]} />
        <meshStandardMaterial
          color="#142c46"
          metalness={0.2}
          roughness={0.55}
        />
      </mesh>
      <OrbitControls
        target={[0, 1.18, 0]}
        enablePan={false}
        minDistance={2.5}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2 - 0.03}
      />
    </Canvas>
  );
}
