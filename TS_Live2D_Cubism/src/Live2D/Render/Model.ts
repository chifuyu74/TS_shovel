// import sdk
import {
  Live2DCubismFramework as live2d,
  LogLevel as cubismLogLevel,
  Option as cubismOption,
} from "@live2dSdk/live2dcubismframework";
import { CubismModelSettingJson } from "@live2dSdk/cubismmodelsettingjson";
import { ICubismModelSetting } from "@live2dSdk/icubismmodelsetting";
import { CubismUserModel } from "@live2dSdk/model/cubismusermodel";
import { CubismDefaultParameterId } from "@live2dSdk/cubismdefaultparameterid";

import { CubismMotion } from "@live2dSdk/motion/cubismmotion";
import {
  ACubismMotion,
  FinishedMotionCallback,
} from "@live2dSdk/motion/acubismmotion";
import {
  CubismMotionQueueEntryHandle,
  InvalidMotionQueueEntryHandleValue,
} from "@live2dSdk/motion/cubismmotionqueuemanager";

import { CubismIdHandle } from "@live2dSdk/id/cubismid";

import { csmVector } from "@live2dSdk/type/csmvector";
import { csmMap } from "@live2dSdk/type/csmmap";
import { csmRect } from "@live2dSdk/type/csmrectf";
import { csmString } from "@live2dSdk/type/csmstring";

import { CubismMatrix44 } from "@live2dSdk/math/cubismmatrix44";

import { CubismLogError, CubismLogInfo } from "@live2dSdk/utils/cubismdebug";

import { CubismEyeBlink } from "@live2dSdk/effect/cubismeyeblink";
import {
  BreathParameterData,
  CubismBreath,
} from "@live2dSdk/effect/cubismbreath";

import CubismFramework = live2d.CubismFramework;

// import custom source
import { TextureInfo } from "@live2d/TextureManager";
import { Delegate, gl, canvas, frameBuffer } from "@live2d/Delegate";
import { Pal } from "@live2d/Pal";
import * as Define from "@live2d/Define";
import { WavFileHandler } from "@live2d/WavFileHandler";

enum LoadStep {
  NotLoaded,
  LoadAssets,
  LoadModel,
  WaitLoadModel,
  LoadExpression,
  WaitLoadExpression,
  LoadPhysics,
  WaitLoadPhysics,
  LoadPose,
  WaitLoadPose,
  SetupEyeBlink,
  SetupBreath,
  LoadUserData,
  WaitLoadUserData,
  SetupEyeBlinkIds,
  SetupLipSyncIds,
  SetupLayout,
  LoadMotion,
  WaitLoadMotion,
  CompleteInitialize,
  CompleteSetupModel,
  LoadTexture,
  WaitLoadTexture,
  CompleteSetup,
  Length,
}

export class Model extends CubismUserModel {
  private static s_instance: Model | null = null;
  private framework: typeof CubismFramework = CubismFramework;
  private _loadState: LoadStep = LoadStep.NotLoaded;

  private _modelSetting: ICubismModelSetting | null = null;
  private _resourceUrl: string = `${process.env.PUBLIC_URL}/Resources/`;
  private _userTimeSeconds: number = 0.0;

  private _eyeBlinkIds: csmVector<CubismIdHandle> =
    new csmVector<CubismIdHandle>();
  private _lipSyncIds: csmVector<CubismIdHandle> =
    new csmVector<CubismIdHandle>();

  private _motions: csmMap<string, ACubismMotion> = new csmMap<
    string,
    ACubismMotion
  >();
  private _expressions: csmMap<string, ACubismMotion> = new csmMap<
    string,
    ACubismMotion
  >();

  private _hitArea: csmVector<csmRect> = new csmVector<csmRect>();
  private _userArea: csmVector<csmRect> = new csmVector<csmRect>();

