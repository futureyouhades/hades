import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  count?: number;
}

export default function BrainParticles({
  count = 8000,
}: Props) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorA = new THREE.Color("#1ec8ff");
    const colorB = new THREE.Color("#6cf5ff");

    for (let i = 0; i < count; i++) {
      const radius = 1.8 + Math.random() * 1.8;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x =
        radius *
        Math.sin(phi) *
        Math.cos(theta);

      const y =
        radius *
        Math.cos(phi);

      const z =
        radius *
        Math.sin(phi) *
        Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixed = colorA
        .clone()
        .lerp(colorB, Math.random());

      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    return {
      positions,
      colors,
    };
  }, [count]);

  useEffect(() => {
    if (!pointsRef.current) return;

    pointsRef.current.geometry.computeBoundingSphere();
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const t = state.clock.elapsedTime;

    pointsRef.current.rotation.y = t * 0.05;
    pointsRef.current.rotation.x =
      Math.sin(t * 0.25) * 0.15;

    const pulse =
      1 + Math.sin(t * 2.2) * 0.025;

    pointsRef.current.scale.set(
      pulse,
      pulse,
      pulse
    );
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />

        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        vertexColors
        size={0.022}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  );
}
