import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
interface RingData { radius:number; tube:number; speed:number; rotation:[number,number,number]; color:string; opacity:number; }
function Ring(props: RingData) {
  const ref=useRef<THREE.Mesh>(null);
  useFrame((_,delta)=>{if(ref.current) ref.current.rotation.z+=props.speed*delta;});
  return <mesh ref={ref} rotation={props.rotation}><torusGeometry args={[props.radius,props.tube,12,160]} /><meshBasicMaterial color={props.color} transparent opacity={props.opacity} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>;
}
export default function BrainRings(){
  const rings=useMemo<RingData[]>(()=>[
    {radius:1.78,tube:.0016,speed:.032,rotation:[.28,.08,0],color:"#3cdbff",opacity:.055},
    {radius:2.12,tube:.0014,speed:-.024,rotation:[1.04,.32,.5],color:"#5472ff",opacity:.035}
  ],[]);
  return <>{rings.map((ring,i)=><Ring key={i} {...ring}/>)}</>;
}
