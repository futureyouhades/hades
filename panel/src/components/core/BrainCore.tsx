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
  return <group position={[side * .5, .03, 0]} rotation={[.03, side * .1, side * .055]} scale={[.72, 1.02, .8]}><mesh><icosahedronGeometry args={[1, 7]} /><meshPhysicalMaterial color="#26cce9" emissive="#078eb7" emissiveIntensity={1.65} transmission={.48} thickness={.35} roughness={.3} metalness={.2} transparent opacity={.72} /></mesh><mesh scale={1.025}><icosahedronGeometry args={[1, 5]} /><meshBasicMaterial color="#a8f9ff" wireframe transparent opacity={.42} /></mesh><mesh scale={.88}><icosahedronGeometry args={[1, 3]} /><meshBasicMaterial color="#1edaf4" wireframe transparent opacity={.2} /></mesh></group>;
}
function HolographicBrain() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => { if (!group.current) return; const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.8) * .025; group.current.rotation.y += delta * .11; group.current.rotation.x = Math.sin(state.clock.elapsedTime * .28) * .06; group.current.scale.setScalar(pulse); });
  return <Float speed={1.1} floatIntensity={.2} rotationIntensity={.06}><group ref={group}><BrainLobe side={-1} /><BrainLobe side={1} /><mesh scale={[.09,.98,.2]}><sphereGeometry args={[1,20,20]} /><meshBasicMaterial color="#c6fbff" transparent opacity={.34} /></mesh></group></Float>;
}
function Scene() {
  return <><ambientLight intensity={.34} /><pointLight position={[0, 0, 2]} intensity={15} color="#2ee6ff" /><pointLight position={[2.5, 2.5, 2]} intensity={6} color="#5d86ff" /><pointLight position={[-2.5, -2, 1]} intensity={5} color="#8ff8ff" /><HolographicBrain /><BrainGlow /><BrainNetwork radius={1.92} connections={560} /><BrainRings /><StatusHalo /><BrainParticles count={2400} radius={1.46} /><OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={.1} /></>;
}
export default function BrainCore() {
  return <Canvas gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 5.65], fov: 40 }} dpr={[1, 2]}><Scene /><EffectComposer><Bloom intensity={.8} mipmapBlur luminanceThreshold={.32} luminanceSmoothing={.55} /></EffectComposer></Canvas>;
}
