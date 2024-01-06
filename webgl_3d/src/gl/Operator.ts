import type {
  IOrthographic,
  IPerspective,
  Matrix3x3,
  Matrix4x4,
  Vector3,
  Vector4,
} from "@gl/types";
import { GLError } from "@gl/GLError";
import type { ITranslation2D, ITranslation3D } from "@/types/ITranslation";
import type { IAngle3D, IRotation } from "@/types/IRotation";
import type { IScale2D, IScale3D } from "@/types/IScale";

export default class Operator {
  /*------------
      static
  ------------*/
  public static identity2DArray: Matrix3x3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  public static identity3DArray: Matrix4x4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

  /*----------
      Util
  ----------*/
  public degToRad(angle: number): number {
    return (angle * Math.PI) / 180;
  }

  public radToDeg(radian: number): number {
    return (radian * 180) / Math.PI;
  }

  /*--------------
      Vector3
  --------------*/
  private vectorMultiply(v: Matrix4x4, m: Matrix4x4) {
    let dst = [];
    for (let i = 0; i < 4; ++i) {
      dst[i] = 0.0;
      for (let j = 0; j < 4; ++j) {
        dst[i] += v[j] * m[j * 4 + i];
      }
    }
    return dst;
  }

  public crossVector3(a: Vector3, b: Vector3): Vector3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  public subtractVector3(a: Vector3, b: Vector3): Vector3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  public normalizeVector3(v: Vector3): Vector3 {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // 0으로 나뉘지 않도록 하기
    if (length > 0.00001) {
      return [v[0] / length, v[1] / length, v[2] / length];
    } else {
      return [0, 0, 0];
    }
  }

  /*--------
      2D
  --------*/
  public translation2D(translateX: number, translateY: number): Matrix3x3 {
    return [1, 0, 0, 0, 1, 0, translateX, translateY, 1];
  }

  public rotation2D(angle: number): Matrix3x3 {
    const sin = Number(Math.sin(angle).toFixed(2));
    const cos = Number(Math.cos(angle).toFixed(2));

    return [cos, -sin, 0, sin, cos, 0, 0, 0, 1];
  }

  public scale2D(scaleX: number, scaleY: number): Matrix3x3 {
    return [scaleX, 0, 0, 0, scaleY, 0, 0, 0, 1];
  }

  public multiply2D(...matrix: Matrix3x3[]): Matrix3x3 {
    if (matrix.length === 0) {
      throw new Error(GLError.NoMatrix);
    }
    const first = matrix[0];
    const ret = matrix.slice(1).reduce((a: Matrix3x3, b: Matrix3x3): Matrix3x3 => {
      const a00 = a[0 * 3 + 0];
      const a01 = a[0 * 3 + 1];
      const a02 = a[0 * 3 + 2];
      const a10 = a[1 * 3 + 0];
      const a11 = a[1 * 3 + 1];
      const a12 = a[1 * 3 + 2];
      const a20 = a[2 * 3 + 0];
      const a21 = a[2 * 3 + 1];
      const a22 = a[2 * 3 + 2];
      const b00 = b[0 * 3 + 0];
      const b01 = b[0 * 3 + 1];
      const b02 = b[0 * 3 + 2];
      const b10 = b[1 * 3 + 0];
      const b11 = b[1 * 3 + 1];
      const b12 = b[1 * 3 + 2];
      const b20 = b[2 * 3 + 0];
      const b21 = b[2 * 3 + 1];
      const b22 = b[2 * 3 + 2];

      const c00 = b00 * a00 + b01 * a10 + b02 * a20;
      const c01 = b00 * a01 + b01 * a11 + b02 * a21;
      const c02 = b00 * a02 + b01 * a12 + b02 * a22;
      const c10 = b10 * a00 + b11 * a10 + b12 * a20;
      const c11 = b10 * a01 + b11 * a11 + b12 * a21;
      const c12 = b10 * a02 + b11 * a12 + b12 * a22;
      const c20 = b20 * a00 + b21 * a10 + b22 * a20;
      const c21 = b20 * a01 + b21 * a11 + b22 * a21;
      const c22 = b20 * a02 + b21 * a12 + b22 * a22;

      return [c00, c01, c02, c10, c11, c12, c20, c21, c22];
    }, first);

    return ret;
  }

