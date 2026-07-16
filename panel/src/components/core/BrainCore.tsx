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

function CoreSphere() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => { if (!group.current) return; const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2) * .045; group.current.rotation.y += delta * .28; group.current.rotation.x += delta * .09; group.current.scale.setScalar(pulse); });
  return <Float speed={1.6} floatIntensity={.55} rotationIntensity={.2}><group ref={group}><mesh><icosahedronGeometry args={[1, 7]} /><meshPhysicalMaterial color="#65eeff" emissive="#10cbff" emissiveIntensity={5} transmission={.32} thickness={.7} roughness={.08} metalness={.5} clearcoat={1} /></mesh><mesh scale={1.045}><icosahedronGeometry args={[1, 5]} /><meshBasicMaterial color="#b4fbff" wireframe transparent opacity={.32} /></mesh></group></Float>;
}

function Scene() {
  return <><ambientLight intensity={.25} /><pointLight position={[0, 0, 1]} intensity={35} color="#3fe8ff" /><pointLight position={[3, 2, 2]} intensity={11} color="#4f8cff" /><pointLight position={[-3, -2, 1]} intensity={7} color="#7eefff" /><CoreSphere /><BrainGlow /><BrainNetwork connections={260} /><BrainRings /><StatusHalo /><BrainParticles count={4200} /><OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={.22} /></>;
}

export default function BrainCore() {
  return <Canvas gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 2]}><Scene /><EffectComposer><Bloom intensity={2.7} mipmapBlur luminanceThreshold={.08} luminanceSmoothing={.9} /></EffectComposer></Canvas>;
}
