import type { IRotation } from "@type/IRotation";
import type { ITranslation } from "@type/ITranslation";
import type { IScale } from "@type/IScale";
import { GLError } from "@gl/GLError";
import type { Matrix3x3, Matrix4x4, GLCanvasSize } from "@gl/types";
import type { GLInitParameter } from "@gl/tempParam";

export class GL {
  private canvas!: HTMLCanvasElement;

  private gl!: WebGL2RenderingContext;
  private shader!: WebGLShader;
  private vertexShader!: WebGLShader;
  private fragmentShader!: WebGLShader;
  private program!: WebGLProgram;
  private a_position: number = -1;
  private buffer: WebGLBuffer;
  private resolultionUniform: WebGLUniformLocation;
  private colorLocation: WebGLUniformLocation;
  private matrixLocation: WebGLUniformLocation;
  private matrix2D: Matrix3x3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  private matrix3D: Matrix4x4 = [0, 0, 0, 0, 0, 0, 0, 0, 0];

  // util
  private static glsl: string = "";
  private debugMode: boolean = false;
  private stdCanvasSize: GLCanvasSize = { width: 1920, height: 1080 };

  constructor() {
    this.debugMode = process.env.NODE_ENV === "production";
    if (!this.debugMode) {
      console.log(GLError.Initialized);
    }
  }

  public setDebugMode(activate: boolean) {
    this.debugMode = activate;
  }

  public init(param: GLInitParameter) {
    this.initGL(param);
    this.drawScene();

    // texture
    // this.createImage();
  }

  private initGL(param: GLInitParameter) {
    if (!param) {
      throw new Error(GLError.NotInitialized);
    }

    const {
      vertexSource,
      fragmentSource,
      programAttributeLocation,
      // bindingBuffer,
    } = param;

    this.initialize();
    this.resizeCanvas(this.stdCanvasSize);
    this.setViewport();
    this.createVertexFragmentShader(vertexSource, fragmentSource);
    this.createProgram();
    this.uploadProgram(programAttributeLocation);
    this.createBuffer();
    this.bindBuffer(this.setGeometry());
  }

  private drawScene() {
    this.clearCanvas();
    this.useProgram();
    this.pullBuffer();
    this.drawing();
  }

  private resizeCanvas(param: GLCanvasSize) {
    if (param.width < 0 || param.height < 0) {
      throw new Error(GLError.CanvasSizeRange);
    }
    this.canvas.width = param.width;
    this.canvas.height = param.height;
  }

