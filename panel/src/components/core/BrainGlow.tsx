import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// Soft aura hugging the brain — kept faint so the interior stays dark.
export default function BrainGlow() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = .008 + Math.sin(state.clock.elapsedTime * 1.4) * .003;
  });
  return (
    <mesh ref={ref} position={[.02, 0, -.15]} scale={[1.05, .98, .7]}>
      <sphereGeometry args={[1, 32, 24]} />
      <meshBasicMaterial color="#1c66d8" transparent opacity={.008} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}
