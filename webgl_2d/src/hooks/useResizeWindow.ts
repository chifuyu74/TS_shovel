import { useCallback, useState, useEffect } from "react";
import type { IWindowSize } from "@type/IWindowSize";

export default function useResizeWindow() {
  const [size, setSize] = useState<IWindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const onResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    setSize({ ...size, width, height });
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (!canvas) {
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, [size]);

  useEffect(() => {
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [onResize]);

  return [size, onResize];
}
