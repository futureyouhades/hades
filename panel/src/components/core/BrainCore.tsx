import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  OrbitControls,
  Environment
} from "@react-three/drei";
import {
  Bloom,
  EffectComposer
} from "@react-three/postprocessing";
import { useRef } from "react";
import * as THREE from "three";

import BrainParticles from "./BrainParticles";
import BrainGlow from "./BrainGlow";
import BrainNetwork from "./BrainNetwork";
import BrainRings from "./BrainRings";
function CoreSphere() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;

    mesh.current.rotation.y += 0.002;
    mesh.current.rotation.x += 0.001;

    const pulse =
      1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.05;

    mesh.current.scale.set(
      pulse,
      pulse,
      pulse
    );
  });

  return (
    <Float
      speed={2}
      floatIntensity={1.5}
      rotationIntensity={2}
    >
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 8]} />

        <meshPhysicalMaterial
          color="#5be9ff"
          emissive="#11d7ff"
          emissiveIntensity={4}
          transmission={0.2}
          thickness={1}
          roughness={0.15}
          metalness={0.35}
          clearcoat={1}
        />
      </mesh>
    </Float>
  );
}


function Scene() {
  return (
    <>
      <color attach="background" args={["#02040a"]} />

      <ambientLight intensity={0.4} />

      <pointLight
        position={[0, 0, 0]}
        intensity={25}
        color="#44dfff"
      />

      <pointLight
        position={[4, 3, 2]}
        intensity={8}
        color="#3f8cff"
      />

      <pointLight
        position={[-4, -3, -2]}
        intensity={4}
        color="#ffffff"
      />

      <Environment preset="night" />

      <CoreSphere />
      <BrainGlow />
      <BrainNetwork />
      <BrainRings />

      <BrainParticles />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.35}
      />
    </>
  );
}
export default function BrainCore() {
  return (
    <Canvas
      camera={{
        position: [0, 0, 6],
        fov: 45
      }}
      dpr={[1, 2]}
    >
      <Scene />

      <EffectComposer>
        <Bloom
          intensity={2}
          mipmapBlur
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </Canvas>
  );
}
