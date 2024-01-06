import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import React, { useRef } from "react";
import { TextureLoader } from "three";
import monalisa from "./images/monalisa.png";
import other from "./images/other.png"; // need replace other image

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  
  gl_Position = vec4(position,1.0) * modelViewMatrix * projectionMatrix;
}
`;

const fragmentShader = `
varying vec2 vUv;

uniform float time;
uniform sampler2D channel0;
uniform sampler2D channel1;

void main() {
  vec2 st = vUv;
  st.x += sin(st.y * 15.0 + time * 0.5) * 0.3;
  gl_FragColor = texture2D(channel0, st);
}
`;

function Images() {
  const materialRef = useRef(null);
  const [monalisaTexture, reoTexture] = useLoader(TextureLoader, [
    monalisa,
    other,
  ]);

  useFrame((state) => {
    if (!materialRef.current) {
      return;
    }

    materialRef.current.uniforms.time.value = state.clock.elapsedTime;
  });

  return (
    <mesh scale={[500, 500, 1]}>
      <planeBufferGeometry />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          time: { value: 0 },
          channel0: { value: monalisaTexture },
          channel1: { value: reoTexture },
        }}
      />
    </mesh>
  );
}

function Three() {
  return (
    <>
      <Canvas orthographic>
        <Images />
      </Canvas>
    </>
  );
}

export default Three;
