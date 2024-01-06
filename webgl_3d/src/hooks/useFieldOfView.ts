import React, { useState } from "react";
import { IFieldOfView } from "@/types/IFieldOfView";

export function useFieldOfView(): [IFieldOfView, React.ChangeEventHandler<HTMLInputElement>] {
  const [fideldOfView, setFieldOfView] = useState<IFieldOfView>({ fov: 90 });

  const onChangeFudge = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldOfView({ ...fideldOfView, [e.target.name]: +e.target.value });
  };

  return [fideldOfView, onChangeFudge];
}
