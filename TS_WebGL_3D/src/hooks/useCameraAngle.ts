import React, { useState, useCallback } from "react";
import { ICameraAngle } from "@type/ICameraAngle";

export function useCameraAngle(): [ICameraAngle, React.ChangeEventHandler<HTMLInputElement>] {
  const [angle, setAngle] = useState({ cameraAngle: 60 });

  const onAngle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAngle({ ...angle, cameraAngle: +e.target.value });
    },
    [angle]
  );

  return [angle, onAngle];
}
