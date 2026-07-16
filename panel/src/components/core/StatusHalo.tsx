import { useFrame } from "@react-three/fiber";
import { AdditiveBlending } from "three";
import { useRef } from "react";
import * as THREE from "three";

function HaloRing({
  inner,
  outer,
  color,
  speed,
  opacity,
}: {
  inner: number;
  outer: number;
  color: string;
  speed: number;
  opacity: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;

    ref.current.rotation.z += speed * delta;
    ref.current.rotation.x += speed * 0.2 * delta;

    const pulse =
      1 + Math.sin(state.clock.elapsedTime * 2) * 0.015;

    ref.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <mesh ref={ref}>
      <ringGeometry args={[inner, outer, 256]} />

      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function StatusHalo() {
  return (
    <>
      <HaloRing
        inner={2.35}
        outer={2.42}
        color="#38dfff"
        speed={0.18}
        opacity={0.22}
      />

      <HaloRing
        inner={2.55}
        outer={2.61}
        color="#7ef7ff"
        speed={-0.12}
        opacity={0.12}
      />

      <HaloRing
        inner={2.78}
        outer={2.83}
        color="#d8ffff"
        speed={0.08}
        opacity={0.07}
      />
    </>
  );
}