  private _idParamAngleX: CubismIdHandle = this.framework
    .getIdManager()
    .getId(CubismDefaultParameterId.ParamAngleX);
  private _idParamAngleY: CubismIdHandle = this.framework
    .getIdManager()
    .getId(CubismDefaultParameterId.ParamAngleY);
  private _idParamAngleZ: CubismIdHandle = this.framework
    .getIdManager()
    .getId(CubismDefaultParameterId.ParamAngleZ);
  private _idParamEyeBallX: CubismIdHandle = this.framework
    .getIdManager()
    .getId(CubismDefaultParameterId.ParamEyeBallX);
  private _idParamEyeBallY: CubismIdHandle = this.framework
    .getIdManager()
    .getId(CubismDefaultParameterId.ParamEyeBallY);
  private _idParamBodyAngleX: CubismIdHandle = this.framework
    .getIdManager()
    .getId(CubismDefaultParameterId.ParamBodyAngleX);

  private _expressionCount: number = 0;
  private _textureCount: number = 0;
  private _motionCount: number = 0;
  private _allMotionCount: number = 0;
  private _wavFileHandler: WavFileHandler | null = new WavFileHandler();

  public constructor() {
    super();
  }

  public static getInstance(): Model {
    if (this.s_instance == null) {
      this.s_instance = new Model();
    }
    return this.s_instance;
  }

  public printMessage(message: string): void {
    console.log(message);
  }

  public initialize(): boolean {
    const opt: cubismOption = new cubismOption();
    opt.logFunction = this.printMessage;
    opt.loggingLevel = cubismLogLevel.LogLevel_Debug;
    this.framework.startUp();
    this.framework.initialize();

    return this.framework.isInitialized();
  }

