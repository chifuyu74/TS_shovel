export function selectRange(name: string): [number, number, number, number] {
  if (name.startsWith("trans")) {
    const min = 0;
    const maxX = 1920;
    const maxY = 1080;
    const step = 1;
    return [min, maxX, maxY, step];
  }

  if (name.startsWith("angle")) {
    const min = 0;
    const max = 360;
    const step = 1;
    return [min, max, max, step];
  }

  if (name.startsWith("scale")) {
    const min = -10;
    const max = 10;
    const step = 0.01;
    return [min, max, max, step];
  }

  return [0, 0, 0, 0];
}
