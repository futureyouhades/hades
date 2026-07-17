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

function LivingBrain() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y += delta * .028;
    group.current.rotation.x = Math.sin(t * .19) * .018;
    group.current.position.y = Math.sin(t * .31) * .012;
  });
  return <Float speed={.42} floatIntensity={.035} rotationIntensity={.008}><group ref={group}><BrainGlow /><BrainNetwork connections={3100} /><BrainParticles count={5200} radius={1.82} /></group></Float>;
}

function Scene() {
  return <>
    <ambientLight intensity={.08} />
    <pointLight position={[0, 1.6, 2.8]} intensity={5.5} color="#d8ffff" />
    <pointLight position={[2.4, .2, 1.4]} intensity={2.8} color="#167cff" />
    <pointLight position={[-2.5, -.5, .8]} intensity={2.2} color="#7650ff" />
    <LivingBrain />
    <BrainRings />
    <StatusHalo />
    <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={.018} />
  </>;
}

export default function BrainCore() {
  return <Canvas gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }} camera={{ position: [0, 0, 5.15], fov: 38 }} dpr={[1, 2]}><Scene /><EffectComposer><Bloom intensity={.48} mipmapBlur luminanceThreshold={.56} luminanceSmoothing={.24} /></EffectComposer></Canvas>;
}
