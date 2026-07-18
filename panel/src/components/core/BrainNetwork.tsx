import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface Props {
  connections?: number;
}

type NeuralSurface = {
  points: Float32Array;
  seeds: Float32Array;
  strengths: Float32Array;
  lines: Float32Array;
  lineColors: Float32Array;
  longLines: Float32Array;
  contourLines: Float32Array;
  signalPaths: Array<[THREE.Vector3, THREE.Vector3]>;
};

const NeuralPointMaterial = shaderMaterial(
  { uTime: 0, uPixelRatio: 1 },
  `attribute float aSeed;
   attribute float aStrength;
   varying vec3 vColor;
   varying float vAlpha;
   uniform float uTime;
   uniform float uPixelRatio;

   void main() {
     vec4 mv = modelViewMatrix * vec4(position, 1.0);
     float front = smoothstep(-0.42, 0.42, position.z);
     float shimmer = 0.78 + 0.22 * sin(uTime * (1.7 + fract(aSeed * 19.0) * 2.7) + aSeed * 53.0);
     float impulse = pow(max(0.0, sin(uTime * 1.45 + aSeed * 71.0)), 32.0);
     float thoughtGate = step(0.80, fract(aSeed * 37.0));
     float thoughtPulse = pow(max(0.0, sin(uTime * 1.08 - position.x * 2.4 + aSeed * 29.0)), 11.0) * thoughtGate;
     float energy = aStrength * shimmer + impulse * 0.9;

     vec3 cobalt = vec3(0.025, 0.16, 0.72);
     vec3 cyan = vec3(0.05, 0.78, 1.0);
     vec3 violet = vec3(0.36, 0.16, 1.0);
     vec3 deepRed = vec3(1.28, 0.006, 0.025);
     vec3 white = vec3(0.82, 0.98, 1.0);
     vColor = mix(cobalt, cyan, 0.30 + front * 0.55);
     vColor = mix(vColor, violet, 0.10 + 0.08 * sin(aSeed * 91.0));
     vColor = mix(vColor, white, 0.58 * smoothstep(1.04, 1.72, energy));
     vColor = mix(vColor, deepRed, thoughtPulse * 0.74);
     vColor *= 1.38 + front * 0.30;
     vAlpha = (0.38 + front * 0.50) * (0.68 + energy * 0.38 + thoughtPulse * 0.34);

     gl_PointSize = (0.95 + aStrength * 2.65 + impulse * 3.5 + thoughtPulse * 2.2) * uPixelRatio * (5.2 / -mv.z);
     gl_Position = projectionMatrix * mv;
   }`,
  `varying vec3 vColor;
   varying float vAlpha;

   void main() {
     vec2 p = gl_PointCoord - 0.5;
     float d = length(p);
     if (d > 0.5) discard;
     float halo = 1.0 - smoothstep(0.05, 0.5, d);
     float core = 1.0 - smoothstep(0.0, 0.12, d);
     gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.82), halo * vAlpha);
   }`,
);

extend({ NeuralPointMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    neuralPointMaterial: ThreeElements["shaderMaterial"] & {
      uTime?: number;
      uPixelRatio?: number;
    };
  }
}

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => ((value = (Math.imul(1664525, value) + 1013904223) >>> 0) / 4294967296);
}

// Side-profile silhouette copied as a procedural neural volume. The points are
// intentionally asymmetric so it reads as a brain rather than an oval cloud.
const OUTLINE: Array<[number, number]> = [
  [-1.31, 0.13], [-1.29, 0.42], [-1.16, 0.67], [-0.92, 0.84],
  [-0.62, 0.94], [-0.28, 0.98], [0.08, 0.96], [0.43, 0.89],
  [0.74, 0.74], [1.00, 0.55], [1.19, 0.31], [1.28, 0.05],
  [1.24, -0.18], [1.08, -0.34], [1.02, -0.52], [0.88, -0.67],
  [0.67, -0.75], [0.47, -0.70], [0.30, -0.78], [0.34, -0.92],
  [0.28, -1.08], [0.12, -1.13], [-0.02, -1.06], [-0.07, -0.89],
  [-0.10, -0.72], [-0.30, -0.64], [-0.55, -0.53], [-0.83, -0.43],
  [-1.08, -0.30], [-1.25, -0.10],
];

