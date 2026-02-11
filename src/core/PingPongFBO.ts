export interface FBOOptions {
  width: number
  height: number
  format?: number
  type?: number
  filter?: number
  wrap?: number
}

export class PingPongFBO {
  private gl: WebGL2RenderingContext
  private fbos: WebGLFramebuffer[] = []
  private textures: WebGLTexture[] = []
  private width: number
  private height: number
  private currentIndex = 0

  constructor(gl: WebGL2RenderingContext, options: FBOOptions) {
    this.gl = gl
    this.width = options.width
    this.height = options.height
    
    const format = options.format || gl.RGBA
    const type = options.type || gl.UNSIGNED_BYTE
    const filter = options.filter || gl.LINEAR
    const wrap = options.wrap || gl.CLAMP_TO_EDGE

    // Create two framebuffers for ping-pong rendering
    for (let i = 0; i < 2; i++) {
      const fbo = gl.createFramebuffer()
      const texture = gl.createTexture()

      if (!fbo || !texture) {
        throw new Error('Failed to create framebuffer or texture')
      }

      // Setup texture
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, format, this.width, this.height, 0, format, type, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap)

      // Setup framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

      // Check framebuffer completeness
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error('Framebuffer is not complete')
      }

      this.fbos.push(fbo)
      this.textures.push(texture)
    }

    // Unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  public bind(): void {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[this.currentIndex])
    gl.viewport(0, 0, this.width, this.height)
  }

  public unbind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
  }

  public swap(): void {
    this.currentIndex = 1 - this.currentIndex
  }

  public getCurrentTexture(): WebGLTexture {
    return this.textures[this.currentIndex]
  }

  public getPreviousTexture(): WebGLTexture {
    return this.textures[1 - this.currentIndex]
  }

  public bindCurrentTexture(unit: number = 0): void {
    const gl = this.gl
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, this.getCurrentTexture())
  }

  public bindPreviousTexture(unit: number = 0): void {
    const gl = this.gl
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, this.getPreviousTexture())
  }

  public resize(width: number, height: number): void {
    if (width === this.width && height === this.height) {
      return
    }

    this.width = width
    this.height = height

    const gl = this.gl

    for (let i = 0; i < this.textures.length; i++) {
      gl.bindTexture(gl.TEXTURE_2D, this.textures[i])
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    }

    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  public clear(r = 0, g = 0, b = 0, a = 1): void {
    const gl = this.gl
    
    for (const fbo of this.fbos) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.clearColor(r, g, b, a)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  public destroy(): void {
    const gl = this.gl
    
    this.fbos.forEach(fbo => gl.deleteFramebuffer(fbo))
    this.textures.forEach(texture => gl.deleteTexture(texture))
    
    this.fbos = []
    this.textures = []
  }
}
