export interface UniformValue {
  type: 'float' | 'int' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'sampler2D'
  value: number | number[] | WebGLTexture
}

export class Program {
  private gl: WebGL2RenderingContext
  private program: WebGLProgram
  private uniforms: Map<string, WebGLUniformLocation> = new Map()
  private attributes: Map<string, number> = new Map()

  constructor(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
    this.gl = gl
    this.program = this.createProgram(vertexSource, fragmentSource)
    this.discoverUniforms()
    this.discoverAttributes()
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const gl = this.gl

    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource)

    const program = gl.createProgram()
    if (!program) {
      throw new Error('Failed to create shader program')
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program)
      gl.deleteProgram(program)
      throw new Error(`Shader program linking failed: ${info}`)
    }

    // Clean up shaders
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    return program
  }

  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl
    const shader = gl.createShader(type)
    
    if (!shader) {
      throw new Error('Failed to create shader')
    }

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader)
      gl.deleteShader(shader)
      throw new Error(`Shader compilation failed: ${info}`)
    }

    return shader
  }

  private discoverUniforms(): void {
    const gl = this.gl
    const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS)

    for (let i = 0; i < uniformCount; i++) {
      const uniformInfo = gl.getActiveUniform(this.program, i)
      if (uniformInfo) {
        const location = gl.getUniformLocation(this.program, uniformInfo.name)
        if (location) {
          this.uniforms.set(uniformInfo.name, location)
        }
      }
    }
  }

  private discoverAttributes(): void {
    const gl = this.gl
    const attributeCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES)

    for (let i = 0; i < attributeCount; i++) {
      const attributeInfo = gl.getActiveAttrib(this.program, i)
      if (attributeInfo) {
        const location = gl.getAttribLocation(this.program, attributeInfo.name)
        this.attributes.set(attributeInfo.name, location)
      }
    }
  }

  public use(): void {
    this.gl.useProgram(this.program)
  }

  public setUniform(name: string, uniform: UniformValue): void {
    const location = this.uniforms.get(name)
    if (!location) {
      console.warn(`Uniform '${name}' not found in shader program`)
      return
    }

    const gl = this.gl

    switch (uniform.type) {
      case 'float':
        gl.uniform1f(location, uniform.value as number)
        break
      case 'int':
        gl.uniform1i(location, uniform.value as number)
        break
      case 'vec2':
        const vec2 = uniform.value as number[]
        gl.uniform2f(location, vec2[0], vec2[1])
        break
      case 'vec3':
        const vec3 = uniform.value as number[]
        gl.uniform3f(location, vec3[0], vec3[1], vec3[2])
        break
      case 'vec4':
        const vec4 = uniform.value as number[]
        gl.uniform4f(location, vec4[0], vec4[1], vec4[2], vec4[3])
        break
      case 'mat3':
        gl.uniformMatrix3fv(location, false, uniform.value as Float32Array)
        break
      case 'mat4':
        gl.uniformMatrix4fv(location, false, uniform.value as Float32Array)
        break
      case 'sampler2D':
        // Texture unit binding is handled externally
        gl.uniform1i(location, uniform.value as number)
        break
    }
  }

  public getAttributeLocation(name: string): number {
    return this.attributes.get(name) ?? -1
  }

  public getUniformLocation(name: string): WebGLUniformLocation | null {
    return this.uniforms.get(name) ?? null
  }

  public destroy(): void {
    this.gl.deleteProgram(this.program)
    this.uniforms.clear()
    this.attributes.clear()
  }
}
