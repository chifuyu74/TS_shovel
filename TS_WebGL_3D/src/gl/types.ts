/**
 * Orthographic
 */

export type IOrthographic = {
  left: number;
  right: number;
  bottom: number;
  top: number;
  near: number;
  far: number;
};

/**
 * Perspective
 */
export interface IPerspective {
  fov: number;
  aspect: number;
  near: number;
  far: number;
}

/**
 * Vector
 */

export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];

/**
 * Matrix
 */

export type Matrix2x2 = [number, number, number, number];

export type Matrix3x3 = [number, number, number, number, number, number, number, number, number];

export type Matrix4x4 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
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

/**
 *
 *
 */

export type BufferSizeOrData =
  | number
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array
  | DataView
  | ArrayBuffer
  | null;
