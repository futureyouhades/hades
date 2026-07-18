import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface RingData {
  radius: number;
  tube: number;
  speed: number;
  rotation: [number, number, number];
  color: string;
  opacity: number;
}

function Ring({ radius, tube, speed, rotation, color, opacity }: RingData) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += speed * delta;
  });

  return (
    <mesh ref={ref} rotation={rotation}>
      <torusGeometry args={[radius, tube, 8, 220]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

export default function BrainRings() {
  const rings = useMemo<RingData[]>(() => [
    { radius: 1.51, tube: 0.0024, speed: 0.018, rotation: [0, 0, 0], color: "#287dff", opacity: 0.10 },
    { radius: 1.51, tube: 0.0023, speed: -0.012, rotation: [0.62, 0.08, 0.12], color: "#2abaff", opacity: 0.075 },
    { radius: 1.51, tube: 0.0022, speed: 0.014, rotation: [-0.64, -0.18, -0.16], color: "#385eff", opacity: 0.07 },
    { radius: 1.51, tube: 0.0021, speed: -0.01, rotation: [1.08, 0.22, 0.28], color: "#27d5ff", opacity: 0.055 },
    { radius: 1.51, tube: 0.0021, speed: 0.009, rotation: [-1.06, -0.15, -0.32], color: "#654dff", opacity: 0.055 },
    { radius: 1.51, tube: 0.0020, speed: -0.008, rotation: [0.2, 1.03, 0.08], color: "#248dff", opacity: 0.05 },
    { radius: 1.64, tube: 0.0026, speed: 0.075, rotation: [1.46, 0.17, 0.37], color: "#43ddff", opacity: 0.24 },
    { radius: 1.78, tube: 0.0022, speed: -0.052, rotation: [1.51, -0.42, -0.68], color: "#6557ff", opacity: 0.16 },
  ], []);

  return <group position={[0, -0.04, -0.18]}>{rings.map((ring, index) => <Ring key={index} {...ring} />)}</group>;
}
