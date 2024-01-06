import { useState } from "react";
import type { ITranslation } from "@type/ITranslation";

export default function useSlider(): [
  ITranslation,
  React.ChangeEventHandler<HTMLInputElement>
] {
  const [translation, setTranslation] = useState<ITranslation>({
    transX: Math.floor(1920 / 2),
    transY: Math.floor(1080 / 3),
    // transX: 0,
    // transY: 0,
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTranslation({ ...translation, [e.target.id]: +e.target.value });
  };

  return [translation, onChange];
}
