export interface AudioData {
  spectrum: Uint8Array
  waveform: Uint8Array
  energy: number
  bass: number
  treble: number
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null
  private analyzerNode: AnalyserNode | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private spectrumData: Uint8Array<ArrayBuffer>
  private waveformData: Uint8Array<ArrayBuffer>
  private fftSize: number
  private smoothingTimeConstant: number

  constructor(fftSize = 2048, smoothingTimeConstant = 0.8) {
    this.fftSize = fftSize
    this.smoothingTimeConstant = smoothingTimeConstant
    this.spectrumData = new Uint8Array(fftSize / 2)
    this.waveformData = new Uint8Array(fftSize)
  }

  public connectAudio(audioElement: HTMLAudioElement): void {
    try {
      // Create audio context
      try {
        const AudioCtx = window.AudioContext ?? (typeof window !== 'undefined' && 'webkitAudioContext' in window ? window.webkitAudioContext : undefined)
        this.audioContext = new AudioCtx()
      }
      catch {
        throw new Error('Web Audio API is not supported in this browser')
      }

      // Create analyzer node
      this.analyzerNode = this.audioContext.createAnalyser()
      this.analyzerNode.fftSize = this.fftSize
      this.analyzerNode.smoothingTimeConstant = this.smoothingTimeConstant

      // Create source from audio element
      this.sourceNode = this.audioContext.createMediaElementSource(audioElement)

      // Connect: source -> analyzer -> destination
      this.sourceNode.connect(this.analyzerNode)
      this.analyzerNode.connect(this.audioContext.destination)

      console.log('Audio analyzer connected successfully')
    }
    catch (error) {
      console.error('Failed to connect audio analyzer:', error)
    }
  }

  public update(): void {
    if (!this.analyzerNode) {
      // Fill with silence if no audio connected
      this.spectrumData.fill(0)
      this.waveformData.fill(0)
      return
    }

    // Get frequency domain data (spectrum) - use Uint8Array version
    this.analyzerNode.getByteFrequencyData(this.spectrumData)

    // Get time domain data (waveform) - use Uint8Array version
    this.analyzerNode.getByteTimeDomainData(this.waveformData)
  }

  public getSpectrum(): Uint8Array {
    return this.spectrumData
  }

  public getWaveform(): Uint8Array {
    return this.waveformData
  }

  public getEnergy(): number {
    if (!this.spectrumData.length)
      return 0

    let energy = 0
    for (let i = 0; i < this.spectrumData.length; i++) {
      // Uint8Array values are 0-255, normalize to 0-1
      const value = this.spectrumData[i] / 255.0
      energy += value * value
    }

    return Math.sqrt(energy / this.spectrumData.length)
  }

  public getBass(): number {
    if (!this.spectrumData.length)
      return 0

    // Bass frequencies: roughly 20-250 Hz
    // For 44.1kHz sample rate and 2048 FFT size:
    // Frequency resolution = 44100 / 2048 ≈ 21.5 Hz per bin
    // Bass range: bins 1-12 (21.5Hz - 258Hz)
    const bassEnd = Math.min(12, this.spectrumData.length)

    let bass = 0
    for (let i = 1; i < bassEnd; i++) {
      const value = this.spectrumData[i] / 255.0
      bass += value * value
    }

    return Math.sqrt(bass / bassEnd)
  }

  public getTreble(): number {
    if (!this.spectrumData.length)
      return 0

    // Treble frequencies: roughly 4kHz and up
    // For 44.1kHz sample rate and 2048 FFT size:
    // 4kHz ≈ bin 186, we'll use the top quarter of the spectrum
    const trebleStart = Math.floor(this.spectrumData.length * 0.75)
    const trebleEnd = this.spectrumData.length

    let treble = 0
    for (let i = trebleStart; i < trebleEnd; i++) {
      const value = this.spectrumData[i] / 255.0
      treble += value * value
    }

    return Math.sqrt(treble / (trebleEnd - trebleStart))
  }

  public getFrequencyBin(frequency: number): number {
    if (!this.audioContext)
      return 0

    const sampleRate = this.audioContext.sampleRate
    const binSize = sampleRate / this.fftSize
    const bin = Math.floor(frequency / binSize)

    return Math.min(bin, this.spectrumData.length - 1)
  }

  public getFrequencyValue(frequency: number): number {
    const bin = this.getFrequencyBin(frequency)
    return this.spectrumData[bin] || 0
  }

  public async destroy(): Promise<void> {
    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }

    if (this.analyzerNode) {
      this.analyzerNode.disconnect()
      this.analyzerNode = null
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close()
      this.audioContext = null
    }
  }
}
