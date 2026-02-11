export class FullscreenQuad {
  private gl: WebGL2RenderingContext
  private vao: WebGLVertexArrayObject
  private vertexBuffer: WebGLBuffer

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    
    // Create vertex array object
    const vao = gl.createVertexArray()
    if (!vao) {
      throw new Error('Failed to create vertex array object')
    }
    this.vao = vao

    // Create vertex buffer
    const vertexBuffer = gl.createBuffer()
    if (!vertexBuffer) {
      throw new Error('Failed to create vertex buffer')
    }
    this.vertexBuffer = vertexBuffer

    this.setupGeometry()
  }

  private setupGeometry(): void {
    const gl = this.gl

    // Fullscreen quad vertices (position and texture coordinates)
    // Two triangles forming a quad that covers the entire screen
    const vertices = new Float32Array([
      // Triangle 1
      -1, -1, 0, 0,  // Bottom-left
       1, -1, 1, 0,  // Bottom-right
      -1,  1, 0, 1,  // Top-left
      
      // Triangle 2
      -1,  1, 0, 1,  // Top-left
       1, -1, 1, 0,  // Bottom-right
       1,  1, 1, 1   // Top-right
    ])

    gl.bindVertexArray(this.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    // Position attribute (location 0)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 4 * 4, 0)

    // Texture coordinate attribute (location 1)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 4 * 4, 2 * 4)

    gl.bindVertexArray(null)
  }

  public render(): void {
    const gl = this.gl
    gl.bindVertexArray(this.vao)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindVertexArray(null)
  }

  public destroy(): void {
    const gl = this.gl
    gl.deleteVertexArray(this.vao)
    gl.deleteBuffer(this.vertexBuffer)
  }
}
