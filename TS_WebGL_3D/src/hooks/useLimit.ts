import { useState } from "react";
import { ILimit } from "@type/ILimit";

export function useLimit(): [ILimit, React.ChangeEventHandler<HTMLInputElement>] {
  const [limit, setLimit] = useState<ILimit>({ innerLimit: 20, outerLimit: 40 });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLimit({ ...limit, [e.target.name]: +e.target.value });
  };

  return [limit, onChange];
}
