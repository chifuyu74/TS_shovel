import { useState } from "react";
import type { IRotation } from "@type/IRotation";

export default function useRotation(): [
  IRotation,
  React.ChangeEventHandler<HTMLInputElement>
] {
  const [rotation, setRotation] = useState<IRotation>({ angle: 0 });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRotation({ ...rotation, [e.target.id]: +e.target.value });
  };

  return [rotation, onChange];
}
