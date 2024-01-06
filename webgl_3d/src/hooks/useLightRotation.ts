import { useState } from "react";
import { ILightRotation2D } from "@type/ILightRotation";

export function useLightRotation2D(): [
  ILightRotation2D,
  React.ChangeEventHandler<HTMLInputElement>
] {
  const [rot2D, setRot2D] = useState<ILightRotation2D>({ x: 0, y: 0 });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name.at(-1)!.toLowerCase();
    setRot2D({ ...rot2D, [name]: +e.target.value });
  };

  return [rot2D, onChange];
}