  private initialize() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(GLError.NullCanvas);
    }

    this.canvas = canvas;

    const gl =
      this.canvas.getContext("webgl2") ||
      this.canvas.getContext("experimental-webgl2")! ||
      this.canvas.getContext("webgl") ||
      this.canvas.getContext("experimental-webgl");
    if (!gl) {
      throw new Error(GLError.NullWebGL);
    }
    this.gl = gl;
  }

  private createVertexFragmentShader(
    vertexSource: string,
    fragmentSource: string
  ): void {
    if (!vertexSource || !fragmentSource) {
      throw new Error(GLError.ShaderSourceEmpty);
    }

    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    if (!vertexShader) {
      throw new Error(`Vertex ${GLError.ShaderCreateFailed}`);
    }

    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fragmentSource
    );
    if (!fragmentShader) {
      throw new Error(`Fragment ${GLError.ShaderCreateFailed}`);
    }

    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
  }

  private createShader(type: number, source: string): WebGLShader | void {
    const tempShader = this.gl.createShader(type);
    if (!tempShader) {
      throw new Error(GLError.ShaderSourceEmpty);
    }

    this.shader = tempShader;
    this.gl.shaderSource(this.shader, source);
    this.gl.compileShader(this.shader);

    const success = this.gl.getShaderParameter(
      this.shader,
      this.gl.COMPILE_STATUS
    );

    if (!success) {
      throw new Error(GLError.ShaderCreateFailed);
    }

    return tempShader;
  }

  public static getShader(className: string) {
    const shaders = Array.from(
      document.getElementsByClassName(className)
    ) as HTMLScriptElement[];
    shaders.forEach((element) => {
      if (element.textContent) {
        this.glsl = element.textContent;
      }
    });
  }

  private static identity(): Matrix3x3 {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }

  private static translation2D(
    translateX: number,
    translateY: number
  ): Matrix3x3 {
    return [1, 0, 0, 0, 1, 0, translateX, translateY, 1];
  }

  private static rotation2D(angle: number): Matrix3x3 {
    const sin = Number(Math.sin(angle).toFixed(2));
    const cos = Number(Math.cos(angle).toFixed(2));

    return [cos, -sin, 0, sin, cos, 0, 0, 0, 1];
  }

  private static scale2D(scaleX: number, scaleY: number): Matrix3x3 {
    return [scaleX, 0, 0, 0, scaleY, 0, 0, 0, 1];
  }

  private static multiply2D(...matrix: Matrix3x3[]): Matrix3x3 {
    if (matrix.length === 0) {
      throw new Error(GLError.NoMatrix);
    }
    const first = matrix[0];
    const ret = matrix
      .slice(1)
      .reduce((a: Matrix3x3, b: Matrix3x3): Matrix3x3 => {
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

  multiply(a: number[], b: number[]): Matrix3x3 {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  }

  private static projection2D(width: number, height: number): Matrix3x3 {
    return [2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1];
  }

  private createProgram() {
    const program = this.gl.createProgram();
    if (!program) {
      this.gl.deleteProgram(program);
      return;
    }

    this.gl.validateProgram(program);
    this.program = program;
    // this.gl.deleteProgram(program);

    this.gl.attachShader(this.program, this.vertexShader);
    this.gl.attachShader(this.program, this.fragmentShader);
    this.gl.linkProgram(this.program);

    const success = this.gl.getProgramParameter(
      this.program,
      this.gl.LINK_STATUS
    );
    if (!success) {
      this.gl.deleteProgram(this.program);
    }
  }

  private uploadProgram(name: string) {
    const positionAttributeLocation = this.gl.getAttribLocation(
      this.program,
      name
    );
    if (positionAttributeLocation < 0) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.a_position = positionAttributeLocation;

    const colorLocation = this.gl.getUniformLocation(this.program, "u_color");
    if (!colorLocation) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.colorLocation = colorLocation;

    const matrixLocation = this.gl.getUniformLocation(this.program, "u_matrix");
    if (!matrixLocation) {
      throw new Error(GLError.UploadProgramFailed);
    }

    this.matrixLocation = matrixLocation;
  }

  private createBuffer() {
    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error(GLError.BufferCreateFailed);
    }

    this.buffer = buffer;
  }

  private bindBuffer(buffer: number[]) {
    // const determinant = (el: number) =>
    //   el < GLClipSpaceRange.minimum || el > GLClipSpaceRange.maximum;
    // const overflow = buffer.some(determinant);
    // if (overflow) {
    //   throw new Error(GLError.BufferRangeOverflow);
    // }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);

    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(buffer),
      this.gl.STATIC_DRAW
    );
  }

  private setViewport(param?: GLCanvasSize) {
    const isUnderFlow = param && (param.width < 0 || param.height < 0);
    if (isUnderFlow) {
      this.gl.viewport(0, 0, param.width, param.height);
      return;
    }
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  private clearCanvas() {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  private useProgram(index: number = this.a_position) {
    this.gl.useProgram(this.program);
    this.gl.enableVertexAttribArray(index);
  }

  private pullBuffer() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);

    const size = 2;
    const type = this.gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    this.gl.vertexAttribPointer(
      this.a_position,
      size,
      type,
      normalize,
      stride,
      offset
    );
  }

  private drawing(cnt?: number) {
    this.gl.uniform2f(
      this.resolultionUniform,
      this.gl.canvas.width,
      this.gl.canvas.height
    );
    const color = [0.5, 0.3, 1, 1];
    this.gl.uniform4fv(this.colorLocation, color);

    this.gl.uniformMatrix3fv(this.matrixLocation, false, this.matrix2D);

    const primitiveTypes = this.gl.TRIANGLES;
    const offset = 0;
    const count = cnt || 18;
    this.gl.drawArrays(primitiveTypes, offset, count);
  }

  private setRectangle(x: number, y: number, width: number, height: number) {
    const x1 = x;
    const x2 = x + width;
    const y1 = y;
    const y2 = y + height;
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
      this.gl.STATIC_DRAW
    );
  }

  public updateRectangle(
    translation: ITranslation,
    rotation: IRotation,
    scale: IScale
  ) {
    const translationMatrix = GL.translation2D(
      translation.transX,
      translation.transY
    );
    const rotationMatrix = GL.rotation2D((rotation.angle * Math.PI) / 180);
    const scaleMatrix = GL.scale2D(scale.scaleX, scale.scaleY);
    const projectionMatrix = GL.projection2D(
      this.gl.canvas.clientWidth,
      this.gl.canvas.clientHeight
    );

    let matrix2D: Matrix3x3 = GL.multiply2D(
      projectionMatrix,
      translationMatrix,
      rotationMatrix,
      scaleMatrix
    );
    this.matrix2D = matrix2D;

    this.drawScene();
  }

  private setGeometry(): number[] {
    return [
      // 왼쪽 열
      0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,

      // 상단 가로 획
      30, 0, 100, 0, 30, 30, 30, 30, 100, 0, 100, 30,

      // 중간 가로 획
      30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90,
    ];
  }
}
