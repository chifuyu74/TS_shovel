import { CubismMatrix44 } from "@live2dSdk/math/cubismmatrix44";
import { CubismViewMatrix } from "@live2dSdk/math/cubismviewmatrix";

// user define class
import { TouchManager } from "@live2d/TouchManager";
import { Sprite } from "@live2d/Sprite";
import * as Define from "@live2d/Define";
import { canvas, gl, Delegate } from "@live2d/Delegate";
import { TextureInfo } from "@live2d/TextureManager";
import { Pal } from "@live2d/Pal";
import { Live2DManager } from "@live2d/Live2DManager";

export class View {
  _touchManager: TouchManager | null = new TouchManager();
  _deviceToScreen: CubismMatrix44 | null = new CubismMatrix44();
  _viewMatrix: CubismViewMatrix | null = new CubismViewMatrix();
  _programId: WebGLProgram | null = null;
  _back: Sprite | null = null;
  _gear: Sprite | null = null;
  _changeModel: boolean = false;
  _isClick: boolean = false;

  public initialize(): void {
    if (canvas === null) {
      return;
    }
    const { width, height } = canvas;

    const ratio: number = width / height;
    const left: number = -ratio;
    const right: number = ratio;
    const bottom: number = Define.ViewLogicalLeft;
    const top: number = Define.ViewLogicalRight;

    if (this._viewMatrix === null || this._deviceToScreen === null) {
      return;
    }

    this._viewMatrix.setScreenRect(left, right, bottom, top);
    this._viewMatrix.scale(Define.ViewScale, Define.ViewScale);

    this._deviceToScreen.loadIdentity();
    if (width > height) {
      const screenW: number = Math.abs(right - left);
      this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
    } else {
      const screenH: number = Math.abs(top - bottom);
      this._deviceToScreen.scaleRelative(screenH / height, -screenH / height);
    }
    this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

    this._viewMatrix.setMaxScale(Define.ViewMaxScale);
    this._viewMatrix.setMinScale(Define.ViewMinScale);

    this._viewMatrix.setMaxScreenRect(
      Define.ViewLogicalMaxLeft,
      Define.ViewLogicalMaxRight,
      Define.ViewLogicalMaxBottom,
      Define.ViewLogicalMaxTop
    );
  }

  public release(): void {
    this._viewMatrix = null;
    this._touchManager = null;
    this._deviceToScreen = null;

    if (this._gear !== null) {
      this._gear.release();
    }
    this._gear = null;

    if (this._back !== null) {
      this._back.release();
    }

    this._back = null;

    if (gl !== null) {
      gl.deleteProgram(this._programId);
    }

    this._programId = null;
  }

  public render(): void {
    if (gl === null || this._programId === null) {
      return;
    }

    gl.useProgram(this._programId);

    if (this._back) {
      this._back.render(this._programId);
    }
    if (this._gear) {
      this._gear.render(this._programId);
    }

    gl.flush();

    const live2DManager: Live2DManager = Live2DManager.getInstance();

    if (this._viewMatrix === null) {
      return;
    }
    live2DManager.setViewMatrix(this._viewMatrix);

    live2DManager.onUpdate();
  }

  public initializeSprite(): void {
    if (canvas === null) {
      return;
    }

    const width: number = canvas.width;
    const height: number = canvas.height;

    const textureManager = Delegate.getInstance().getTextureManager();
    const resourcesPath = Define.ResourcesPath;

    let imageName = "";

    imageName = Define.BackImageName;

    const initBackGroundTexture = (textureInfo: TextureInfo): void => {
      if (textureInfo.id === null) {
        return;
      }
      const x: number = width * 0.5;
      const y: number = height * 0.5;

      const fwidth = textureInfo.width * 2.0;
      const fheight = height * 0.95;
      this._back = new Sprite(x, y, fwidth, fheight, textureInfo.id);
    };

    textureManager.createTextureFromPngFile(
      resourcesPath + imageName,
      false,
      initBackGroundTexture
    );

    imageName = Define.GearImageName;
    const initGearTexture = (textureInfo: TextureInfo): void => {
      if (textureInfo.id === null) {
        return;
      }
      const x = width - textureInfo.width * 0.5;
      const y = height - textureInfo.height * 0.5;
      const fwidth = textureInfo.width;
      const fheight = textureInfo.height;
      this._gear = new Sprite(x, y, fwidth, fheight, textureInfo.id);
    };

    textureManager.createTextureFromPngFile(
      resourcesPath + imageName,
      false,
      initGearTexture
    );

    if (this._programId === null) {
      const shader = Delegate.getInstance().createShader();
      if (shader !== null) {
        this._programId = shader;
      }
    }
  }

  public onTouchesBegan(pointX: number, pointY: number): void {
    if (this._touchManager === null) {
      return;
    }

    this._touchManager.touchesBegan(pointX, pointY);
  }

  public onTouchesMoved(pointX: number, pointY: number): void {
    if (this._touchManager === null) {
      return;
    }

    const viewX: number = this.transformViewX(this._touchManager.getX());
    const viewY: number = this.transformViewY(this._touchManager.getY());

    this._touchManager.touchesMoved(pointX, pointY);

    const live2DManager: Live2DManager = Live2DManager.getInstance();
    live2DManager.onDrag(viewX, viewY);
  }

  public onTouchesEnded(pointX: number, pointY: number): void {
    const live2DManager: Live2DManager = Live2DManager.getInstance();
    live2DManager.onDrag(0.0, 0.0);

    {
      if (
        this._deviceToScreen === null ||
        this._touchManager === null ||
        this._gear === null
      ) {
        return;
      }
      const x: number = this._deviceToScreen.transformX(
        this._touchManager.getX()
      );
      const y: number = this._deviceToScreen.transformY(
        this._touchManager.getY()
      );

      if (Define.DebugTouchLogEnable) {
        Pal.printMessage(`[APP]touchesEnded x: ${x} y: ${y}`);
      }
      live2DManager.onTap(x, y);

      if (this._gear.isHit(pointX, pointY)) {
        live2DManager.nextScene();
      }
    }
  }

  public transformViewX(deviceX: number): number {
    if (this._deviceToScreen === null || this._viewMatrix === null) {
      return 0;
    }

    const screenX: number = this._deviceToScreen.transformX(deviceX);
    return this._viewMatrix.invertTransformX(screenX);
  }

  public transformViewY(deviceY: number): number {
    if (this._deviceToScreen === null || this._viewMatrix === null) {
      return 0;
    }

    const screenY: number = this._deviceToScreen.transformY(deviceY);
    return this._viewMatrix.invertTransformY(screenY);
  }

  public transformScreenX(deviceX: number): number {
    if (this._deviceToScreen === null) {
      return 0;
    }

    return this._deviceToScreen.transformX(deviceX);
  }

  public transformScreenY(deviceY: number): number {
    if (this._deviceToScreen === null) {
      return 0;
    }
    return this._deviceToScreen.transformY(deviceY);
  }
}
