import { extend, useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface Props { radius?: number; connections?: number; }

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
     float depth = smoothstep(-1.25, 1.35, position.z);
     float flicker = .72 + .28 * sin(uTime * (1.2 + fract(aSeed * 17.0) * 2.4) + aSeed * 31.0);
     float eventPulse = pow(max(0.0, sin(uTime * .72 + aSeed * 47.0)), 18.0);
     float power = aStrength * flicker + eventPulse * .8;
     vec3 deep = vec3(.08, .28, .95);
     vec3 cyan = vec3(.08, .88, 1.0);
     vec3 violet = vec3(.46, .25, 1.0);
     vColor = mix(deep, cyan, depth);
     vColor = mix(vColor, violet, step(.91, fract(aSeed * 9.7)) * .38);
     vColor = mix(vColor, vec3(.9, 1.0, 1.0), smoothstep(.88, 1.35, power));
     vAlpha = (.2 + depth * .7) * (.48 + power * .58);
     gl_PointSize = (1.25 + power * 2.35) * uPixelRatio * (5.4 / -mv.z);
     gl_Position = projectionMatrix * mv;
   }`,
  `varying vec3 vColor;
   varying float vAlpha;
   void main() {
     vec2 p = gl_PointCoord - .5;
     float d = length(p);
     float core = 1.0 - smoothstep(.08, .5, d);
     float halo = (1.0 - smoothstep(.16, .5, d)) * .28;
     if (d > .5) discard;
     gl_FragColor = vec4(vColor, (core + halo) * vAlpha);
   }`
);
extend({ NeuralPointMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    neuralPointMaterial: ThreeElements["shaderMaterial"] & { uTime?: number; uPixelRatio?: number };
  }
}

type Surface = { points: Float32Array; seeds: Float32Array; strengths: Float32Array; lines: Float32Array; lineColors: Float32Array; paths: Array<[THREE.Vector3, THREE.Vector3]> };

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => ((value = Math.imul(1664525, value) + 1013904223 >>> 0) / 4294967296);
}

function brainPoint(side: -1 | 1, u: number, v: number, layer: number) {
  const theta = u * Math.PI * 2;
  const phi = v * Math.PI;
  const sx = Math.sin(phi) * Math.cos(theta);
  const sy = Math.cos(phi);
  const sz = Math.sin(phi) * Math.sin(theta);
  const folds =
    Math.sin(theta * 7.0 + phi * 2.5) * .045 +
    Math.sin(phi * 11.0 - theta * 2.0) * .032 +
    Math.sin((theta + phi) * 15.0) * .014;
  const crown = 1 + folds * layer;
  const lowerTaper = THREE.MathUtils.smoothstep(sy, -1, -.25);
  const x = side * .43 + sx * .66 * crown * layer;
  const y = .08 + sy * .93 * crown * layer + Math.max(0, sx) * .04 - lowerTaper * .12;
  const z = sz * .75 * crown * layer;
  return new THREE.Vector3(x, y, z);
}

export default function BrainNetwork({ connections = 1800 }: Props) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const signals = useRef<THREE.Points>(null);
  const surface = useMemo<Surface>(() => {
    const random = seeded(81573);
    const points: number[] = [], seeds: number[] = [], strengths: number[] = [];
    const lines: number[] = [], lineColors: number[] = [], paths: Array<[THREE.Vector3, THREE.Vector3]> = [];
    const rows = 44, columns = 76;
    const grids = new Map<string, THREE.Vector3>();

    for (const side of [-1, 1] as const) {
      for (let layerIndex = 0; layerIndex < 3; layerIndex++) {
        const layer = [1, .84, .67][layerIndex];
        for (let row = 1; row < rows; row++) {
          const v = row / rows;
          for (let column = 0; column < columns; column++) {
            const u = column / columns;
            const jitterU = (random() - .5) * .009;
            const jitterV = (random() - .5) * .009;
            const p = brainPoint(side, u + jitterU, v + jitterV, layer);
            grids.set(side + ":" + layerIndex + ":" + row + ":" + column, p);
            points.push(p.x, p.y, p.z);
            seeds.push(random());
            const foldHighlight = .35 + Math.abs(Math.sin(u * Math.PI * 14 + v * Math.PI * 5)) * .45;
            strengths.push(foldHighlight + (random() > .965 ? .72 : random() * .18));
          }
        }
      }

      for (let i = 0; i < connections / 2; i++) {
        const layerIndex = random() < .68 ? 0 : random() < .72 ? 1 : 2;
        const row = 2 + Math.floor(random() * (rows - 4));
        const column = Math.floor(random() * columns);
        const diagonal = random() > .5;
        const nextRow = Math.min(rows - 1, row + (diagonal ? 1 : random() > .5 ? 1 : 0));
        const nextColumn = (column + (diagonal ? (random() > .5 ? 1 : -1) : 1 + Math.floor(random() * 2)) + columns) % columns;
        const a = grids.get(side + ":" + layerIndex + ":" + row + ":" + column);
        const b = grids.get(side + ":" + layerIndex + ":" + nextRow + ":" + nextColumn);
        if (!a || !b) continue;
        lines.push(a.x, a.y, a.z, b.x, b.y, b.z);
        const front = THREE.MathUtils.clamp((a.z + .75) / 1.5, 0, 1);
        const color = new THREE.Color().lerpColors(new THREE.Color("#173eac"), new THREE.Color("#50efff"), front);
        lineColors.push(color.r, color.g, color.b, color.r, color.g, color.b);
        paths.push([a, b]);
      }
    }

    for (let i = 0; i < 70; i++) {
      const y = -.7 + random() * 1.5;
      const z = -.42 + random() * .84;
      const a = new THREE.Vector3(-.12 - random() * .24, y, z);
      const b = new THREE.Vector3(.12 + random() * .24, y + (random() - .5) * .08, z + (random() - .5) * .08);
      lines.push(a.x, a.y, a.z, b.x, b.y, b.z);
      lineColors.push(.1,.45,.8,.2,.8,1);
      paths.push([a,b]);
    }
    return { points: new Float32Array(points), seeds: new Float32Array(seeds), strengths: new Float32Array(strengths), lines: new Float32Array(lines), lineColors: new Float32Array(lineColors), paths };
  }, [connections]);

  const signalPositions = useMemo(() => new Float32Array(110 * 3), []);

  useFrame((state) => {
    if (material.current) {
      material.current.uniforms.uTime.value = state.clock.elapsedTime;
      material.current.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    }
    if (signals.current && surface.paths.length) {
      const attr = signals.current.geometry.attributes.position as THREE.BufferAttribute;
      const t = state.clock.elapsedTime;
      for (let i = 0; i < attr.count; i++) {
        const path = surface.paths[(i * 53) % surface.paths.length];
        const phase = (t * (.09 + (i % 9) * .009) + i * .173) % 1;
        const ease = phase * phase * (3 - 2 * phase);
        attr.setXYZ(i,
          THREE.MathUtils.lerp(path[0].x, path[1].x, ease),
          THREE.MathUtils.lerp(path[0].y, path[1].y, ease),
          THREE.MathUtils.lerp(path[0].z, path[1].z, ease));
      }
      attr.needsUpdate = true;
    }
  });

  return <group>
    <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[surface.lines, 3]} /><bufferAttribute attach="attributes-color" args={[surface.lineColors, 3]} /></bufferGeometry><lineBasicMaterial vertexColors transparent opacity={.17} depthWrite={false} blending={THREE.AdditiveBlending} /></lineSegments>
    <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[surface.points, 3]} /><bufferAttribute attach="attributes-aSeed" args={[surface.seeds, 1]} /><bufferAttribute attach="attributes-aStrength" args={[surface.strengths, 1]} /></bufferGeometry><neuralPointMaterial ref={material} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></points>
    <points ref={signals}><bufferGeometry><bufferAttribute attach="attributes-position" args={[signalPositions, 3]} /></bufferGeometry><pointsMaterial color="#f2ffff" size={.038} transparent opacity={.92} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} /></points>
  </group>;
}