  /*-------------------
        Load Model
  -------------------*/
  public loadAssets(dir: string, fileName: string): void {
    this._resourceUrl = dir;
    const input = `${this._resourceUrl}${fileName}`;
    fetch(input)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => {
        const setting: ICubismModelSetting = new CubismModelSettingJson(
          arrayBuffer,
          arrayBuffer.byteLength
        );

        this._loadState = LoadStep.LoadModel;

        this.setupModel(setting);
      });
  }

  private setupModel(setting: ICubismModelSetting): void {
    this._updating = true;
    this._initialized = false;

    this._modelSetting = setting;

    // CubismModel
    if (this._modelSetting.getModelFileName() !== "") {
      const modelFileName = this._modelSetting.getModelFileName();

      fetch(`${this._resourceUrl}${modelFileName}`)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          this.loadModel(arrayBuffer);
          this._loadState = LoadStep.LoadExpression;

          // callback
          loadCubismExpression();
        });

      this._loadState = LoadStep.WaitLoadModel;
    } else {
      Pal.printMessage("Model data does not exist.");
    }

    // Expression
    const loadCubismExpression = (): void => {
      if (this._modelSetting === null) {
        return;
      }

      if (this._modelSetting.getExpressionCount() > 0) {
        const count: number = this._modelSetting.getExpressionCount();

        for (let i = 0; i < count; i++) {
          const expressionName = this._modelSetting.getExpressionName(i);
          const expressionFileName =
            this._modelSetting.getExpressionFileName(i);

          fetch(`${this._resourceUrl}${expressionFileName}`)
            .then((response) => response.arrayBuffer())
            .then((arrayBuffer) => {
              const motion: ACubismMotion = this.loadExpression(
                arrayBuffer,
                arrayBuffer.byteLength,
                expressionName
              );

              if (this._expressions.getValue(expressionName) != null) {
                ACubismMotion.delete(
                  this._expressions.getValue(expressionName)
                );

                this._expressions.setValue(expressionName, new CubismMotion()); // null
              }

              this._expressions.setValue(expressionName, motion);

              this._expressionCount++;

              if (this._expressionCount >= count) {
                this._loadState = LoadStep.LoadPhysics;

                // callback
                loadCubismPhysics();
              }
            });
        }
        this._loadState = LoadStep.WaitLoadExpression;
      } else {
        this._loadState = LoadStep.LoadPhysics;

        // callback
        loadCubismPhysics();
      }
    };

    // Physics
    const loadCubismPhysics = (): void => {
      if (this._modelSetting === null) {
        return;
      }

      if (this._modelSetting.getPhysicsFileName() !== "") {
        const physicsFileName = this._modelSetting.getPhysicsFileName();

        fetch(`${this._resourceUrl}${physicsFileName}`)
          .then((response) => response.arrayBuffer())
          .then((arrayBuffer) => {
            this.loadPhysics(arrayBuffer, arrayBuffer.byteLength);

            this._loadState = LoadStep.LoadPose;

            // callback
            loadCubismPose();
          });
        this._loadState = LoadStep.WaitLoadPhysics;
      } else {
        this._loadState = LoadStep.LoadPose;

        // callback
        loadCubismPose();
      }
    };

    // Pose
    const loadCubismPose = (): void => {
      if (this._modelSetting === null) {
        return;
      }

      if (this._modelSetting.getPoseFileName() !== "") {
        const poseFileName = this._modelSetting.getPoseFileName();

        fetch(`${this._resourceUrl}${poseFileName}`)
          .then((response) => response.arrayBuffer())
          .then((arrayBuffer) => {
            this.loadPose(arrayBuffer, arrayBuffer.byteLength);

            this._loadState = LoadStep.SetupEyeBlink;

            // callback
            setupEyeBlink();
          });
        this._loadState = LoadStep.WaitLoadPose;
      } else {
        this._loadState = LoadStep.SetupEyeBlink;

        // callback
        setupEyeBlink();
      }
    };

    // EyeBlink
    const setupEyeBlink = (): void => {
      if (this._modelSetting === null) {
        return;
      }

      if (this._modelSetting.getEyeBlinkParameterCount() > 0) {
        this._eyeBlink = CubismEyeBlink.create(this._modelSetting);
        this._loadState = LoadStep.SetupBreath;
      }

      // callback
      setupBreath();
    };

    // Breath
    const setupBreath = (): void => {
      this._breath = CubismBreath.create();

      const breathParameters: csmVector<BreathParameterData> = new csmVector();
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleX, 0.0, 15.0, 6.5345, 0.5)
      );
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleY, 0.0, 8.0, 3.5345, 0.5)
      );
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleZ, 0.0, 10.0, 5.5345, 0.5)
      );
      breathParameters.pushBack(
        new BreathParameterData(this._idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5)
      );
      breathParameters.pushBack(
        new BreathParameterData(
          CubismFramework.getIdManager().getId(
            CubismDefaultParameterId.ParamBreath
          ),
          0.5,
          0.5,
          3.2345,
          1
        )
      );

      this._breath.setParameters(breathParameters);
      this._loadState = LoadStep.LoadUserData;

      // callback
      loadUserData();
    };

    // UserData
    const loadUserData = (): void => {
      if (this._modelSetting === null) {
        return;
      }

      if (this._modelSetting.getUserDataFile() !== "") {
        const userDataFile = this._modelSetting.getUserDataFile();

        fetch(`${this._resourceUrl}${userDataFile}`)
          .then((response) => response.arrayBuffer())
          .then((arrayBuffer) => {
            this.loadUserData(arrayBuffer, arrayBuffer.byteLength);

            this._loadState = LoadStep.SetupEyeBlinkIds;

            // callback
            setupEyeBlinkIds();
          });

        this._loadState = LoadStep.WaitLoadUserData;
      } else {
        this._loadState = LoadStep.SetupEyeBlinkIds;

        // callback
        setupEyeBlinkIds();
      }
    };

    // EyeBlinkIds
    const setupEyeBlinkIds = (): void => {
      if (this._modelSetting === null) {
        return;
      }

      const eyeBlinkIdCount: number =
        this._modelSetting.getEyeBlinkParameterCount();

      for (let i = 0; i < eyeBlinkIdCount; ++i) {
        this._eyeBlinkIds.pushBack(
          this._modelSetting.getEyeBlinkParameterId(i)
        );
      }

      this._loadState = LoadStep.SetupLipSyncIds;

      // callback
      setupLipSyncIds();
    };

    // LipSyncIds
    const setupLipSyncIds = (): void => {
      if (this._modelSetting === null) {
        return;
      }

      const lipSyncIdCount = this._modelSetting.getLipSyncParameterCount();

      for (let i = 0; i < lipSyncIdCount; ++i) {
        this._lipSyncIds.pushBack(this._modelSetting.getLipSyncParameterId(i));
      }
      this._loadState = LoadStep.SetupLayout;

      // callback
      setupLayout();
    };

    // Layout
    const setupLayout = (): void => {
      const layout: csmMap<string, number> = new csmMap<string, number>();

      if (this._modelSetting == null || this._modelMatrix == null) {
        CubismLogError("Failed to setupLayout().");
        return;
      }

      this._modelSetting.getLayoutMap(layout);
      this._modelMatrix.setupFromLayout(layout);
      this._loadState = LoadStep.LoadMotion;

      // callback
      loadCubismMotion();
    };

    // Motion
    const loadCubismMotion = (): void => {
      if (this._modelSetting === null) {
        return;
      }

      if (gl === null) {
        return;
      }

      this._loadState = LoadStep.WaitLoadMotion;
      this._model.saveParameters();
      this._allMotionCount = 0;
      this._motionCount = 0;
      const group: string[] = [];

      const motionGroupCount: number = this._modelSetting.getMotionGroupCount();

      for (let i = 0; i < motionGroupCount; i++) {
        group[i] = this._modelSetting.getMotionGroupName(i);
        this._allMotionCount += this._modelSetting.getMotionCount(group[i]);
      }

      for (let i = 0; i < motionGroupCount; i++) {
        this.preLoadMotionGroup(group[i]);
      }

      if (motionGroupCount === 0) {
        this._loadState = LoadStep.LoadTexture;

        this._motionManager.stopAllMotions();

        this._updating = false;
        this._initialized = true;

        this.createRenderer();
        this.setupTextures();
        this.getRenderer().startUp(gl);
      }
    };
  }

  private setupTextures(): void {
    if (this._modelSetting === null) {
      return;
    }

    const usePremultiply = true;

    if (this._loadState === LoadStep.LoadTexture) {
      const textureCount: number = this._modelSetting.getTextureCount();

      for (
        let modelTextureNumber = 0;
        modelTextureNumber < textureCount;
        modelTextureNumber++
      ) {
        if (this._modelSetting.getTextureFileName(modelTextureNumber) === "") {
          console.log("getTextureFileName null");
          continue;
        }

        let texturePath =
          this._modelSetting.getTextureFileName(modelTextureNumber);
        texturePath = this._resourceUrl + texturePath;

        const onLoad = (textureInfo: TextureInfo): void => {
          if (textureInfo === null) {
            return;
          }

          if (textureInfo.id === null) {
            return;
          }

          this.getRenderer().bindTexture(modelTextureNumber, textureInfo.id);
          this._textureCount++;

          if (this._textureCount >= textureCount) {
            this._loadState = LoadStep.CompleteSetup;
          }
        };

        Delegate.getInstance()
          .getTextureManager()
          .createTextureFromPngFile(texturePath, usePremultiply, onLoad);
        this.getRenderer().setIsPremultipliedAlpha(usePremultiply);
      }

      this._loadState = LoadStep.WaitLoadTexture;
    }
  }

  public reloadRenderer(): void {
    this.deleteRenderer();
    this.createRenderer();
    this.setupTextures();
  }

  public update(): void {
    if (this._loadState !== LoadStep.CompleteSetup) {
      return;
    }
    if (this._wavFileHandler === null) {
      return;
    }

    const deltaTimeSeconds: number = Pal.getDeltaTime();
    this._userTimeSeconds += deltaTimeSeconds;

    this._dragManager.update(deltaTimeSeconds);
    this._dragX = this._dragManager.getX();
    this._dragY = this._dragManager.getY();

    let motionUpdated = false;

    this._model.loadParameters();
    if (this._motionManager.isFinished()) {
      this.startRandomMotion(Define.MotionGroupIdle, Define.PriorityIdle);
    } else {
      motionUpdated = this._motionManager.updateMotion(
        this._model,
        deltaTimeSeconds
      );
    }
    this._model.saveParameters();

    if (!motionUpdated) {
      if (this._eyeBlink != null) {
        this._eyeBlink.updateParameters(this._model, deltaTimeSeconds); // 目パチ
      }
    }

    if (this._expressionManager != null) {
      this._expressionManager.updateMotion(this._model, deltaTimeSeconds); // 表情でパラメータ更新（相対変化）
    }

    this._model.addParameterValueById(this._idParamAngleX, this._dragX * 30); // -30から30の値を加える
    this._model.addParameterValueById(this._idParamAngleY, this._dragY * 30);
    this._model.addParameterValueById(
      this._idParamAngleZ,
      this._dragX * this._dragY * -30
    );

    this._model.addParameterValueById(
      this._idParamBodyAngleX,
      this._dragX * 10
    );

    this._model.addParameterValueById(this._idParamEyeBallX, this._dragX); // -1から1の値を加える
    this._model.addParameterValueById(this._idParamEyeBallY, this._dragY);

    if (this._breath != null) {
      this._breath.updateParameters(this._model, deltaTimeSeconds);
    }

    if (this._physics != null) {
      this._physics.evaluate(this._model, deltaTimeSeconds);
    }

    if (this._lipsync) {
      let value = 0.0;

      this._wavFileHandler.update(deltaTimeSeconds);
      value = this._wavFileHandler.getRms();

      for (let i = 0; i < this._lipSyncIds.getSize(); ++i) {
        this._model.addParameterValueById(this._lipSyncIds.at(i), value, 0.8);
      }
    }

    if (this._pose != null) {
      this._pose.updateParameters(this._model, deltaTimeSeconds);
    }

    this._model.update();
  }

  public startMotion(
    group: string,
    no: number,
    priority: number,
    onFinishedMotionHandler?: FinishedMotionCallback
  ): CubismMotionQueueEntryHandle {
    if (this._modelSetting === null || this._wavFileHandler === null) {
      return InvalidMotionQueueEntryHandleValue;
    }

    if (priority === Define.PriorityForce) {
      this._motionManager.setReservePriority(priority);
    } else if (!this._motionManager.reserveMotion(priority)) {
      if (this._debugMode) {
        Pal.printMessage("[APP]can't start motion.");
      }
      return InvalidMotionQueueEntryHandleValue;
    }

    const motionFileName = this._modelSetting.getMotionFileName(group, no);

    // ex) idle_0
    const name = `${group}_${no}`;
    let motion: CubismMotion = this._motions.getValue(name) as CubismMotion;
    let autoDelete = false;

    if (motion === null) {
      fetch(`${this._resourceUrl}${motionFileName}`)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          motion = this.loadMotion(
            arrayBuffer,
            arrayBuffer.byteLength,
            "", // null
            onFinishedMotionHandler
          );
          if (this._modelSetting === null) {
            return;
          }
          let fadeTime: number = this._modelSetting.getMotionFadeInTimeValue(
            group,
            no
          );

          if (fadeTime >= 0.0) {
            motion.setFadeInTime(fadeTime);
          }

          fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, no);
          if (fadeTime >= 0.0) {
            motion.setFadeOutTime(fadeTime);
          }

          motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
          autoDelete = true;
        });
    } else {
      motion.setFinishedMotionHandler(
        onFinishedMotionHandler as FinishedMotionCallback
      );
    }

    //voice
    const voice = this._modelSetting.getMotionSoundFileName(group, no);
    if (voice.localeCompare("") !== 0) {
      let path = voice;
      path = this._resourceUrl + path;
      this._wavFileHandler.start(path);
    }

    if (this._debugMode) {
      Pal.printMessage(`[APP]start motion: [${group}_${no}`);
    }
    return this._motionManager.startMotionPriority(
      motion,
      autoDelete,
      priority
    );
  }

  public startRandomMotion(
    group: string,
    priority: number,
    onFinishedMotionHandler?: FinishedMotionCallback
  ): CubismMotionQueueEntryHandle {
    if (this._modelSetting === null) {
      return;
    }

    if (this._modelSetting.getMotionCount(group) === 0) {
      return InvalidMotionQueueEntryHandleValue;
    }

    const no: number = Math.floor(
      Math.random() * this._modelSetting.getMotionCount(group)
    );

    return this.startMotion(group, no, priority, onFinishedMotionHandler);
  }

  public setExpression(expressionId: string): void {
    const motion: ACubismMotion = this._expressions.getValue(expressionId);

    if (this._debugMode) {
      Pal.printMessage(`[APP]expression: [${expressionId}]`);
    }

    if (motion != null) {
      this._expressionManager.startMotionPriority(
        motion,
        false,
        Define.PriorityForce
      );
    } else {
      if (this._debugMode) {
        Pal.printMessage(`[APP]expression[${expressionId}] is null`);
      }
    }
  }

  public setRandomExpression(): void {
    if (this._expressions.getSize() === 0) {
      return;
    }

    const no: number = Math.floor(Math.random() * this._expressions.getSize());

    for (let i = 0; i < this._expressions.getSize(); i++) {
      if (i === no) {
        const name: string = this._expressions._keyValues[i].first;
        this.setExpression(name);
        return;
      }
    }
  }

  public motionEventFired(eventValue: csmString): void {
    CubismLogInfo("{0} is fired on Model!!", eventValue.s);
  }

  public hitTest(hitArenaName: string, x: number, y: number): boolean {
    if (this._modelSetting === null) {
      return false;
    }

    if (this._opacity < 1) {
      return false;
    }

    const count: number = this._modelSetting.getHitAreasCount();

    for (let i = 0; i < count; i++) {
      if (this._modelSetting.getHitAreaName(i) === hitArenaName) {
        const drawId: CubismIdHandle = this._modelSetting.getHitAreaId(i);
        return this.isHit(drawId, x, y);
      }
    }

    return false;
  }

  public preLoadMotionGroup(group: string): void {
    if (this._modelSetting === null) {
      return;
    }

    for (let i = 0; i < this._modelSetting.getMotionCount(group); i++) {
      const motionFileName = this._modelSetting.getMotionFileName(group, i);

      // ex) idle_0
      const name = `${group}_${i}`;
      if (this._debugMode) {
        Pal.printMessage(`[APP]load motion: ${motionFileName} => [${name}]`);
      }

      fetch(`${this._resourceUrl}${motionFileName}`)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          if (this._modelSetting === null) {
            return;
          }

          if (gl === null) {
            return;
          }

          const tmpMotion: CubismMotion = this.loadMotion(
            arrayBuffer,
            arrayBuffer.byteLength,
            name
          );

          let fadeTime = this._modelSetting.getMotionFadeInTimeValue(group, i);
          if (fadeTime >= 0.0) {
            tmpMotion.setFadeInTime(fadeTime);
          }

          fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, i);
          if (fadeTime >= 0.0) {
            tmpMotion.setFadeOutTime(fadeTime);
          }
          tmpMotion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);

          if (this._motions.getValue(name) != null) {
            ACubismMotion.delete(this._motions.getValue(name));
          }

          this._motions.setValue(name, tmpMotion);

          this._motionCount++;
          if (this._motionCount >= this._allMotionCount) {
            this._loadState = LoadStep.LoadTexture;

            this._motionManager.stopAllMotions();

            this._updating = false;
            this._initialized = true;

            this.createRenderer();
            this.setupTextures();

            this.getRenderer().startUp(gl);
          }
        });
    }
  }

  public releaseMotions(): void {
    this._motions.clear();
  }

  public releaseExpressions(): void {
    this._expressions.clear();
  }

  public doDraw(): void {
    if (this._model === null) {
      return;
    }
    if (canvas === null) {
      return;
    }

    // if (frameBuffer === null) {
    //   return;
    // }

    const viewport: number[] = [0, 0, canvas.width, canvas.height];

    this.getRenderer().setRenderState(frameBuffer!, viewport);
    this.getRenderer().drawModel();
  }

  public draw(matrix: CubismMatrix44): void {
    if (this._model == null) {
      return;
    }

    if (this._loadState === LoadStep.CompleteSetup) {
      matrix.multiplyByMatrix(this._modelMatrix);

      this.getRenderer().setMvpMatrix(matrix);

      this.doDraw();
    }
  }
}
