import { useMemo } from "react";
import * as THREE from "three";

interface Props {
  radius?: number;
  connections?: number;
}

export default function BrainNetwork({
  radius = 2.15,
  connections = 180,
}: Props) {
  const positions = useMemo(() => {
    const vertices: number[] = [];

    for (let i = 0; i < connections; i++) {
      const theta1 = Math.random() * Math.PI * 2;
      const phi1 = Math.acos(2 * Math.random() - 1);

      const theta2 = theta1 + (Math.random() - 0.5) * 0.45;
      const phi2 = phi1 + (Math.random() - 0.5) * 0.45;

      const p1 = new THREE.Vector3(
        radius * Math.sin(phi1) * Math.cos(theta1),
        radius * Math.cos(phi1),
        radius * Math.sin(phi1) * Math.sin(theta1)
      );

      const p2 = new THREE.Vector3(
        radius * Math.sin(phi2) * Math.cos(theta2),
        radius * Math.cos(phi2),
        radius * Math.sin(phi2) * Math.sin(theta2)
      );

      vertices.push(
        p1.x,
        p1.y,
        p1.z,

        p2.x,
        p2.y,
        p2.z
      );
    }

    return new Float32Array(vertices);
  }, [connections, radius]);

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>

      <lineBasicMaterial
        color="#5cecff"
        transparent
        opacity={0.25}
      />
    </lineSegments>
  );
}
