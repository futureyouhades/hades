import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const BASE_Y = -1.43;

interface BaseRingProps {
  radius: number;
  speed: number;
  opacity: number;
  color: string;
  phase: number;
}

function BaseRing({ radius, speed, opacity, color, phase }: BaseRingProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z += speed * delta;
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = opacity * (0.84 + Math.sin(state.clock.elapsedTime * 1.25 + phase) * 0.16);
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]} position={[0, BASE_Y, 0]}>
      <torusGeometry args={[radius, 0.0035, 8, 180]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

export default function HoloBase() {
  const core = useRef<THREE.Mesh>(null);
  const cone = useRef<THREE.Mesh>(null);
  const rings = useMemo(() => [
    { radius: 0.18, speed: 0.20, opacity: 0.72, color: "#b9ffff", phase: 0.2 },
    { radius: 0.34, speed: -0.16, opacity: 0.60, color: "#44e6ff", phase: 1.1 },
    { radius: 0.55, speed: 0.13, opacity: 0.46, color: "#22c9ff", phase: 2.0 },
    { radius: 0.79, speed: -0.10, opacity: 0.32, color: "#218dff", phase: 2.8 },
    { radius: 1.04, speed: 0.075, opacity: 0.22, color: "#315dff", phase: 3.5 },
    { radius: 1.28, speed: -0.05, opacity: 0.13, color: "#513eff", phase: 4.2 },
  ], []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (core.current) {
      const material = core.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.82 + Math.sin(time * 2.1) * 0.12;
      core.current.scale.setScalar(1 + Math.sin(time * 1.8) * 0.07);
    }
    if (cone.current) {
      const material = cone.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.038 + Math.sin(time * 1.15) * 0.008;
    }
  });

  return (
    <group>
      {rings.map((ring, index) => <BaseRing key={index} {...ring} />)}
      <mesh ref={core} position={[0, BASE_Y + 0.01, 0]}>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshBasicMaterial color="#cfffff" transparent opacity={0.86} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={cone} position={[0, BASE_Y + 0.57, -0.06]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.48, 1.14, 48, 1, true]} />
        <meshBasicMaterial color="#21bfff" transparent opacity={0.038} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
