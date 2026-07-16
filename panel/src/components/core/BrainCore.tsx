import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useRef } from "react";
import * as THREE from "three";
import BrainGlow from "./BrainGlow";
import BrainNetwork from "./BrainNetwork";
import BrainParticles from "./BrainParticles";
import BrainRings from "./BrainRings";
import StatusHalo from "./StatusHalo";

function BrainLobe({ side }: { side: -1 | 1 }) {
  return <group position={[side * .53, .03, 0]} rotation={[.04, side * .12, side * .08]} scale={[.73, 1.04, .82]}><mesh><icosahedronGeometry args={[1, 6]} /><meshPhysicalMaterial color="#59eaff" emissive="#0bbce8" emissiveIntensity={3.4} transmission={.22} thickness={.55} roughness={.18} metalness={.45} /></mesh><mesh scale={1.065}><icosahedronGeometry args={[1, 4]} /><meshBasicMaterial color="#c2fbff" wireframe transparent opacity={.3} /></mesh></group>;
}

function HolographicBrain() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => { if (!group.current) return; const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.8) * .035; group.current.rotation.y += delta * .16; group.current.rotation.x = Math.sin(state.clock.elapsedTime * .28) * .08; group.current.scale.setScalar(pulse); });
  return <Float speed={1.35} floatIntensity={.42} rotationIntensity={.12}><group ref={group}><BrainLobe side={-1} /><BrainLobe side={1} /><mesh scale={[.16,1.04,.28]}><sphereGeometry args={[1,20,20]} /><meshBasicMaterial color="#d3ffff" transparent opacity={.55} /></mesh></group></Float>;
}

function Scene() {
  return <><ambientLight intensity={.22} /><pointLight position={[0, 0, 1]} intensity={26} color="#2ee6ff" /><pointLight position={[2.5, 2.5, 2]} intensity={9} color="#5d86ff" /><pointLight position={[-2.5, -2, 1]} intensity={7} color="#8ff8ff" /><HolographicBrain /><BrainGlow /><BrainNetwork radius={1.92} connections={360} /><BrainRings /><StatusHalo /><BrainParticles count={5200} radius={1.72} /><OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={.16} /></>;
}

export default function BrainCore() {
  return <Canvas gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 2]}><Scene /><EffectComposer><Bloom intensity={1.65} mipmapBlur luminanceThreshold={.17} luminanceSmoothing={.86} /></EffectComposer></Canvas>;
}
