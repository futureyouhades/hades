import { useMemo } from "react";
import * as THREE from "three";

interface Props { radius?: number; connections?: number; }

export default function BrainNetwork({ radius = 2.15, connections = 180 }: Props) {
  const positions = useMemo(() => {
    const vertices: number[] = [];
    for (let i = 0; i < connections; i++) {
      const side = Math.random() < .5 ? -1 : 1;
      const theta1 = Math.random() * Math.PI * 2;
      const phi1 = Math.acos(2 * Math.random() - 1);
      const theta2 = theta1 + (Math.random() - .5) * .34;
      const phi2 = phi1 + (Math.random() - .5) * .34;
      const corticalRadius = radius * .49;
      const point = (theta: number, phi: number) => new THREE.Vector3(
        side * .52 + corticalRadius * .72 * Math.sin(phi) * Math.cos(theta),
        .03 + corticalRadius * 1.02 * Math.cos(phi),
        corticalRadius * .82 * Math.sin(phi) * Math.sin(theta)
      );
      const p1 = point(theta1, phi1);
      const p2 = point(theta2, phi2);
      vertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    }
    return new Float32Array(vertices);
  }, [connections, radius]);

  return <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><lineBasicMaterial color="#5cecff" transparent opacity={.42} /></lineSegments>;
}
