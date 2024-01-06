import { useState } from "react";
import type { IAngle3D, IRotation } from "@type/IRotation";

export function useRotation2D(): [IRotation, React.ChangeEventHandler<HTMLInputElement>] {
  const [rotation, setRotation] = useState<IRotation>({ angle: 0 });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRotation({ ...rotation, [e.target.name]: +e.target.value });
  };

  return [rotation, onChange];
}

export function useRotation3D(): [IAngle3D, React.ChangeEventHandler<HTMLInputElement>] {
  const [rotation, setRotation] = useState<IAngle3D>({ rotX: 0, rotY: 0, rotZ: 0 });
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRotation({ ...rotation, [e.target.name]: +e.target.value });
  };

  return [rotation, onChange];
}
