import React, { useEffect } from "react";
import { GL } from "@gl/GL";
import globalGL from "@gl/globalGL";
import type { IRotation } from "@type/IRotation";
import type { ITranslation } from "@type/ITranslation";
import type { IScale } from "@type/IScale";
import type { GLInitParameter } from "@gl/tempParam";

function glTest(): GLInitParameter {
  const vertexSource = `
  attribute vec2 a_position;
  uniform mat3 u_matrix;

  void main() {
    gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
  }
  `;

  const fragmentSource = `
  precision mediump float;
  uniform vec4 u_color;

  void main() {
   gl_FragColor = u_color;
  }
  `;

  const bindingBuffer = [0, 0, 0, 0.5, 0.7, 0];

  return {
    vertexSource,
    fragmentSource,
    programAttributeLocation: "a_position",
    bindingBuffer,
  };
}

export default function useGL(
  translation: ITranslation,
  rotation: IRotation,
  scale: IScale
): [GL, React.Dispatch<React.SetStateAction<GL>>] {
  const [staticGL, setStaticGL] = React.useState(globalGL);

  useEffect(() => {
    staticGL.init(glTest());
    staticGL.updateRectangle(translation, rotation, scale);
  }, [staticGL, translation, rotation, scale]);

  return [staticGL, setStaticGL];
}
