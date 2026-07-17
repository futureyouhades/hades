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
      const fill = outer ? .96 + Math.random() * .28 : Math.cbrt(Math.random()) * .94;
      const r = radius * .55 * fill;
      data[i * 3] = side * .49 + r * .7 * Math.sin(phi) * Math.cos(theta);
      data[i * 3 + 1] = .04 + r * 1.01 * Math.cos(phi);
      data[i * 3 + 2] = r * .82 * Math.sin(phi) * Math.sin(theta);
    }
    return data;
  }, [count, outer, radius]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += speed * delta;
    const material = ref.current.material as THREE.PointsMaterial;
    material.opacity = (outer ? .28 : .52) + Math.sin(state.clock.elapsedTime * 1.3 + speed * 30) * .07;
  });

  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color={color} size={size} transparent opacity={outer ? .28 : .52} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} /></points>;
}

export default function BrainParticles({ count = 5000, radius = 2 }: Props) {
  return <><NeuralDust count={count} radius={radius} size={.012} color="#45e9ff" speed={.012} /><NeuralDust count={Math.floor(count * .42)} radius={radius * .92} size={.016} color="#7d8dff" speed={-.009} /><NeuralDust count={Math.floor(count * .18)} radius={radius * 1.06} size={.01} color="#bafcff" speed={.006} outer /></>;
}
