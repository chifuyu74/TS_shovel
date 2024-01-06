import type {
  Matrix3x3,
  Matrix4x4,
  GLCanvasSize,
  Vector3,
  IPerspective,
  BufferSizeOrData,
} from "@gl/types";
import { GLError } from "@gl/GLError";
import Operator from "@/gl/Operator";
import type { GLInitParameter } from "@gl/tempParam";

import type {
  // IAngle3D,
  IRotation,
} from "@type/IRotation";
import type {
  ITranslation2D,
  // ITranslation3D
} from "@type/ITranslation";
import type {
  IScale2D,
  //IScale3D
} from "@type/IScale";
// import type { IFieldOfView } from "@type/IFieldOfView";
import { ICameraAngle } from "@type/ICameraAngle";

// buffer creator
import { ArrayCreator } from "@gl/ArrayCreator";
import { ILightRotation2D } from "@/types/ILightRotation";
import { ILimit } from "@/types/ILimit";

export class GL {
  /*-------------------------
      HTML Canvas Element
  -------------------------*/
  private canvas!: HTMLCanvasElement;

  /*-----------------
      WebGL Member
  -----------------*/
  private gl!: WebGL2RenderingContext;
  private shader!: WebGLShader;
  private vertexShader!: WebGLShader;
  private fragmentShader!: WebGLShader;
  private program!: WebGLProgram;

  /*-----------------
      Util Member
  -----------------*/
  private static glsl: string = "";
  private debugMode: boolean = false;
  private stdCanvasSize: GLCanvasSize = { width: 1920, height: 1080 };
  private Operator: Operator = new Operator();

  /*---------------
      Attribute
  ---------------*/
  // position
  private positionLocation: number = -1;
  private positionBuffer: WebGLBuffer;

  // normal
  private normalLocation: number = -1;
  private normalBuffer: WebGLBuffer;

  /*-------------
      Uniform
  -------------*/
  // color
  private colorLocation: WebGLUniformLocation;

  // matrix
  private matrix3D: Matrix4x4 = [...Operator.identity3DArray];

  // light
  // vec3
  private lightWorldPositionLocation: WebGLUniformLocation;
  private viewWorldPositionLocation: WebGLUniformLocation;
  private lightDirectionLocation: WebGLUniformLocation;
  private innerLimitLocation: WebGLUniformLocation;
  private outerLimitLocation: WebGLUniformLocation;

  // float
  private shininessLocation: WebGLUniformLocation;

  // mat4
  private worldViewProjectionLocation: WebGLUniformLocation;
  private worldInverseTransposeLocation: WebGLUniformLocation;
  private worldLocation: WebGLUniformLocation;

  /*------------------
      Helper Member
  ------------------*/
  // 2D
  private matrix2D: Matrix3x3 = [...Operator.identity2DArray];
  private projectionMatrix: Matrix4x4 = [...Operator.identity3DArray];

  constructor() {
    this.debugMode = process.env.NODE_ENV === "production";
    if (!this.debugMode) {
      console.log(GLError.Initialized);
    }
  }

