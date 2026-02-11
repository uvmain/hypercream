export class GLContext {
  public readonly gl: WebGL2RenderingContext
  private canvas: HTMLCanvasElement
  private extensions: Map<string, any> = new Map()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance'
    })

    if (!gl) {
      throw new Error('WebGL2 is not supported in this browser')
    }

    this.gl = gl
    this.initializeExtensions()
    this.setupInitialState()
  }

  private initializeExtensions(): void {
    const extensionNames = [
      'EXT_color_buffer_float',
      'OES_texture_float_linear',
      'EXT_texture_filter_anisotropic'
    ]

    extensionNames.forEach(name => {
      const ext = this.gl.getExtension(name)
      if (ext) {
        this.extensions.set(name, ext)
      }
    })
  }

  private setupInitialState(): void {
    const gl = this.gl
    
    // Set viewport
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    
    // Disable depth testing (2D rendering)
    gl.disable(gl.DEPTH_TEST)
    
    // Enable blending for transparency effects
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    
    // Clear color
    gl.clearColor(0, 0, 0, 1)
  }

  public getExtension(name: string): any {
    return this.extensions.get(name)
  }

  public hasExtension(name: string): boolean {
    return this.extensions.has(name)
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.gl.viewport(0, 0, width, height)
  }

  public clear(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  public getMaxTextureSize(): number {
    return this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE)
  }

  public destroy(): void {
    // WebGL context cleanup is handled by the browser
    // Just clear our references
    this.extensions.clear()
  }
}
