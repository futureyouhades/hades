import { useFrame } from "@react-three/fiber";
import { AdditiveBlending } from "three";
import { useRef } from "react";
import * as THREE from "three";

export default function StatusHalo() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;

    const t = state.clock.elapsedTime;

    const scale =
      1 +
      Math.sin(t * 1.8) * 0.05;

    ref.current.scale.set(scale, scale, scale);

    ref.current.rotation.z += 0.0015;
  });

  return (
    <mesh ref={ref}>
      <ringGeometry args={[2.45, 2.65, 256]} />

      <meshBasicMaterial
        color="#55e9ff"
        transparent
        opacity={0.22}
        blending={AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

