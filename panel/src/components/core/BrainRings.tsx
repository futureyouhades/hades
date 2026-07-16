import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface RingData {
  radius: number;
  tube: number;
  speed: number;
  rotation: [number, number, number];
  color: string;
}

function Ring({
  radius,
  tube,
  speed,
  rotation,
  color,
}: RingData) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;

    ref.current.rotation.x += speed * delta * 0.8;
    ref.current.rotation.y += speed * delta;
    ref.current.rotation.z += speed * delta * 0.6;
  });

  return (
    <mesh ref={ref} rotation={rotation}>
      <torusGeometry args={[radius, tube, 32, 256]} />

      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

export default function BrainRings() {
  const rings = useMemo<RingData[]>(
    () => [
      {
        radius: 1.35,
        tube: 0.015,
        speed: 0.60,
        rotation: [0, 0, 0],
        color: "#66f3ff",
      },
      {
        radius: 1.55,
        tube: 0.014,
        speed: -0.42,
        rotation: [0.8, 0.2, 0],
        color: "#46d7ff",
      },
      {
        radius: 1.80,
        tube: 0.012,
        speed: 0.30,
        rotation: [1.1, 0.5, 0.4],
        color: "#7df8ff",
      },
      {
        radius: 2.05,
        tube: 0.012,
        speed: -0.22,
        rotation: [0.2, 1.4, 0.1],
        color: "#3fcfff",
      },
      {
        radius: 2.30,
        tube: 0.010,
        speed: 0.18,
        rotation: [1.5, 0.4, 0.8],
        color: "#b5ffff",
      },
    ],
    []
  );

  return (
    <>
      {rings.map((ring, index) => (
        <Ring key={index} {...ring} />
      ))}
    </>
  );
}