const FOLDS: Array<Array<[number, number]>> = [
  [[-1.10, 0.15], [-0.84, 0.56], [-0.42, 0.76], [0.02, 0.72], [0.42, 0.55], [0.82, 0.30], [1.08, 0.08]],
  [[-1.02, -0.08], [-0.69, 0.13], [-0.32, 0.22], [0.07, 0.11], [0.42, -0.09], [0.76, -0.21], [1.02, -0.18]],
  [[-0.78, -0.31], [-0.48, -0.47], [-0.13, -0.53], [0.20, -0.45], [0.43, -0.29], [0.66, -0.43]],
  [[-0.18, 0.90], [-0.08, 0.63], [-0.13, 0.35], [-0.02, 0.10], [0.19, -0.16], [0.27, -0.47]],
  [[0.50, -0.39], [0.72, -0.32], [0.91, -0.43], [0.86, -0.61], [0.66, -0.68], [0.49, -0.57]],
];

function insideBrain(x: number, y: number) {
  let inside = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function addPathSegments(target: number[], points: THREE.Vector3[]) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    target.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
}

function toFloat32(points: THREE.Vector3[]) {
  const result = new Float32Array(points.length * 3);
  points.forEach((point, index) => {
    result[index * 3] = point.x;
    result[index * 3 + 1] = point.y;
    result[index * 3 + 2] = point.z;
  });
  return result;
}

