export enum GLError {
  // static method
  // operate matrix
  NoMatrix = "No Matrix",

  // Initialize
  Initialized = "GL Class is initialized",
  NotInitialized = "GL Class is Init failed",
  NullCanvas = "Canvas is null",
  NullWebGL = "WebGL is null",
  CanvasSizeRange = "Canvas Size must be bigger than 0.",

  // Shader
  ShaderSourceEmpty = "Vertex Shader Source or Fragment Shader Source is empty",
  ShaderCreateFailed = "Shader create failed",

  // Program & Buffer
  UploadProgramFailed = "Upload Program failed",
  BufferCreateFailed = "Buffer Create failed",
  BufferRangeOverflow = "Buffer Range Overflow. Buffer member must be from 0 to 1.",

  // Texture
  TextureCreateFailed = "Texture Create Failed",
}
