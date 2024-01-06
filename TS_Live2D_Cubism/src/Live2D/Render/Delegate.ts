import { CubismFramework, Option } from "@live2dSdk/live2dcubismframework";
import { TextureManager } from "@live2d/TextureManager";
import { View } from "@live2d/View";
import { Pal } from "@live2d/Pal";
import * as Define from "@live2d/Define";
import { Live2DManager } from "@live2d/Live2DManager";

export let canvas: HTMLCanvasElement | null = null;
export let s_instance: Delegate | null = null;
export let gl: WebGLRenderingContext | null = null;
export let frameBuffer: WebGLFramebuffer | null = null;

export class Delegate {
  private static s_instance: Delegate | null = null;
  private _cubismOption: Option = new Option();
  public _view: View | null = new View();
  public _captured: boolean = false;
  private _mouseX: number = 0.0;
  private _mouseY: number = 0.0;
  private _isEnd: boolean = false;
  private _textureManager: TextureManager | null = new TextureManager();

  constructor() {
    this._view = this.getView();
  }

  public static getInstance(): Delegate {
    if (this.s_instance === null) {
      this.s_instance = new Delegate();
    }
    return this.s_instance;
  }

  public static releaseInstance(): void {
    if (this.s_instance !== null) {
      this.s_instance.release();
    }

    this.s_instance = null;
  }

  public release(): void {
    if (this._textureManager !== null && this._view !== null) {
      this._textureManager.release();
      this._textureManager = null;

      this._view.release();
      this._view = null;
    }
  }

  public getView(): View {
    if (this._view === null) {
      this._view = new View();
    }

    return this._view;
  }

  public getTextureManager(): TextureManager {
    if (this._textureManager === null) {
      this._textureManager = new TextureManager();
    }
    return this._textureManager;
  }

  public initializeCubism(): void {
    this._cubismOption.logFunction = Pal.printMessage;
    this._cubismOption.loggingLevel = Define.CubismLoggingLevel;
    CubismFramework.startUp(this._cubismOption);

    CubismFramework.initialize();

    Live2DManager.getInstance();
    Pal.updateTime();

    if (this._view === null) {
      this._view = new View();
    }
    this._view.initializeSprite();
  }

