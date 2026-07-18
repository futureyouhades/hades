import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// Holographic circular field framing the brain (dark interior, thin outline).
export default function StatusHalo() {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ring.current) return;
    const material = ring.current.material as THREE.MeshBasicMaterial;
    material.opacity = .3 + Math.sin(state.clock.elapsedTime * .9) * .06;
  });
  return <group position={[0, -.05, -.4]}>
    {/* crisp outer ring */}
    <mesh ref={ring}>
      <ringGeometry args={[1.5, 1.514, 160]} />
      <meshBasicMaterial color="#3fbcff" transparent opacity={.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
    {/* soft inner ring */}
    <mesh>
      <ringGeometry args={[1.36, 1.366, 160]} />
      <meshBasicMaterial color="#2f8fff" transparent opacity={.1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  </group>;
}
