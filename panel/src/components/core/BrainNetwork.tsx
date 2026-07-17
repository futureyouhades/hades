import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface Props { radius?: number; connections?: number; }

type NetworkData = {
  lines: Float32Array;
  nodes: Float32Array;
  colors: Float32Array;
  impulses: Float32Array;
  edges: Array<[THREE.Vector3, THREE.Vector3]>;
};

const cyan = new THREE.Color("#43e9ff");
const blue = new THREE.Color("#3f8cff");
const violet = new THREE.Color("#8f72ff");
const white = new THREE.Color("#e9ffff");

function corticalPoint(side: -1 | 1, radius: number, shell = 1) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const uneven = shell * (.91 + Math.random() * .13);
  const r = radius * .49 * uneven;
  const crown = Math.sin(phi);
  return new THREE.Vector3(
    side * .49 + r * .73 * crown * Math.cos(theta),
    .05 + r * 1.02 * Math.cos(phi),
    r * .84 * crown * Math.sin(theta)
  );
}

export default function BrainNetwork({ radius = 2.15, connections = 180 }: Props) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const impulsesRef = useRef<THREE.Points>(null);

  const data = useMemo<NetworkData>(() => {
    const lineData: number[] = [];
    const nodeData: number[] = [];
    const colorData: number[] = [];
    const edges: Array<[THREE.Vector3, THREE.Vector3]> = [];
    const nodeCount = Math.max(1800, connections * 4);

    for (let i = 0; i < nodeCount; i++) {
      const side = (Math.random() < .5 ? -1 : 1) as -1 | 1;
      const p = corticalPoint(side, radius, .55 + Math.random() * .45);
      nodeData.push(p.x, p.y, p.z);
      const strength = Math.random();
      const color = strength > .965 ? white : strength > .76 ? violet : strength > .42 ? cyan : blue;
      colorData.push(color.r, color.g, color.b);
    }

    for (let i = 0; i < connections; i++) {
      const side = (Math.random() < .5 ? -1 : 1) as -1 | 1;
      const p1 = corticalPoint(side, radius);
      const p2 = p1.clone().add(new THREE.Vector3(
        (Math.random() - .5) * .36,
        (Math.random() - .5) * .42,
        (Math.random() - .5) * .38
      ));
      if (Math.random() < .075) p2.x *= -.72;
      lineData.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      edges.push([p1, p2]);
    }

    const impulses = new Float32Array(72 * 3);
    return { lines: new Float32Array(lineData), nodes: new Float32Array(nodeData), colors: new Float32Array(colorData), impulses, edges };
  }, [connections, radius]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (linesRef.current) {
      const material = linesRef.current.material as THREE.LineBasicMaterial;
      material.opacity = .2 + Math.sin(t * .72) * .035;
    }
    if (nodesRef.current) {
      const material = nodesRef.current.material as THREE.PointsMaterial;
      material.opacity = .68 + Math.sin(t * 1.15) * .1;
    }
    if (impulsesRef.current && data.edges.length) {
      const attribute = impulsesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < attribute.count; i++) {
        const edge = data.edges[(i * 37) % data.edges.length];
        const progress = (t * (.12 + (i % 7) * .012) + i * .137) % 1;
        attribute.setXYZ(i,
          THREE.MathUtils.lerp(edge[0].x, edge[1].x, progress),
          THREE.MathUtils.lerp(edge[0].y, edge[1].y, progress),
          THREE.MathUtils.lerp(edge[0].z, edge[1].z, progress)
        );
      }
      attribute.needsUpdate = true;
    }
  });

  return <group>
    <lineSegments ref={linesRef}><bufferGeometry><bufferAttribute attach="attributes-position" args={[data.lines, 3]} /></bufferGeometry><lineBasicMaterial color="#51ddff" transparent opacity={.22} depthWrite={false} blending={THREE.AdditiveBlending} /></lineSegments>
    <points ref={nodesRef}><bufferGeometry><bufferAttribute attach="attributes-position" args={[data.nodes, 3]} /><bufferAttribute attach="attributes-color" args={[data.colors, 3]} /></bufferGeometry><pointsMaterial vertexColors size={.018} transparent opacity={.76} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} /></points>
    <points ref={impulsesRef}><bufferGeometry><bufferAttribute attach="attributes-position" args={[data.impulses, 3]} /></bufferGeometry><pointsMaterial color="#efffff" size={.055} transparent opacity={.95} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} /></points>
  </group>;
}
