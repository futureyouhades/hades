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
  return <group position={[side * .49, .04, 0]} rotation={[.02, side * .08, side * .045]} scale={[.7, 1.01, .79]}>
    <mesh><icosahedronGeometry args={[1, 7]} /><meshPhysicalMaterial color={side < 0 ? "#16bedb" : "#27cce7"} emissive={side < 0 ? "#075d95" : "#087e9d"} emissiveIntensity={1.05} transmission={.58} thickness={.28} roughness={.34} metalness={.12} transparent opacity={.38} depthWrite={false} /></mesh>
    <mesh scale={1.025}><icosahedronGeometry args={[1, 6]} /><meshBasicMaterial color="#9bf7ff" wireframe transparent opacity={.23} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    <mesh scale={.86}><icosahedronGeometry args={[1, 4]} /><meshBasicMaterial color={side < 0 ? "#426dff" : "#5f7dff"} wireframe transparent opacity={.13} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
  </group>;
}

function HolographicBrain() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const breath = 1 + Math.sin(t * 1.12) * .014 + Math.sin(t * .37) * .006;
    group.current.rotation.y += delta * .045;
    group.current.rotation.x = Math.sin(t * .23) * .025;
    group.current.scale.setScalar(breath);
  });
  return <Float speed={.7} floatIntensity={.09} rotationIntensity={.025}><group ref={group}><BrainLobe side={-1} /><BrainLobe side={1} /><mesh scale={[.045,.94,.13]}><sphereGeometry args={[1,16,24]} /><meshBasicMaterial color="#dffeff" transparent opacity={.14} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh></group></Float>;
}

function Scene() {
  return <><ambientLight intensity={.18} /><pointLight position={[0, 1.2, 2.4]} intensity={8} color="#69eeff" /><pointLight position={[2.4, .4, 1]} intensity={4} color="#476dff" /><pointLight position={[-2.2, -.8, 1]} intensity={3} color="#8d71ff" /><HolographicBrain /><BrainGlow /><BrainNetwork radius={1.92} connections={1250} /><BrainRings /><StatusHalo /><BrainParticles count={7200} radius={1.92} /><OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={.045} /></>;
}

export default function BrainCore() {
  return <Canvas gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }} camera={{ position: [0, 0, 5.55], fov: 39 }} dpr={[1, 2]}><Scene /><EffectComposer><Bloom intensity={.56} mipmapBlur luminanceThreshold={.48} luminanceSmoothing={.36} /></EffectComposer></Canvas>;
}
