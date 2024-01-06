import { useState } from "react";
import type { IScale2D, IScale3D } from "@type/IScale";

export function useScale2D(): [IScale2D, React.ChangeEventHandler<HTMLInputElement>] {
  const [scale, setScale] = useState<IScale2D>({ scaleX: 1, scaleY: 1 });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale({ ...scale, [e.target.name]: +e.target.value });
  };

  return [scale, onChange];
}

export function useScale3D(): [IScale3D, React.ChangeEventHandler<HTMLInputElement>] {
  const [scale, setScale] = useState<IScale3D>({ scaleX: 1, scaleY: 1, scaleZ: 1 });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale({ ...scale, [e.target.name]: +e.target.value });
  };

  return [scale, onChange];
}
