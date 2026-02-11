import type { Preset } from './presets/Preset'
import { AudioAnalyzer } from './audio/AudioAnalyzer'
import { BeatDetector } from './audio/BeatDetector'
import { GLContext } from './core/GLContext'
import { RenderLoop } from './core/RenderLoop'
import { PresetRunner } from './presets/PresetRunner'

export interface VisualizerConfig {
  canvas?: HTMLCanvasElement
  width?: number
  height?: number
  audioElement?: HTMLAudioElement
}

export class Visualizer {
  private glContext: GLContext
  private renderLoop: RenderLoop
  private audioAnalyzer: AudioAnalyzer
  private beatDetector: BeatDetector
  private presetRunner: PresetRunner
  private canvas: HTMLCanvasElement

  constructor(config: VisualizerConfig = {}) {
    // Create canvas if not provided
    this.canvas = config.canvas || document.createElement('canvas')
    this.canvas.width = config.width ?? 800
    this.canvas.height = config.height ?? 600

    // Initialize WebGL context
    this.glContext = new GLContext(this.canvas)

    // Initialize audio analysis
    this.audioAnalyzer = new AudioAnalyzer()
    this.beatDetector = new BeatDetector(this.audioAnalyzer)

    // Initialize preset system
    this.presetRunner = new PresetRunner(this.glContext)

    // Initialize render loop
    this.renderLoop = new RenderLoop(() => this.render())

    // Connect audio element if provided
    if (config.audioElement) {
      this.connectAudio(config.audioElement)
    }
  }

  public connectAudio(audioElement: HTMLAudioElement): void {
    this.audioAnalyzer.connectAudio(audioElement)
  }

  public loadPreset(preset: Preset): void {
    this.presetRunner.loadPreset(preset)
  }

  public start(): void {
    this.renderLoop.start()
  }

  public stop(): void {
    this.renderLoop.stop()
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.glContext.resize(width, height)
  }

  private render(): void {
    // Update audio analysis
    this.audioAnalyzer.update()
    this.beatDetector.update()

    // Get audio data for preset
    const audioData = {
      spectrum: this.audioAnalyzer.getSpectrum(),
      waveform: this.audioAnalyzer.getWaveform(),
      energy: this.audioAnalyzer.getEnergy(),
      beat: this.beatDetector.isBeat(),
      bass: this.audioAnalyzer.getBass(),
      treble: this.audioAnalyzer.getTreble(),
    }

    // Render current preset
    this.presetRunner.render(audioData)
  }

  public async destroy(): Promise<void> {
    this.renderLoop.stop()
    await this.audioAnalyzer.destroy()
    this.glContext.destroy()
  }
}
