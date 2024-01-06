/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

export class WavFileInfo {
  _fileName: string = "";
  _numberOfChannels: number = 0;
  _bitsPerSample: number = 0;
  _samplingRate: number = 0;
  _samplesPerChannel: number = 0;
}

export class ByteReader {
  _fileByte: ArrayBuffer | null = null;
  _fileDataView: DataView | null = null;
  _fileSize: number = 0;
  _readOffset: number = 0;

  public get8(): number {
    if (this._fileDataView === null) {
      return 0;
    }
    const ret = this._fileDataView.getUint8(this._readOffset);
    this._readOffset++;
    return ret;
  }

  public get16LittleEndian(): number {
    if (this._fileDataView === null) {
      return 0;
    }
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 2;
    return ret;
  }

  public get24LittleEndian(): number {
    if (this._fileDataView === null) {
      return 0;
    }

    const ret =
      (this._fileDataView.getUint8(this._readOffset + 2) << 16) |
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 3;
    return ret;
  }

  public get32LittleEndian(): number {
    if (this._fileDataView === null) {
      return 0;
    }

    const ret =
      (this._fileDataView.getUint8(this._readOffset + 3) << 24) |
      (this._fileDataView.getUint8(this._readOffset + 2) << 16) |
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 4;
    return ret;
  }

  public getCheckSignature(reference: string): boolean {
    const getSignature: Uint8Array = new Uint8Array(4);
    const referenceString: Uint8Array = new TextEncoder().encode(reference);
    if (reference.length !== 4) {
      return false;
    }
    for (let signatureOffset = 0; signatureOffset < 4; signatureOffset++) {
      getSignature[signatureOffset] = this.get8();
    }
    return (
      getSignature[0] === referenceString[0] &&
      getSignature[1] === referenceString[1] &&
      getSignature[2] === referenceString[2] &&
      getSignature[3] === referenceString[3]
    );
  }
}

export class WavFileHandler {
  private static s_instance: WavFileHandler | null = null;

  _pcmData: Array<Float32Array> | null = null;
  _userTimeSeconds: number = 0.0;
  _lastRms: number = 0.0;
  _sampleOffset: number = 0.0;
  _wavFileInfo: WavFileInfo = new WavFileInfo();
  _byteReader: ByteReader = new ByteReader();

  _loadFiletoBytes = (arrayBuffer: ArrayBuffer, length: number): void => {
    this._byteReader._fileByte = arrayBuffer;
    this._byteReader._fileDataView = new DataView(this._byteReader._fileByte);
    this._byteReader._fileSize = length;
  };

  public static getInstance(): WavFileHandler {
    if (this.s_instance === null) {
      this.s_instance = new WavFileHandler();
    }

    return this.s_instance;
  }

  public static releaseInstance(): void {
    if (this.s_instance != null) {
      // this.s_instance = void 0;
      this.s_instance = null;
    }

    this.s_instance = null;
  }

  public update(deltaTimeSeconds: number) {
    let goalOffset: number;
    let rms: number;

    if (
      this._pcmData == null ||
      this._sampleOffset >= this._wavFileInfo._samplesPerChannel
    ) {
      this._lastRms = 0.0;
      return false;
    }

    this._userTimeSeconds += deltaTimeSeconds;
    goalOffset = Math.floor(
      this._userTimeSeconds * this._wavFileInfo._samplingRate
    );
    if (goalOffset > this._wavFileInfo._samplesPerChannel) {
      goalOffset = this._wavFileInfo._samplesPerChannel;
    }

    rms = 0.0;
    for (
      let channelCount = 0;
      channelCount < this._wavFileInfo._numberOfChannels;
      channelCount++
    ) {
      for (
        let sampleCount = this._sampleOffset;
        sampleCount < goalOffset;
        sampleCount++
      ) {
        const pcm = this._pcmData[channelCount][sampleCount];
        rms += pcm * pcm;
      }
    }
    rms = Math.sqrt(
      rms /
        (this._wavFileInfo._numberOfChannels *
          (goalOffset - this._sampleOffset))
    );

    this._lastRms = rms;
    this._sampleOffset = goalOffset;
    return true;
  }

  public start(filePath: string): void {
    this._sampleOffset = 0;
    this._userTimeSeconds = 0.0;

    this._lastRms = 0.0;

    if (!this.loadWavFile(filePath)) {
      return;
    }
  }

