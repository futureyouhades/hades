import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type LayerProps = { scale: [number, number, number]; opacity: number; color: string; speed: number; side: -1 | 1; };

function GlowLayer({ scale, opacity, color, speed, side }: LayerProps) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const wave = 1 + Math.sin(state.clock.elapsedTime * speed + side) * .018;
    ref.current.scale.set(scale[0] * wave, scale[1] * wave, scale[2] * wave);
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = opacity + Math.sin(state.clock.elapsedTime * speed * .7 + side) * opacity * .18;
  });
  return <mesh ref={ref} position={[side * .49, .04, 0]} scale={scale}><icosahedronGeometry args={[1, 4]} /><meshBasicMaterial color={color} wireframe transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>;
}

export default function BrainGlow() {
  const layers = useMemo(() => [
    { scale: [.76, 1.03, .83] as [number, number, number], opacity: .07, color: "#17dfff", speed: 1.15 },
    { scale: [.69, .94, .75] as [number, number, number], opacity: .055, color: "#557dff", speed: .86 },
  ], []);
  return <>{layers.flatMap((layer, index) => ([-1, 1] as const).map(side => <GlowLayer key={index + ":" + side} {...layer} side={side} />))}</>;
}