  public makeClipSpace2D(
    translation: ITranslation2D,
    rotation: IRotation,
    scale: IScale2D,
    clientSize: { width: number; height: number }
  ): Matrix3x3 {
    const translationMatrix = this.translation2D(translation.transX, translation.transY);
    const rotationMatrix = this.rotation2D((rotation.angle * Math.PI) / 180);
    const scaleMatrix = this.scale2D(scale.scaleX, scale.scaleY);
    const projectionMatrix = this.projection2D(clientSize.width, clientSize.height);

    let matrix2D: Matrix3x3 = this.multiply2D(
      projectionMatrix,
      translationMatrix,
      rotationMatrix,
      scaleMatrix
    );

    return matrix2D;
  }

  public projection2D(width: number, height: number): Matrix3x3 {
    return [2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1];
  }

  /*--------
      3D
  --------*/
  public translation3D(translateX: number, translateY: number, translateZ: number): Matrix4x4 {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, translateX, translateY, translateZ, 1];
  }

  public xRotation3D(angle: number): Matrix4x4 {
    const radAngle = this.degToRad(angle);
    const sin = Math.sin(radAngle);
    const cos = Math.cos(radAngle);

    return [1, 0, 0, 0, 0, cos, sin, 0, 0, -sin, cos, 0, 0, 0, 0, 1];
  }

  public yRotation3D(angle: number, translated: boolean = true): Matrix4x4 {
    const radAngle = translated ? angle : this.degToRad(angle);
    const sin = Math.sin(radAngle);
    const cos = Math.cos(radAngle);

    return [cos, 0, -sin, 0, 0, 1, 0, 0, sin, 0, cos, 0, 0, 0, 0, 1];
  }

  public zRotation3D(angle: number): Matrix4x4 {
    const radAngle = this.degToRad(angle);
    const sin = Math.sin(radAngle);
    const cos = Math.cos(radAngle);

    return [cos, sin, 0, 0, -sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  public scale3D(scaleX: number, scaleY: number, scaleZ: number): Matrix4x4 {
    return [scaleX, 0, 0, 0, 0, scaleY, 0, 0, 0, 0, scaleZ, 0, 0, 0, 0, 1];
  }

  public multiply3D(...matrix: Matrix4x4[]): Matrix4x4 {
    if (matrix.length === 0) {
      throw new Error(GLError.NoMatrix);
    }
    const first = matrix[0];
    const ret = matrix.slice(1).reduce((a: Matrix4x4, b: Matrix4x4): Matrix4x4 => {
      const a00 = a[0 * 4 + 0];
      const a01 = a[0 * 4 + 1];
      const a02 = a[0 * 4 + 2];
      const a03 = a[0 * 4 + 3];
      const a10 = a[1 * 4 + 0];
      const a11 = a[1 * 4 + 1];
      const a12 = a[1 * 4 + 2];
      const a13 = a[1 * 4 + 3];
      const a20 = a[2 * 4 + 0];
      const a21 = a[2 * 4 + 1];
      const a22 = a[2 * 4 + 2];
      const a23 = a[2 * 4 + 3];
      const a30 = a[3 * 4 + 0];
      const a31 = a[3 * 4 + 1];
      const a32 = a[3 * 4 + 2];
      const a33 = a[3 * 4 + 3];
      const b00 = b[0 * 4 + 0];
      const b01 = b[0 * 4 + 1];
      const b02 = b[0 * 4 + 2];
      const b03 = b[0 * 4 + 3];
      const b10 = b[1 * 4 + 0];
      const b11 = b[1 * 4 + 1];
      const b12 = b[1 * 4 + 2];
      const b13 = b[1 * 4 + 3];
      const b20 = b[2 * 4 + 0];
      const b21 = b[2 * 4 + 1];
      const b22 = b[2 * 4 + 2];
      const b23 = b[2 * 4 + 3];
      const b30 = b[3 * 4 + 0];
      const b31 = b[3 * 4 + 1];
      const b32 = b[3 * 4 + 2];
      const b33 = b[3 * 4 + 3];

      const c00 = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
      const c01 = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
      const c02 = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
      const c03 = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;

      const c10 = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
      const c11 = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
      const c12 = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
      const c13 = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;

      const c20 = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
      const c21 = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
      const c22 = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
      const c23 = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;

      const c30 = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
      const c31 = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
      const c32 = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
      const c33 = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

      return [c00, c01, c02, c03, c10, c11, c12, c13, c20, c21, c22, c23, c30, c31, c32, c33];
    }, first);

    return ret;
  }

  private inverse(m: Matrix4x4): Matrix4x4 {
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp_0 = m22 * m33;
    const tmp_1 = m32 * m23;
    const tmp_2 = m12 * m33;
    const tmp_3 = m32 * m13;
    const tmp_4 = m12 * m23;
    const tmp_5 = m22 * m13;
    const tmp_6 = m02 * m33;
    const tmp_7 = m32 * m03;
    const tmp_8 = m02 * m23;
    const tmp_9 = m22 * m03;
    const tmp_10 = m02 * m13;
    const tmp_11 = m12 * m03;
    const tmp_12 = m20 * m31;
    const tmp_13 = m30 * m21;
    const tmp_14 = m10 * m31;
    const tmp_15 = m30 * m11;
    const tmp_16 = m10 * m21;
    const tmp_17 = m20 * m11;
    const tmp_18 = m00 * m31;
    const tmp_19 = m30 * m01;
    const tmp_20 = m00 * m21;
    const tmp_21 = m20 * m01;
    const tmp_22 = m00 * m11;
    const tmp_23 = m10 * m01;

    const t0 = tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31 - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    const t1 = tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31 - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    const t2 =
      tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31 - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    const t3 =
      tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21 - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    let d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    d = d === Infinity ? 0 : d;

    const i00 = d * t0;
    const i01 = d * t1;
    const i02 = d * t2;
    const i03 = d * t3;

    const i10 =
      d * (tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30 - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
    const i11 =
      d * (tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30 - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
    const i12 =
      d * (tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30 - (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
    const i13 =
      d * (tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20 - (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));

    const i20 =
      d *
      (tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33 - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
    const i21 =
      d *
      (tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33 - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
    const i22 =
      d *
      (tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33 - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
    const i23 =
      d *
      (tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23 - (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));

    const i30 =
      d *
      (tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12 - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
    const i31 =
      d *
      (tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22 - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
    const i32 =
      d *
      (tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02 - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
    const i33 =
      d *
      (tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12 - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

    return [i00, i01, i02, i03, i10, i11, i12, i13, i20, i21, i22, i23, i30, i31, i32, i33];
  }

  public projection3D(width: number, height: number, depth: number): Matrix4x4 {
    return [2 / width, 0, 0, 0, 0, -2 / height, 0, 0, 0, 0, 2 / depth, 0, -1, 1, 0, 1];
  }

  public orthographic3D(cornerLength: IOrthographic): Matrix4x4 {
    const { left, right, bottom, top, near, far } = cornerLength;
    const leftRight = (left + right) / (left - right);
    const bottomTop = (bottom + top) / (bottom - top);
    const nearFar = (near + far) / (near - far);
    return [
      2 / (right - left),
      0,
      0,
      0,
      0,
      2 / (top - bottom),
      0,
      0,
      0,
      0,
      2 / (near - far),
      0,
      leftRight,
      bottomTop,
      nearFar,
      1,
    ];
  }

  public perspective(argument: IPerspective): Matrix4x4 {
    const { fov, aspect, near, far } = argument;
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    const rangeInv = 1.0 / (near - far);

    return [
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (near + far) * rangeInv,
      -1,
      0,
      0,
      near * far * rangeInv * 2,
      0,
    ];
  }

  public camaraSpace3D(cameraAngle: number, radius: number = 200): Matrix4x4 {
    let cameraMatrix = this.yRotation3D(cameraAngle);
    cameraMatrix = this.translation3D(0, 0, radius * 1.5);
    return cameraMatrix;
  }

  public inverseMatrix(matrix: Matrix4x4): Matrix4x4 {
    return this.inverse(matrix);
  }

  public viewMatrix(cameraMatrix: Matrix4x4): Matrix4x4 {
    return this.inverseMatrix(cameraMatrix);
  }

  public viewProjectMatrix(projectionMatrix: Matrix4x4, viewMatrix: Matrix4x4): Matrix4x4 {
    return this.multiply3D(projectionMatrix, viewMatrix);
  }

  public makeClipSpace3D(
    translation: ITranslation3D,
    rotation: IAngle3D,
    scale: IScale3D,
    clientSize: { width: number; height: number },
    ratio: IPerspective
  ): Matrix4x4 {
    // field of view
    const perspectiveMatrix = this.perspective(ratio);

    // translation
    const { transX, transY, transZ } = translation;
    const translationMatrix = this.translation3D(transX, transY, transZ);

    // rotation
    const { rotX, rotY, rotZ } = rotation;
    const xRotationMatrix = this.xRotation3D(rotX);
    const yRotationMatrix = this.yRotation3D(rotY);
    const zRotationMatrix = this.zRotation3D(rotZ);

    // scale
    const { scaleX, scaleY, scaleZ } = scale;
    const scaleMatrix = this.scale3D(scaleX, scaleY, scaleZ);

    // projection
    // const { width, height } = clientSize;
    // const projectionMatrix = this.projection3D(width, height, 400);

    // multiply
    let matrix3D: Matrix4x4 = this.multiply3D(
      perspectiveMatrix,
      // projectionMatrix,
      translationMatrix,
      xRotationMatrix,
      yRotationMatrix,
      zRotationMatrix,
      scaleMatrix
    );

    return matrix3D;
  }

  public translate(m: Matrix4x4, transX: number, transY: number, transZ: number): Matrix4x4 {
    return this.multiply3D(m, this.translation3D(transX, transY, transZ));
  }

  public lookAt(cameraPosition: Vector3, target: Vector3, up: Vector3): Matrix4x4 {
    const zAxis = this.normalizeVector3(this.subtractVector3(cameraPosition, target));
    const xAxis = this.normalizeVector3(this.crossVector3(up, zAxis));
    const yAxis = this.normalizeVector3(this.crossVector3(zAxis, xAxis));

    return [
      xAxis[0],
      xAxis[1],
      xAxis[2],
      0,
      yAxis[0],
      yAxis[1],
      yAxis[2],
      0,
      zAxis[0],
      zAxis[1],
      zAxis[2],
      0,
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
      1,
    ];
  }

  public transformPoint(m: Matrix4x4, v: Vector4): Vector3 {
    let dst: Vector3 = [0, 0, 0];
    let v0 = v[0];
    let v1 = v[1];
    let v2 = v[2];
    let d = v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];

    dst[0] = (v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + m[3 * 4 + 0]) / d;
    dst[1] = (v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + m[3 * 4 + 1]) / d;
    dst[2] = (v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + m[3 * 4 + 2]) / d;

    return dst;
  }

  public transpose(m: Matrix4x4): Matrix4x4 {
    let dst: Matrix4x4 = Operator.identity3DArray;

    dst[0] = m[0];
    dst[1] = m[4];
    dst[2] = m[8];
    dst[3] = m[12];
    dst[4] = m[1];
    dst[5] = m[5];
    dst[6] = m[9];
    dst[7] = m[13];
    dst[8] = m[2];
    dst[9] = m[6];
    dst[10] = m[10];
    dst[11] = m[14];
    dst[12] = m[3];
    dst[13] = m[7];
    dst[14] = m[11];
    dst[15] = m[15];

    return dst;
  }
}