  public getRms(): number {
    return this._lastRms;
  }

  public loadWavFile(filePath: string): boolean {
    let ret = false;

    if (this._pcmData != null) {
      this.releasePcmData();
    }

    const asyncFileLoad = async () => {
      return fetch(filePath).then((responce) => {
        return responce.arrayBuffer();
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const asyncWavFileManager = (async () => {
      this._byteReader._fileByte = await asyncFileLoad();
      this._byteReader._fileDataView = new DataView(this._byteReader._fileByte);
      this._byteReader._fileSize = this._byteReader._fileByte.byteLength;
      this._byteReader._readOffset = 0;

      if (
        this._byteReader._fileByte == null ||
        this._byteReader._fileSize < 4
      ) {
        return false;
      }

      this._wavFileInfo._fileName = filePath;

      try {
        if (!this._byteReader.getCheckSignature("RIFF")) {
          ret = false;
          throw new Error('Cannot find Signeture "RIFF".');
        }

        this._byteReader.get32LittleEndian();

        if (!this._byteReader.getCheckSignature("WAVE")) {
          ret = false;
          throw new Error('Cannot find Signeture "WAVE".');
        }

        if (!this._byteReader.getCheckSignature("fmt ")) {
          ret = false;
          throw new Error('Cannot find Signeture "fmt".');
        }

        const fmtChunkSize = this._byteReader.get32LittleEndian();

        if (this._byteReader.get16LittleEndian() !== 1) {
          ret = false;
          throw new Error("File is not linear PCM.");
        }

        this._wavFileInfo._numberOfChannels =
          this._byteReader.get16LittleEndian();

        this._wavFileInfo._samplingRate = this._byteReader.get32LittleEndian();

        this._byteReader.get32LittleEndian();

        this._byteReader.get16LittleEndian();

        this._wavFileInfo._bitsPerSample = this._byteReader.get16LittleEndian();

        if (fmtChunkSize > 16) {
          this._byteReader._readOffset += fmtChunkSize - 16;
        }

        while (
          !this._byteReader.getCheckSignature("data") &&
          this._byteReader._readOffset < this._byteReader._fileSize
        ) {
          this._byteReader._readOffset +=
            this._byteReader.get32LittleEndian() + 4;
        }

        if (this._byteReader._readOffset >= this._byteReader._fileSize) {
          ret = false;
          throw new Error('Cannot find "data" Chunk.');
        }

        {
          const dataChunkSize = this._byteReader.get32LittleEndian();
          this._wavFileInfo._samplesPerChannel =
            (dataChunkSize * 8) /
            (this._wavFileInfo._bitsPerSample *
              this._wavFileInfo._numberOfChannels);
        }

        this._pcmData = new Array(this._wavFileInfo._numberOfChannels);
        for (
          let channelCount = 0;
          channelCount < this._wavFileInfo._numberOfChannels;
          channelCount++
        ) {
          this._pcmData[channelCount] = new Float32Array(
            this._wavFileInfo._samplesPerChannel
          );
        }

        for (
          let sampleCount = 0;
          sampleCount < this._wavFileInfo._samplesPerChannel;
          sampleCount++
        ) {
          for (
            let channelCount = 0;
            channelCount < this._wavFileInfo._numberOfChannels;
            channelCount++
          ) {
            this._pcmData[channelCount][sampleCount] = this.getPcmSample();
          }
        }

        ret = true;
      } catch (e) {
        console.log(e);
      }
    })();

    return ret;
  }

  public getPcmSample(): number {
    let pcm32;

    switch (this._wavFileInfo._bitsPerSample) {
      case 8:
        pcm32 = this._byteReader.get8() - 128;
        pcm32 <<= 24;
        break;
      case 16:
        pcm32 = this._byteReader.get16LittleEndian() << 16;
        break;
      case 24:
        pcm32 = this._byteReader.get24LittleEndian() << 8;
        break;
      default:
        pcm32 = 0;
        break;
    }

    return pcm32 / 2147483647;
  }

  public releasePcmData(): void {
    if (this._pcmData === null) {
      return;
    }

    for (
      let channelCount = 0;
      channelCount < this._wavFileInfo._numberOfChannels;
      channelCount++
    ) {
      delete this._pcmData[channelCount];
    }
    // delete this._pcmData;
    this._pcmData = null;
  }
}
