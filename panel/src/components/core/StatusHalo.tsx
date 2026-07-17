import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function HaloRing({ inner, outer, color, speed, opacity }: { inner: number; outer: number; color: string; speed: number; opacity: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z += speed * delta;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * .8) * .006;
    ref.current.scale.setScalar(pulse);
  });
  return <mesh ref={ref}><ringGeometry args={[inner, outer, 192]} /><meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>;
}
export default function StatusHalo() {
  return <><HaloRing inner={2.34} outer={2.348} color="#38dfff" speed={.035} opacity={.1} /><HaloRing inner={2.57} outer={2.576} color="#697eff" speed={-.022} opacity={.065} /></>;
}
