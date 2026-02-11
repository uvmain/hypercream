import type { VisualizerConfig } from './Visualizer'
import { Visualizer } from './Visualizer'

export { AudioAnalyzer } from './audio/AudioAnalyzer'
export type { AudioData } from './audio/AudioAnalyzer'
export { BeatDetector } from './audio/BeatDetector'
export type { BeatDetectionConfig } from './audio/BeatDetector'
export { FullscreenQuad } from './core/FullscreenQuad'
export { GLContext } from './core/GLContext'
export { PingPongFBO } from './core/PingPongFBO'
export type { FBOOptions } from './core/PingPongFBO'
export { Program } from './core/Program'
export type { UniformValue } from './core/Program'
export { RenderLoop } from './core/RenderLoop'
export type { RenderCallback } from './core/RenderLoop'
export { simpleSpectrum } from './presets/builtins/simpleSpectrum'
export { PresetLoader } from './presets/loader'
export { PresetBuilder } from './presets/Preset'
export type { Preset, PresetMetadata, PresetShaders, PresetUniforms } from './presets/Preset'
export { PresetRunner } from './presets/PresetRunner'
export { Visualizer } from './Visualizer'
export type { VisualizerConfig } from './Visualizer'

export function createVisualizer(config?: VisualizerConfig): Visualizer {
  return new Visualizer(config)
}
