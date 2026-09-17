export const ipcGeneratorConfig = {
  input: 'api/openapi.yaml',
  outputDirectory: 'src/shared/api/generated',
  rendererOutputDirectory: 'src/renderer/src/api/generated',
  rendererBarrel: 'src/renderer/src/api/index.ts'
} as const
