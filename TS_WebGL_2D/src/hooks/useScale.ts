import { useState } from "react";
import type { IScale } from "@type/IScale";

export default function useScale(): [
  IScale,
  React.ChangeEventHandler<HTMLInputElement>
] {
  const [scale, setScale] = useState<IScale>({ scaleX: 1, scaleY: 1 });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale({ ...scale, [e.target.id]: +e.target.value });
  };

  return [scale, onChange];
}
