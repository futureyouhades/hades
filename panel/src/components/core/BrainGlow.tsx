import { useFrame } from "@react-three/fiber";
import { AdditiveBlending } from "three";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type LayerProps = {
  radius: number;
  opacity: number;
  color: string;
  speed: number;
};

function GlowLayer({
  radius,
  opacity,
  color,
  speed,
}: LayerProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;

    const t = state.clock.elapsedTime;

    ref.current.rotation.y += speed * delta * 0.25;
    ref.current.rotation.x += speed * delta * 0.12;

    const pulse =
      1 +
      Math.sin(t * speed * 2.0) * 0.03;

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
  const layers = useMemo(
    () => [
      {
        radius: 1.22,
        opacity: 0.12,
        color: "#00d9ff",
        speed: 1.8,
      },
      {
        radius: 1.45,
        opacity: 0.08,
        color: "#36e5ff",
        speed: 1.4,
      },
      {
        radius: 1.72,
        opacity: 0.05,
        color: "#78f7ff",
        speed: 1.1,
      },
      {
        radius: 2.05,
        opacity: 0.025,
        color: "#d8ffff",
        speed: 0.8,
      },
    ],
    []
  );

  return (
    <>
      {layers.map((layer, index) => (
        <GlowLayer
          key={index}
          radius={layer.radius}
          opacity={layer.opacity}
          color={layer.color}
          speed={layer.speed}
        />
      ))}
    </>
  );
}
