/**
 * Matrix
 */

export type Matrix2x2 = [number, number, number, number];

export type Matrix3x3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

export type Matrix4x4 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

/**
 * GLCanvasSize
 */
export interface GLCanvasSize {
  width: number;
  height: number;
}
