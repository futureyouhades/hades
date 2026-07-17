import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface Props { count?: number; radius?: number; }

function NeuralDust({ count, radius, color, size, speed, outer = false }: { count: number; radius: number; color: string; size: number; speed: number; outer?: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const side = Math.random() < .5 ? -1 : 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const fill = outer ? .98 + Math.random() * .12 : .58 + Math.pow(Math.random(), .38) * .4;
      const vertical = Math.cos(phi);
      const corticalWidth = Math.pow(Math.sin(phi), .62);
      const lowerTaper = .74 + .26 * THREE.MathUtils.smoothstep(vertical, -.82, .16);
      const furrow = 1 + Math.sin(theta * 5 + phi * 8) * .055;
      const r = radius * .55 * fill;
      data[i * 3] = side * .61 + r * .54 * corticalWidth * Math.cos(theta) * furrow * lowerTaper;
      data[i * 3 + 1] = .1 + r * .88 * vertical + Math.max(0, vertical) * .08;
      data[i * 3 + 2] = r * .57 * corticalWidth * Math.sin(theta) * furrow + side * .02;
    }
    return data;
  }, [count, outer, radius]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += speed * delta * .35;
    const material = ref.current.material as THREE.PointsMaterial;
    material.opacity = (outer ? .28 : .52) + Math.sin(state.clock.elapsedTime * 3.25 + speed * 30) * .07;
  });

  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color={color} size={size} transparent opacity={outer ? .28 : .52} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} /></points>;
}

export default function BrainParticles({ count = 5000, radius = 2 }: Props) {
  return <><NeuralDust count={count} radius={radius} size={.012} color="#45e9ff" speed={.025} /><NeuralDust count={Math.floor(count * .3)} radius={radius * .92} size={.016} color="#7d8dff" speed={-.021} /><NeuralDust count={Math.floor(count * .07)} radius={radius * 1.06} size={.01} color="#bafcff" speed={.014} outer /></>;
}
