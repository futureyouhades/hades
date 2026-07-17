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
    group.current.rotation.y += delta * .012;
    group.current.rotation.x = Math.sin(t * .48) * .014;
    group.current.rotation.z = Math.sin(t * .37) * .006;
    group.current.position.y = Math.sin(t * .74) * .01;
  });
  return <Float speed={.9} floatIntensity={.025} rotationIntensity={.004}><group ref={group}><BrainGlow /><BrainNetwork connections={3900} /><BrainParticles count={2800} radius={1.82} /></group></Float>;
}

function Scene() {
  return <>
    <ambientLight intensity={.08} />
    <pointLight position={[0, 1.6, 2.8]} intensity={3.5} color="#aaf8ff" />
    <pointLight position={[2.4, .2, 1.4]} intensity={2.8} color="#167cff" />
    <pointLight position={[-2.5, -.5, .8]} intensity={1.7} color="#7650ff" />
    <LivingBrain />
    <BrainRings />
    <StatusHalo />
    <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={.008} />
  </>;
}

export default function BrainCore() {
  return <Canvas gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }} camera={{ position: [0, 0, 5.15], fov: 38 }} dpr={[1, 2]}><Scene /><EffectComposer><Bloom intensity={.3} mipmapBlur luminanceThreshold={.72} luminanceSmoothing={.16} /></EffectComposer></Canvas>;
}
