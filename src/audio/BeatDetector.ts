import { AudioAnalyzer } from './AudioAnalyzer'

export interface BeatDetectionConfig {
  threshold: number
  minimumInterval: number
  energyHistory: number
  varianceThreshold: number
}

export class BeatDetector {
  private audioAnalyzer: AudioAnalyzer
  private config: BeatDetectionConfig
  private energyHistory: number[] = []
  private lastBeatTime = 0
  private isCurrentlyBeat = false

  constructor(
    audioAnalyzer: AudioAnalyzer,
    config: Partial<BeatDetectionConfig> = {}
  ) {
    this.audioAnalyzer = audioAnalyzer
    this.config = {
      threshold: 1.3,        // Energy must be 30% above average
      minimumInterval: 300,  // Minimum 300ms between beats
      energyHistory: 43,     // Keep ~1 second of history at 43 FPS
      varianceThreshold: 0.1, // Minimum variance to detect beats
      ...config
    }
  }

  public update(): void {
    const currentTime = performance.now()
    const energy = this.audioAnalyzer.getEnergy()
    
    // Add current energy to history
    this.energyHistory.push(energy)
    
    // Keep history at specified length
    if (this.energyHistory.length > this.config.energyHistory) {
      this.energyHistory.shift()
    }
    
    // Need enough history to detect beats
    if (this.energyHistory.length < this.config.energyHistory) {
      this.isCurrentlyBeat = false
      return
    }
    
    // Calculate average energy over history
    const averageEnergy = this.energyHistory.reduce((sum, e) => sum + e, 0) / this.energyHistory.length
    
    // Calculate variance to ensure we have dynamic audio
    const variance = this.calculateVariance(this.energyHistory, averageEnergy)
    
    // Check if enough time has passed since last beat
    const timeSinceLastBeat = currentTime - this.lastBeatTime
    const enoughTimeElapsed = timeSinceLastBeat >= this.config.minimumInterval
    
    // Detect beat: energy above threshold and enough variance
    const energyThresholdMet = energy > averageEnergy * this.config.threshold
    const varianceThresholdMet = variance > this.config.varianceThreshold
    
    if (energyThresholdMet && varianceThresholdMet && enoughTimeElapsed) {
      this.isCurrentlyBeat = true
      this.lastBeatTime = currentTime
    } else {
      this.isCurrentlyBeat = false
    }
  }

  public isBeat(): boolean {
    return this.isCurrentlyBeat
  }

  public getBeatStrength(): number {
    if (this.energyHistory.length < this.config.energyHistory) {
      return 0
    }
    
    const currentEnergy = this.audioAnalyzer.getEnergy()
    const averageEnergy = this.energyHistory.reduce((sum, e) => sum + e, 0) / this.energyHistory.length
    
    if (averageEnergy === 0) return 0
    
    return Math.max(0, (currentEnergy - averageEnergy) / averageEnergy)
  }

  public getTimeSinceLastBeat(): number {
    return performance.now() - this.lastBeatTime
  }

  public setBeatThreshold(threshold: number): void {
    this.config.threshold = threshold
  }

  public setMinimumInterval(interval: number): void {
    this.config.minimumInterval = interval
  }

  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0
    
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2))
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
    
    return Math.sqrt(avgSquaredDiff)
  }

  public reset(): void {
    this.energyHistory = []
    this.lastBeatTime = 0
    this.isCurrentlyBeat = false
  }
}
