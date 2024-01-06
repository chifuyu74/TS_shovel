export function selectRange(name: string): [number, number, number, number] {
  if (name.startsWith("cameraAngle")) {
    const min = -360;
    const max = 360;
    const step = 1;
    return [min, max, max, step];
  }

  if (name.startsWith("trans")) {
    const min = name.toLowerCase().endsWith("x") ? -1920 : -1080;
    const maxX = 1920;
    const maxY = 1080;
    const step = 1;
    return [min, maxX, maxY, step];
  }

  if (name.startsWith("rot")) {
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

  if (name.startsWith("fov")) {
    const min = 1;
    const max = 179;
    const step = 1;
    return [min, max, max, step];
  }

  if (name.toLowerCase().startsWith("light")) {
    const min = -2;
    const max = +2;
    const step = 0.01;
    return [min, max, max, step];
  }

  if (name.toLowerCase().endsWith("limit")) {
    const min = 0;
    const max = 180;
    const step = 1;
    return [min, max, max, step];
  }
  return [0, 0, 0, 0];
}
