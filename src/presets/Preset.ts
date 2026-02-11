export interface PresetUniforms {
  [key: string]: {
    type: 'float' | 'vec2' | 'vec3' | 'vec4'
    value: number | number[]
    min?: number
    max?: number
    step?: number
    description?: string
  }
}

export interface PresetShaders {
  vertex?: string
  fragment: string
}

export interface PresetMetadata {
  name: string
  author: string
  description?: string
  version?: string
  tags?: string[]
  createdAt?: string
}

export interface Preset {
  metadata: PresetMetadata
  shaders: PresetShaders
  uniforms?: PresetUniforms

  // Optional initialization and update functions
  init?: (gl: WebGL2RenderingContext) => void
  update?: (audioData: any, time: number, frame: number) => void
  destroy?: () => void
}

export class PresetBuilder {
  private preset: Partial<Preset> = {}

  public setMetadata(metadata: PresetMetadata): this {
    this.preset.metadata = metadata
    return this
  }

  public setShaders(shaders: PresetShaders): this {
    this.preset.shaders = shaders
    return this
  }

  public setUniforms(uniforms: PresetUniforms): this {
    this.preset.uniforms = uniforms
    return this
  }

  public setInitFunction(init: (gl: WebGL2RenderingContext) => void): this {
    this.preset.init = init
    return this
  }

  public setUpdateFunction(update: (audioData: any, time: number, frame: number) => void): this {
    this.preset.update = update
    return this
  }

  public setDestroyFunction(destroy: () => void): this {
    this.preset.destroy = destroy
    return this
  }

  public build(): Preset {
    if (!this.preset.metadata) {
      throw new Error('Preset metadata is required')
    }

    if (!this.preset.shaders) {
      throw new Error('Preset shaders are required')
    }

    return this.preset as Preset
  }

  public static create(): PresetBuilder {
    return new PresetBuilder()
  }
}
