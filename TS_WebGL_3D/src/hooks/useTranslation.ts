import { useState } from "react";
import type { ITranslation2D, ITranslation3D } from "@type/ITranslation";

export function useTranslation2D(): [ITranslation2D, React.ChangeEventHandler<HTMLInputElement>] {
  const [translation, setTranslation] = useState<ITranslation2D>({
    transX: Math.floor(1920 / 2),
    transY: Math.floor(1080 / 3),
    // transX: 0,
    // transY: 0,
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTranslation({ ...translation, [e.target.name]: +e.target.value });
  };

  return [translation, onChange];
}

export function useTranslation3D(): [ITranslation3D, React.ChangeEventHandler<HTMLInputElement>] {
  const [translation, setTranslation] = useState<ITranslation3D>({
    transX: Math.floor(0),
    transY: Math.floor(0),
    transZ: Math.floor(0),
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTranslation({ ...translation, [e.target.name]: +e.target.value });
  };

  return [translation, onChange];
}