  private setRectangle(x: number, y: number, width: number, height: number): void {
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

  public static getShader(className: string): void {
    const shaders = Array.from(document.getElementsByClassName(className)) as HTMLScriptElement[];
    shaders.forEach((element) => {
      if (element.textContent) {
        this.glsl = element.textContent;
      }
    });
  }

  public setDebugMode(activate: boolean): void {
    this.debugMode = activate;
  }

  private setViewport(param?: GLCanvasSize): void {
    const isUnderFlow = param && (param.width < 0 || param.height < 0);
    if (isUnderFlow) {
      this.gl.viewport(0, 0, param.width, param.height);
      return;
    }
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  public init(param: GLInitParameter): void {
    this.initGL(param);
    this.drawScene();
  }

  private initGL(param: GLInitParameter): void {
    if (!param) {
      throw new Error(GLError.NotInitialized);
    }

    const { vertexSource, fragmentSource } = param;

    this.initialize();
    this.resizeCanvas(this.stdCanvasSize);
    this.setViewport();
    this.createVertexFragmentShader(vertexSource, fragmentSource);
    this.createProgram();
    this.useLocation();

    const positions = ArrayCreator.setGeometry();
    this.processPositionBuffer(positions);

    const normals = new Float32Array(ArrayCreator.normalCreator());
    this.onNormalBuffer(normals);
  }

  private drawScene(): void {
    this.clearCanvas();
    this.useProgram();
    this.drawing();
  }

  private resizeCanvas(param: GLCanvasSize): void {
    if (param.width < 0 || param.height < 0) {
      throw new Error(GLError.CanvasSizeRange);
    }
    this.canvas.width = param.width;
    this.canvas.height = param.height;
  }

  private initialize(): void {
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

  private createVertexFragmentShader(vertexSource: string, fragmentSource: string): void {
    if (!vertexSource || !fragmentSource) {
      throw new Error(GLError.ShaderSourceEmpty);
    }

    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    if (!vertexShader) {
      throw new Error(`Vertex ${GLError.ShaderCreateFailed}`);
    }

    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
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

    const success = this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS);

    if (!success) {
      throw new Error(GLError.ShaderCreateFailed);
    }

    return tempShader;
  }

  private createProgram(): void {
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

    const success = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
    if (!success) {
      this.gl.deleteProgram(this.program);
    }
  }

  private useLocation(): void {
    /*---------------
        Attribute
    ---------------*/

    /*--------------
        Position
    --------------*/
    const positionLocation = this.gl.getAttribLocation(this.program, "a_position");
    if (positionLocation < 0) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.positionLocation = positionLocation;

    /*------------
        Normal
    ------------*/
    const normalLocation = this.gl.getAttribLocation(this.program, "a_normal");
    if (normalLocation < 0) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.normalLocation = normalLocation;

    /*-------------
        Uniform
    -------------*/

    /*-----------
        Color
    -----------*/
    const colorLocation = this.gl.getUniformLocation(this.program, "u_color");
    if (!colorLocation) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.colorLocation = colorLocation;

    /*-----------
        Light
    -----------*/

    /*-----------
        vec3
    -----------*/
    const lightWorldPositionLocation = this.gl.getUniformLocation(
      this.program,
      "u_lightWorldPosition"
    );
    if (!lightWorldPositionLocation) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.lightWorldPositionLocation = lightWorldPositionLocation;

    const viewWorldPositionLocation = this.gl.getUniformLocation(
      this.program,
      "u_viewWorldPosition"
    );
    if (!viewWorldPositionLocation) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.viewWorldPositionLocation = viewWorldPositionLocation;

    const lightDirectionLocation = this.gl.getUniformLocation(this.program, "u_lightDirection");
    if (!lightDirectionLocation) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.lightDirectionLocation = lightDirectionLocation;

    /*-----------
        float
    -----------*/
    const innerLimitLocation = this.gl.getUniformLocation(this.program, "u_innerLimit");
    if (!innerLimitLocation) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.innerLimitLocation = innerLimitLocation;

    const outerLimitLocation = this.gl.getUniformLocation(this.program, "u_outerLimit");
    if (!outerLimitLocation) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.outerLimitLocation = outerLimitLocation;

    const shininessLocation = this.gl.getUniformLocation(this.program, "u_shininess");
    if (!shininessLocation) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.shininessLocation = shininessLocation;

    /*-----------
        mat4
    -----------*/
    const worldLocation = this.gl.getUniformLocation(this.program, "u_world");
    if (!worldLocation) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.worldLocation = worldLocation;

    const worldViewProjectionLocation = this.gl.getUniformLocation(
      this.program,
      "u_worldViewProjection"
    );
    if (!worldViewProjectionLocation) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.worldViewProjectionLocation = worldViewProjectionLocation;

    const worldInverseTransposeLocation = this.gl.getUniformLocation(
      this.program,
      "u_worldInverseTranspose"
    );
    if (!worldInverseTransposeLocation) {
      throw new Error(GLError.UploadProgramFailed);
    }
    this.worldInverseTransposeLocation = worldInverseTransposeLocation;
  }

  private createBuffer(): WebGLBuffer {
    const glBuffer = this.gl.createBuffer();
    if (!glBuffer) {
      throw new Error(GLError.BufferCreateFailed);
    }

    return glBuffer;
  }

  /*--------------------------
      create & bind Buffer
  --------------------------*/
  private processPositionBuffer(data: BufferSizeOrData): void {
    this.positionBuffer = this.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
  }

  private onNormalBuffer(data: BufferSizeOrData) {
    this.normalBuffer = this.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
  }

  /*------------------
          Draw
  ------------------*/
  private clearCanvas(useDepthBuffer: boolean = true, useCullFace: boolean = true): void {
    this.gl.clearColor(0, 0, 0, 0);
    const mask = useDepthBuffer
      ? this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT
      : this.gl.COLOR_BUFFER_BIT;
    this.gl.clear(mask);
    if (useCullFace === true) {
      this.gl.enable(this.gl.CULL_FACE);
    }

    if (useDepthBuffer === true) {
      this.gl.enable(this.gl.DEPTH_TEST);
    }
  }

  private useProgram(): void {
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.gl.useProgram(this.program);
  }

  /*------------------------------
      bind buffer to attribute
  ------------------------------*/
  private processAttribute(
    enableLocation: number,
    buffer: WebGLBuffer,
    size: number,
    normalize: boolean
  ): void {
    this.gl.enableVertexAttribArray(enableLocation);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    // let size = 3;
    let type = this.gl.FLOAT;
    // let normalize = false;
    let stride = 0;
    let offset = 0;
    this.gl.vertexAttribPointer(enableLocation, size, type, normalize, stride, offset);
  }

  private processUniform(): void {
    const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    const zNear = 1;
    const zFar = 2000;
    const ratio: IPerspective = {
      aspect,
      far: zFar,
      near: zNear,
      fov: this.fieldOfViewRadians,
    };

    const projectionMatrix = this.Operator.perspective(ratio);

    const camera: Vector3 = [100, 150, 200];
    const target: Vector3 = [0, 35, 0];
    const up: Vector3 = [0, 1, 0];
    const cameraMatrix = this.Operator.lookAt(camera, target, up);

    const viewMatrix = this.Operator.inverseMatrix(cameraMatrix);

    const viewProjectionMatrix = this.Operator.multiply3D(projectionMatrix, viewMatrix);
    const worldMatrix = this.Operator.yRotation3D(this.fRotationRadians);

    let worldViewProjectionMatrix = this.Operator.multiply3D(viewProjectionMatrix, worldMatrix);
    worldViewProjectionMatrix = this.Operator.multiply3D(
      worldViewProjectionMatrix,
      this.Operator.xRotation3D(180)
    );
    worldViewProjectionMatrix = this.Operator.multiply3D(
      worldViewProjectionMatrix,
      this.Operator.translation3D(0, -60, 0)
    );

    const worldInverseMatrix = this.Operator.inverseMatrix(worldMatrix);
    const worldInverseTransposeMatrix = this.Operator.transpose(worldInverseMatrix);

    this.gl.uniform3fv(this.viewWorldPositionLocation, camera);

    const shininess = 150;
    this.gl.uniform1f(this.shininessLocation, shininess);

    const lightPosition: Vector3 = [40, 60, 120];
    let lightDirection: Vector3 = [0, 0, 1];
    let lmat = this.Operator.lookAt(lightPosition, target, up);
    lmat = this.Operator.multiply3D(this.Operator.xRotation3D(this.lightAngle.x), lmat);
    lmat = this.Operator.multiply3D(this.Operator.xRotation3D(this.lightAngle.y), lmat);
    lightDirection = [-lmat[8], -lmat[9], -lmat[10]];

    const innerLimit = this.Operator.degToRad(this.limit.innerLimit);
    const outerLimit = this.Operator.degToRad(this.limit.outerLimit);
    this.gl.uniform3fv(this.lightDirectionLocation, lightDirection);
    this.gl.uniform1f(this.innerLimitLocation, Math.cos(innerLimit));
    this.gl.uniform1f(this.outerLimitLocation, Math.cos(outerLimit));

    this.gl.uniformMatrix4fv(
      this.worldViewProjectionLocation,
      false,
      new Float32Array(worldViewProjectionMatrix)
    );
    this.gl.uniformMatrix4fv(
      this.worldInverseTransposeLocation,
      false,
      new Float32Array(worldInverseTransposeMatrix)
    );
    this.gl.uniformMatrix4fv(this.worldLocation, false, new Float32Array(worldMatrix));

    this.gl.uniform4fv(this.colorLocation, [0.2, 1, 0.2, 1]); // green

    this.gl.uniform3fv(this.lightWorldPositionLocation, lightPosition);
  }

  private processDrawArrays(): void {
    const primitiveType = this.gl.TRIANGLES;
    const offset = 0;
    const count = 16 * 6;
    this.gl.drawArrays(primitiveType, offset, count);
  }

  private fieldOfViewRadians: number = this.Operator.degToRad(60);

  private drawing(): void {
    this.processAttribute(this.positionLocation, this.positionBuffer, 3, false);
    this.processAttribute(this.normalLocation, this.normalBuffer, 3, false);
    this.processUniform();
    this.processDrawArrays();
  }

  public update2D(translation: ITranslation2D, rotation: IRotation, scale: IScale2D): void {
    const clientSize = {
      width: this.gl.canvas.clientWidth,
      height: this.gl.canvas.clientHeight,
    };
    this.matrix2D = this.Operator.makeClipSpace2D(translation, rotation, scale, clientSize);

    this.drawScene();
  }

  private fRotationRadians: number;
  private lightAngle: ILightRotation2D = { x: 0, y: 0 };
  private limit: ILimit = { innerLimit: 20, outerLimit: 40 };
  public update3D(
    updatingAngle: ICameraAngle,
    updatingLightAngle: ILightRotation2D,
    limit: ILimit
  ): void {
    const { cameraAngle } = updatingAngle;
    this.fRotationRadians = this.Operator.degToRad(cameraAngle);

    this.lightAngle = { ...this.lightAngle, ...updatingLightAngle };
    this.limit = limit;

    this.drawScene();
  }
}
