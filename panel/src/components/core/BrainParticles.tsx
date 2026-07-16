import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface Props {
  count?: number;
  radius?: number;
}

function ParticleCloud({
  count,
  radius,
  size,
  color,
  speed,
}: {
  count: number;
  radius: number;
  size: number;
  color: string;
  speed: number;
}) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = radius + Math.random() * 0.9;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      data[i * 3] =
        r * Math.sin(phi) * Math.cos(theta);

      data[i * 3 + 1] =
        r * Math.cos(phi);

      data[i * 3 + 2] =
        r * Math.sin(phi) * Math.sin(theta);
    }

    return data;
  }, [count, radius]);

  useFrame((_, delta) => {
    if (!ref.current) return;

    ref.current.rotation.y += speed * delta;
    ref.current.rotation.x += speed * 0.25 * delta;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

export default function BrainParticles({
  count = 3000,
  radius = 2,
}: Props) {
  return (
    <>
      <ParticleCloud
        count={count}
        radius={radius}
        size={0.03}
        color="#6fefff"
        speed={0.05}
      />

      <ParticleCloud
        count={1800}
        radius={radius + 0.4}
        size={0.02}
        color="#d6ffff"
        speed={-0.03}
      />

      <ParticleCloud
        count={1200}
        radius={radius + 0.8}
        size={0.018}
        color="#3ddcff"
        speed={0.015}
      />
    </>
  );
}
