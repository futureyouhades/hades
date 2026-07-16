import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";

export const CoreShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorA: new THREE.Color("#00d9ff"),
    uColorB: new THREE.Color("#b5ffff"),
  },

  `
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main(){

      vUv = uv;
      vNormal = normal;

      vec3 pos = position;

      float wave =
          sin(position.y*8.0+uTime*2.5)*0.05;

      wave +=
          sin(position.x*12.0+uTime*1.5)*0.03;

      pos += normal*wave;

      gl_Position =
          projectionMatrix*
          modelViewMatrix*
          vec4(pos,1.0);

  }
  `,

  `
  uniform float uTime;

  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main(){

      float wave =
          sin(vUv.y*24.0+uTime*2.0)*0.5+0.5;

      float pulse =
          sin(uTime*2.5)*0.5+0.5;

      vec3 color =
          mix(
              uColorA,
              uColorB,
              wave
          );

      color += pulse*0.20;

      float fresnel =
          pow(
              1.0-
              dot(
                  normalize(vNormal),
                  vec3(0.0,0.0,1.0)
              ),
              3.0
          );

      color += fresnel*0.7;

      gl_FragColor =
          vec4(
              color,
              1.0
          );

  }
  `
);

extend({
  CoreShaderMaterial,
});