export default function BrainNetwork({ connections = 3 }: Props) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const signals = useRef<THREE.Points>(null);
  const redSignals = useRef<THREE.Points>(null);

  const surface = useMemo<NeuralSurface>(() => {
    const random = seeded(0x48414445);
    const nodes: THREE.Vector3[] = [];
    const strengths: number[] = [];
    const seeds: number[] = [];
    const contourLines: number[] = [];

    const addNode = (point: THREE.Vector3, strength: number) => {
      nodes.push(point);
      strengths.push(strength);
      seeds.push(random());
    };

    // Dense interior network with real depth. Front layers are brighter in the shader.
    let attempts = 0;
    while (nodes.length < 740 && attempts < 7000) {
      attempts++;
      const x = -1.32 + random() * 2.62;
      const y = -1.19 + random() * 2.19;
      if (!insideBrain(x, y)) continue;
      const stem = y < -0.72;
      const edgeFactor = Math.max(0.22, 1 - Math.abs(y - 0.02) * 0.48 - Math.abs(x) * 0.08);
      const thickness = (stem ? 0.13 : 0.37) * edgeFactor;
      const z = (random() * 2 - 1) * thickness;
      const hub = random() > 0.88;
      addNode(new THREE.Vector3(x, y, z), hub ? 0.72 + random() * 0.30 : 0.22 + random() * 0.27);
    }

    // Smooth luminous exterior contour.
    const outlineCurve = new THREE.CatmullRomCurve3(
      OUTLINE.map(([x, y]) => new THREE.Vector3(x, y, 0.06)),
      true,
      "centripetal",
      0.5,
    );
    const outlinePoints = outlineCurve.getSpacedPoints(132);
    addPathSegments(contourLines, outlinePoints);
    outlinePoints.slice(0, -1).forEach((point, index) => {
      if (index % 2 === 0) addNode(point, 0.38 + random() * 0.20);
    });

    // Anatomical neural sweeps stop the graph reading as a generic polygon mesh.
    FOLDS.forEach((fold, foldIndex) => {
      const curve = new THREE.CatmullRomCurve3(
        fold.map(([x, y]) => new THREE.Vector3(x, y, 0.11 + foldIndex * 0.012)),
        false,
        "centripetal",
        0.5,
      );
      const points = curve.getSpacedPoints(foldIndex === 4 ? 30 : 38);
      addPathSegments(contourLines, points);
      points.forEach((point, index) => {
        if (index % 2 === 0) addNode(point, 0.36 + random() * 0.22);
      });
    });

    const lines: number[] = [];
    const lineColors: number[] = [];
    const signalPaths: Array<[THREE.Vector3, THREE.Vector3]> = [];
    const seen = new Set<string>();
    const cobalt = new THREE.Color("#0b3fcb");
    const cyan = new THREE.Color("#28dfff");
    const violet = new THREE.Color("#7656ff");

    for (let i = 0; i < nodes.length; i++) {
      const nearest: Array<{ index: number; distance: number }> = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const distance = nodes[i].distanceTo(nodes[j]);
        if (distance < 0.205) nearest.push({ index: j, distance });
      }
      nearest.sort((a, b) => a.distance - b.distance);

      for (let n = 0; n < Math.min(connections, nearest.length); n++) {
        const j = nearest[n].index;
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const a = nodes[i];
        const b = nodes[j];
        lines.push(a.x, a.y, a.z, b.x, b.y, b.z);

        const front = THREE.MathUtils.clamp(((a.z + b.z) * 0.5 + 0.38) / 0.76, 0, 1);
        const color = cobalt.clone().lerp(cyan, 0.20 + front * 0.72);
        if ((i + j) % 17 === 0) color.lerp(violet, 0.58);
        color.multiplyScalar(1.58);
        lineColors.push(color.r, color.g, color.b, color.r, color.g, color.b);

        if (front > 0.48 && signalPaths.length < 300) signalPaths.push([a, b]);
      }
    }

    // A few faint long axon paths add the layered neural-web look from the reference.
    const longLines: number[] = [];
    let longAttempts = 0;
    while (longLines.length < 78 * 6 && longAttempts < 4000) {
      longAttempts++;
      const a = nodes[Math.floor(random() * nodes.length)];
      const b = nodes[Math.floor(random() * nodes.length)];
      const distance = a.distanceTo(b);
      if (distance < 0.38 || distance > 0.92 || a.z < -0.12 || b.z < -0.12) continue;
      longLines.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }

    return {
      points: toFloat32(nodes),
      seeds: new Float32Array(seeds),
      strengths: new Float32Array(strengths),
      lines: new Float32Array(lines),
      lineColors: new Float32Array(lineColors),
      longLines: new Float32Array(longLines),
      contourLines: new Float32Array(contourLines),
      signalPaths,
    };
  }, [connections]);

  const signalPositions = useMemo(() => new Float32Array(52 * 3), []);
  const redSignalPositions = useMemo(() => new Float32Array(24 * 3), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (material.current) {
      material.current.uniforms.uTime.value = time;
      material.current.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    }

    if (surface.signalPaths.length === 0) return;

    if (signals.current) {
      const position = signals.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < position.count; i++) {
        const path = surface.signalPaths[(i * 41) % surface.signalPaths.length];
        const phase = (time * (0.22 + (i % 9) * 0.025) + i * 0.173) % 1;
        const eased = phase * phase * (3 - 2 * phase);
        position.setXYZ(
          i,
          THREE.MathUtils.lerp(path[0].x, path[1].x, eased),
          THREE.MathUtils.lerp(path[0].y, path[1].y, eased),
          THREE.MathUtils.lerp(path[0].z, path[1].z, eased),
        );
      }
      position.needsUpdate = true;
    }

    if (redSignals.current) {
      const position = redSignals.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < position.count; i++) {
        const path = surface.signalPaths[(i * 67 + 19) % surface.signalPaths.length];
        const phase = (time * (0.31 + (i % 6) * 0.032) + i * 0.227) % 1;
        const eased = phase * phase * (3 - 2 * phase);
        position.setXYZ(
          i,
          THREE.MathUtils.lerp(path[0].x, path[1].x, eased),
          THREE.MathUtils.lerp(path[0].y, path[1].y, eased),
          THREE.MathUtils.lerp(path[0].z, path[1].z, eased),
        );
      }
      position.needsUpdate = true;
    }
  });

  return (
    <group scale={[0.9, 0.84, 0.92]} position={[0, 0.08, 0]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[surface.lines, 3]} />
          <bufferAttribute attach="attributes-color" args={[surface.lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors toneMapped={false} transparent opacity={0.50} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[surface.longLines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#416dff" toneMapped={false} transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[surface.contourLines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#32cfff" toneMapped={false} transparent opacity={0.46} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[surface.points, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[surface.seeds, 1]} />
          <bufferAttribute attach="attributes-aStrength" args={[surface.strengths, 1]} />
        </bufferGeometry>
        <neuralPointMaterial ref={material} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <points ref={signals}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[signalPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#d9ffff" toneMapped={false} size={0.028} transparent opacity={0.94} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <points ref={redSignals}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[redSignalPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#e00032" toneMapped={false} size={0.043} transparent opacity={0.96} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}
