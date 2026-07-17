import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function EnergyVolume({ side, scale, opacity, color, phase }: { side: -1 | 1; scale: [number,number,number]; opacity: number; color: string; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = opacity * (1 + Math.sin(state.clock.elapsedTime * 1.65 + phase) * .13);
  });
  return <mesh ref={ref} position={[side * .61,.08,0]} scale={scale}><sphereGeometry args={[1,40,32]} /><meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>;
}
export default function BrainGlow() {
  const layers = useMemo(() => [
    { scale: [.58,.86,.52] as [number,number,number], opacity: .018, color: "#19dfff", phase: 0 },
    { scale: [.46,.7,.41] as [number,number,number], opacity: .025, color: "#315dff", phase: 2.1 },
  ], []);
  return <>{layers.flatMap((layer,index)=>([-1,1] as const).map(side=><EnergyVolume key={index+":"+side} {...layer} side={side} />))}</>;
}