  private _resizeCanvas(): void {
    if (canvas === null) {
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  public onResize(): void {
    if (this._view === null) {
      return;
    }

    this._resizeCanvas();
    this._view.initialize();
    this._view.initializeSprite();
  }

  public initialize(): boolean {
    canvas = window.document.getElementById("can") as HTMLCanvasElement;
    if (this._view === null) {
      return false;
    }

    if (Define.CanvasSize === "auto") {
      this._resizeCanvas();
    } else {
      if (canvas === null) {
        return false;
      }
      canvas.width = Define.CanvasSize.width;
      canvas.height = Define.CanvasSize.height;
    }

    // @ts-ignore
    gl = canvas.getContext("webgl2") || canvas.getContext("experimental-webgl");

    if (!gl) {
      alert("Cannot initialize WebGL. This browser does not support.");
      gl = null;

      document.body.innerHTML =
        "This browser does not support the <code>&lt;canvas&gt;</code> element.";

      return false;
    }

    // document.body.appendChild(canvas);

    if (!frameBuffer) {
      frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const supportTouch: boolean = "ontouchend" in canvas;

    if (supportTouch) {
      // タッチ関連コールバック関数登録
      canvas.ontouchstart = onTouchBegan;
      canvas.ontouchmove = onTouchMoved;
      canvas.ontouchend = onTouchEnded;
      canvas.ontouchcancel = onTouchCancel;
    } else {
      // マウス関連コールバック関数登録
      canvas.onmousedown = onClickBegan;
      canvas.onmousemove = onMouseMoved;
      canvas.onmouseup = onClickEnded;
    }

    this._view.initialize();

    this.initializeCubism();

    return true;
  }

  public run(): void {
    const loop = (): void => {
      if (gl === null || this._view === null) {
        return;
      }

      Pal.updateTime();

      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      gl.enable(gl.DEPTH_TEST);

      gl.depthFunc(gl.LEQUAL);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.clearDepth(1.0);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      /*----------------------------
          Background Transparent
      ----------------------------*/
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // render
      this._view.render();

      requestAnimationFrame(loop);
    };
    loop();
  }

  public createShader(): WebGLProgram | null {
    if (gl === null) {
      return null;
    }
    const vertexShaderId = gl.createShader(gl.VERTEX_SHADER);

    if (vertexShaderId === null) {
      Pal.printMessage("failed to create vertexShader");
      return null;
    }

    const vertexShader: string =
      "precision mediump float;" +
      "attribute vec3 position;" +
      "attribute vec2 uv;" +
      "varying vec2 vuv;" +
      "void main(void)" +
      "{" +
      "   gl_Position = vec4(position, 1.0);" +
      "   vuv = uv;" +
      "}";

    gl.shaderSource(vertexShaderId, vertexShader);
    gl.compileShader(vertexShaderId);

    const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);

    if (fragmentShaderId == null) {
      Pal.printMessage("failed to create fragmentShader");
      return null;
    }

    const fragmentShader: string =
      "precision mediump float;" +
      "varying vec2 vuv;" +
      "uniform sampler2D texture;" +
      "void main(void)" +
      "{" +
      "   gl_FragColor = texture2D(texture, vuv);" +
      "}";

    gl.shaderSource(fragmentShaderId, fragmentShader);
    gl.compileShader(fragmentShaderId);

    const programId = gl.createProgram();
    if (programId === null) {
      return null;
    }

    gl.attachShader(programId, vertexShaderId);
    gl.attachShader(programId, fragmentShaderId);

    gl.deleteShader(vertexShaderId);
    gl.deleteShader(fragmentShaderId);

    gl.linkProgram(programId);

    gl.useProgram(programId);

    return programId;
  }
}

export function onClickBegan(e: MouseEvent): void {
  const delegate: Delegate = Delegate.getInstance();

  if (!delegate._view) {
    Pal.printMessage("view notfound");
    return;
  }
  Delegate.getInstance()._captured = true;

  const posX: number = e.pageX;
  const posY: number = e.pageY;

  delegate._view.onTouchesBegan(posX, posY);
}

export function onMouseMoved(e: MouseEvent): void {
  const delegate: Delegate = Delegate.getInstance();

  if (!delegate._captured) {
    return;
  }

  if (!delegate._view) {
    Pal.printMessage("view notfound");
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;

  delegate._view.onTouchesMoved(posX, posY);
}

export function onClickEnded(e: MouseEvent): void {
  const delegate: Delegate = Delegate.getInstance();

  delegate._captured = false;
  if (!delegate._view) {
    Pal.printMessage("view notfound");
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;

  delegate._view.onTouchesEnded(posX, posY);
}

export function onTouchBegan(e: TouchEvent): void {
  const delegate: Delegate = Delegate.getInstance();

  if (!delegate._view) {
    Pal.printMessage("view notfound");
    return;
  }

  delegate._captured = true;

  const posX = e.changedTouches[0].pageX;
  const posY = e.changedTouches[0].pageY;

  delegate._view.onTouchesBegan(posX, posY);
}

export function onTouchMoved(e: TouchEvent): void {
  const delegate: Delegate = Delegate.getInstance();

  if (!delegate._captured) {
    return;
  }

  if (!delegate._view) {
    Pal.printMessage("view notfound");
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  delegate._view.onTouchesMoved(posX, posY);
}

export function onTouchEnded(e: TouchEvent): void {
  const delegate: Delegate = Delegate.getInstance();
  delegate._captured = false;

  if (!delegate._view) {
    Pal.printMessage("view notfound");
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  delegate._view.onTouchesEnded(posX, posY);
}

export function onTouchCancel(e: TouchEvent): void {
  const delegate: Delegate = Delegate.getInstance();
  delegate._captured = false;

  if (!delegate._view) {
    Pal.printMessage("view notfound");
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  delegate._view.onTouchesEnded(posX, posY);
}
