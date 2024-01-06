import React, { useEffect } from "react";
import { GL } from "@gl/GL";
import globalGL from "@gl/globalGL";
import type { GLInitParameter } from "@gl/tempParam";
// import type { IScale2D, IScale3D } from "@type/IScale";
// import type { IAngle3D, IRotation } from "@type/IRotation";
// import type { ITranslation2D, ITranslation3D } from "@type/ITranslation";
// import type { IFieldOfView } from "@/types/IFieldOfView";
import { ICameraAngle } from "@type/ICameraAngle";
import { ILightRotation2D } from "@type/ILightRotation";
import { ILimit } from "@type/ILimit";

function glTest(): GLInitParameter {
  const vertexSource = `
  attribute vec4 a_position;
  attribute vec3 a_normal;

  uniform vec3 u_lightWorldPosition;
  uniform vec3 u_viewWorldPosition;

  uniform mat4 u_world;
  uniform mat4 u_worldViewProjection;
  uniform mat4 u_worldInverseTranspose;

  varying vec3 v_normal;

  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;

  void main() {
    gl_Position = u_worldViewProjection * a_position;

    v_normal = mat3(u_worldInverseTranspose) * a_normal;

    vec3 surfaceWorldPosition = (u_world * a_position).xyz;

    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
    v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
  }
  `;

  const fragmentSource = `
  precision mediump float;

  varying vec3 v_normal;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;
  
  uniform vec4 u_color;
  uniform float u_shininess;
  uniform vec3 u_lightDirection;
  uniform float u_innerLimit;
  uniform float u_outerLimit;
  
  void main() {
    vec3 normal = normalize(v_normal);
  
    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
  
    float dotFromDirection = dot(surfaceToLightDirection, -u_lightDirection);
    float inLight = smoothstep(u_outerLimit, u_innerLimit, dotFromDirection);
    float light = inLight * dot(normal, surfaceToLightDirection);
    float specular = inLight * pow(dot(normal, halfVector), u_shininess);
  
    gl_FragColor = u_color;
  
    gl_FragColor.rgb *= light;
    gl_FragColor.rgb += specular;
  }
  `;

  return { vertexSource, fragmentSource };
}

export function useGL3D(
  cameraAngle: ICameraAngle,
  lightAngle: ILightRotation2D,
  limit: ILimit
): [GL, React.Dispatch<React.SetStateAction<GL>>] {
  const [staticGL, setStaticGL] = React.useState(globalGL);

  useEffect(() => {
    staticGL.init(glTest());
    staticGL.update3D(cameraAngle, lightAngle, limit);
  }, [staticGL, cameraAngle, lightAngle, limit]);

  return [staticGL, setStaticGL];
}

// export function useGL2D(
//   translation: ITranslation2D,
//   rotation: IRotation,
//   scale: IScale2D
// ): [GL, React.Dispatch<React.SetStateAction<GL>>] {
//   const [staticGL, setStaticGL] = React.useState(globalGL);

//   useEffect(() => {
//     staticGL.init(glTest());
//     staticGL.update2D(translation, rotation, scale);
//   }, [staticGL, translation, rotation, scale]);

//   return [staticGL, setStaticGL];
// }
