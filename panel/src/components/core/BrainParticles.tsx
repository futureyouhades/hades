import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface Props {
  count?: number;
}

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => ((value = (Math.imul(1664525, value) + 1013904223) >>> 0) / 4294967296);
}

export default function BrainParticles({ count = 170 }: Props) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const random = seeded(0x484f4c4f);
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const radius = 1.48 * Math.sqrt(random());
      data[i * 3] = Math.cos(angle) * radius;
      data[i * 3 + 1] = Math.sin(angle) * radius * 0.95 - 0.04;
      data[i * 3 + 2] = (random() - 0.5) * 0.85 - 0.08;
    }
    return data;
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z += delta * 0.006;
    const material = ref.current.material as THREE.PointsMaterial;
    material.opacity = 0.18 + Math.sin(state.clock.elapsedTime * 1.25) * 0.035;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#3fbfff" size={0.009} transparent opacity={0.18} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
