import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface RingData { radius: number; tube: number; speed: number; rotation: [number, number, number]; color: string; opacity: number; }

function Ring({ radius, tube, speed, rotation, color, opacity }: RingData) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (!ref.current) return; ref.current.rotation.z += speed * delta; ref.current.rotation.y += speed * delta * .16; });
  return <mesh ref={ref} rotation={rotation}><torusGeometry args={[radius, tube, 16, 192]} /><meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>;
}

export default function BrainRings() {
  const rings = useMemo<RingData[]>(() => [
    { radius: 1.55, tube: .005, speed: .09, rotation: [.18, .1, 0], color: "#55eaff", opacity: .24 },
    { radius: 1.88, tube: .004, speed: -.055, rotation: [1.08, .22, .45], color: "#438dff", opacity: .17 },
    { radius: 2.18, tube: .003, speed: .035, rotation: [.5, 1.18, .15], color: "#887cff", opacity: .12 },
  ], []);
  return <>{rings.map((ring, index) => <Ring key={index} {...ring} />)}</>;
}
