import { useFrame } from "@react-three/fiber";
import { AdditiveBlending } from "three";
import { useRef } from "react";
import * as THREE from "three";

function GlowLayer({
  radius,
  opacity,
  color,
  speed,
}: {
  radius: number;
  opacity: number;
  color: string;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;

    const pulse =
      1 +
      Math.sin(state.clock.elapsedTime * speed) *
        0.04;

    ref.current.scale.set(
      pulse,
      pulse,
      pulse
    );
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius, 64, 64]} />

      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function BrainGlow() {
  return (
    <>
      <GlowLayer
        radius={1.25}
        opacity={0.10}
        color="#00d9ff"
        speed={2}
      />

      <GlowLayer
        radius={1.55}
        opacity={0.06}
        color="#42e8ff"
        speed={1.5}
      />

      <GlowLayer
        radius={1.90}
        opacity={0.035}
        color="#78f5ff"
        speed={1.2}
      />

      <GlowLayer
        radius={2.25}
        opacity={0.02}
        color="#c8ffff"
        speed={0.8}
      />
    </>
  );
}
