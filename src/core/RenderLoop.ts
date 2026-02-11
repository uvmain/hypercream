export type RenderCallback = () => void

export class RenderLoop {
  private callback: RenderCallback
  private isRunning = false
  private animationId: number | null = null
  private lastTime = 0
  private frameCount = 0
  private fpsCallback?: (fps: number) => void

  constructor(callback: RenderCallback) {
    this.callback = callback
  }

  public start(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.lastTime = performance.now()
    this.frameCount = 0
    this.tick()
  }

  public stop(): void {
    this.isRunning = false
    
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  public setFPSCallback(callback: (fps: number) => void): void {
    this.fpsCallback = callback
  }

  private tick = (): void => {
    if (!this.isRunning) {
      return
    }

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime

    // Calculate FPS every second
    this.frameCount++
    if (deltaTime >= 1000) {
      const fps = this.frameCount / (deltaTime / 1000)
      this.frameCount = 0
      this.lastTime = currentTime
      
      if (this.fpsCallback) {
        this.fpsCallback(fps)
      }
    }

    // Execute the render callback
    try {
      this.callback()
    } catch (error) {
      console.error('Render callback error:', error)
    }

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.tick)
  }

  public isActive(): boolean {
    return this.isRunning
  }
}
