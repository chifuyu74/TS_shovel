/* eslint-disable no-lone-blocks */
/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { canvas, gl } from "@live2d/Delegate";

export class Rect {
  public left: number = 0;
  public right: number = 0;
  public up: number = 0;
  public down: number = 0;
}

export class Sprite {
  _texture: WebGLTexture | null = null;
  _vertexBuffer: WebGLBuffer | null = null;
  _uvBuffer: WebGLBuffer | null = null;
  _indexBuffer: WebGLBuffer | null = null;
  _rect: Rect | null = new Rect();

  _positionLocation: number | null = null;
  _uvLocation: number | null = null;
  _textureLocation: WebGLUniformLocation | null = null;

  _positionArray: Float32Array | null = null;
  _uvArray: Float32Array | null = null;
  _indexArray: Uint16Array | null = null;

  _firstDraw: boolean = false;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    textureId: WebGLTexture
  ) {
    this._rect = new Rect();
    this._rect.left = x - width * 0.5;
    this._rect.right = x + width * 0.5;
    this._rect.up = y + height * 0.5;
    this._rect.down = y - height * 0.5;
    this._texture = textureId;
    this._firstDraw = true;
  }

  /**
   * 解放する。
   */
  public release(): void {
    this._rect = null;
    if (gl) {
      gl.deleteTexture(this._texture);
      this._texture = null;

      gl.deleteBuffer(this._uvBuffer);
      this._uvBuffer = null;

      gl.deleteBuffer(this._vertexBuffer);
      this._vertexBuffer = null;

      gl.deleteBuffer(this._indexBuffer);
      this._indexBuffer = null;
    }
  }

  public getTexture(): WebGLTexture {
    if (this._texture === null) {
      this._texture = new WebGLTexture();
    }
    return this._texture;
  }

  public render(programId: WebGLProgram): void {
    if (this._texture == null) {
      return;
    }

    if (gl === null || canvas === null || this._rect === null) {
      return;
    }

    if (this._firstDraw) {
      this._positionLocation = gl.getAttribLocation(programId, "position");
      gl.enableVertexAttribArray(this._positionLocation);
      if (this._positionLocation === null) {
        return;
      }

      this._uvLocation = gl.getAttribLocation(programId, "uv");
      if (this._uvLocation === null) {
        return;
      }
      gl.enableVertexAttribArray(this._uvLocation);

      this._textureLocation = gl.getUniformLocation(programId, "texture");
      if (this._textureLocation === null) {
        return;
      }

      gl.uniform1i(this._textureLocation, 0);

      {
        this._uvArray = new Float32Array([
          1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        ]);

        this._uvBuffer = gl.createBuffer();
      }

      {
        const maxWidth = canvas.width;
        const maxHeight = canvas.height;

        this._positionArray = new Float32Array([
          (this._rect.right - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.up - maxHeight * 0.5) / (maxHeight * 0.5),
          (this._rect.left - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.up - maxHeight * 0.5) / (maxHeight * 0.5),
          (this._rect.left - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.down - maxHeight * 0.5) / (maxHeight * 0.5),
          (this._rect.right - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.down - maxHeight * 0.5) / (maxHeight * 0.5),
        ]);

        this._vertexBuffer = gl.createBuffer();
      }

      {
        this._indexArray = new Uint16Array([0, 1, 2, 3, 2, 0]);
        this._indexBuffer = gl.createBuffer();
      }

      this._firstDraw = false;
    }

    if (this._uvLocation === null) {
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._uvArray, gl.STATIC_DRAW);

    gl.vertexAttribPointer(this._uvLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._positionArray, gl.STATIC_DRAW);

    if (this._positionLocation === null) {
      return;
    }

    gl.vertexAttribPointer(this._positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexArray, gl.DYNAMIC_DRAW);

    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    if (this._indexArray === null) {
      return;
    }

    gl.drawElements(
      gl.TRIANGLES,
      this._indexArray.length,
      gl.UNSIGNED_SHORT,
      0
    );
  }

  public isHit(pointX: number, pointY: number): boolean {
    if (this._rect === null || canvas === null) {
      return false;
    }

    const { height } = canvas;
    const y = height - pointY;

    return (
      pointX >= this._rect.left &&
      pointX <= this._rect.right &&
      y <= this._rect.up &&
      y >= this._rect.down
    );
  }
}
