/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

export class Pal {
  public static lastUpdate = Date.now();

  public static s_currentFrame = 0.0;
  public static s_lastFrame = 0.0;
  public static s_deltaTime = 0.0;

  public static loadFileAsBytes(
    filePath: string,
    callback: (arrayBuffer: ArrayBuffer, size: number) => void
  ): void {
    fetch(filePath)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => callback(arrayBuffer, arrayBuffer.byteLength));
  }

  public static getDeltaTime(): number {
    return this.s_deltaTime;
  }

  public static updateTime(): void {
    this.s_currentFrame = Date.now();
    this.s_deltaTime = (this.s_currentFrame - this.s_lastFrame) / 1000;
    this.s_lastFrame = this.s_currentFrame;
  }

  public static printMessage(message: string): void {
    console.log(message);
  }
}
