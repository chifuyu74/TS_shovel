import { csmVector, iterator } from "@live2dSdk/type/csmvector";
import { gl } from "@live2d/Delegate";

export class TextureInfo {
  img: HTMLImageElement | null = null;
  id: WebGLTexture | null = null;
  width: number = 0;
  height: number = 0;
  usePremultply: boolean = false;
  fileName: string = "";

  constructor() {
    this.img = null;
    this.id = null;
    this.width = 0;
    this.height = 0;
    this.usePremultply = false;
    this.fileName = "";
  }
}

export class TextureManager {
  _textures: csmVector<TextureInfo> | null = new csmVector<TextureInfo>();

  public release(): void {
    if (this._textures) {
      for (
        let ite: iterator<TextureInfo> = this._textures.begin();
        ite.notEqual(this._textures.end());
        ite.preIncrement()
      ) {
        if (gl) {
          gl.deleteTexture(ite.ptr().id);
        }
      }
      this._textures = null;
    }
  }

  public createTextureFromPngFile(
    fileName: string,
    usePreMultiply: boolean,
    callback: (textureInfo: TextureInfo) => void
  ): void {
    if (this._textures) {
      for (
        let ite: iterator<TextureInfo> = this._textures.begin();
        ite.notEqual(this._textures.end());
        ite.preIncrement()
      ) {
        if (
          ite.ptr().fileName === fileName &&
          ite.ptr().usePremultply === usePreMultiply
        ) {
          ite.ptr().img = new Image();
          ite.ptr().img!.onload = (): void => callback(ite.ptr());
          ite.ptr().img!.src = fileName;
          return;
        }
      }
    }

    const img = new Image();
    img.onload = (): void => {
      if (gl) {
        const glTexture = gl.createTexture();
        const tex: WebGLTexture = glTexture ?? new WebGLTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_LINEAR
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        if (usePreMultiply) {
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
        }
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);

        const textureInfo = new TextureInfo();
        if (textureInfo !== null) {
          textureInfo.fileName = fileName;
          textureInfo.width = img.width;
          textureInfo.height = img.height;
          textureInfo.id = tex;
          textureInfo.img = img;
          textureInfo.usePremultply = usePreMultiply;
          if (this._textures !== null) {
            this._textures.pushBack(textureInfo);
          }
        }
        callback(textureInfo);
      }
    };
    img.src = fileName;
  }

  public releaseTextures(): void {
    if (this._textures) {
      for (let i = 0; i < this._textures.getSize(); i++) {
        this._textures.set(i, new TextureInfo()); // null
      }
      this._textures.clear();
    }
  }

  public releaseTextureByTexture(texture: WebGLTexture): void {
    if (this._textures) {
      for (let i = 0; i < this._textures.getSize(); i++) {
        if (this._textures.at(i).id !== texture) {
          continue;
        }

        this._textures.set(i, new TextureInfo()); // null
        this._textures.remove(i);
        break;
      }
    }
  }

  public releaseTextureByFilePath(fileName: string): void {
    if (this._textures) {
      for (let i = 0; i < this._textures.getSize(); i++) {
        if (this._textures.at(i).fileName === fileName) {
          this._textures.set(i, new TextureInfo()); // null
          this._textures.remove(i);
          break;
        }
      }
    }
  }
}
