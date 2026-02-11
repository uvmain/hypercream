import { Preset, PresetBuilder } from './Preset'

export class PresetLoader {
  private loadedPresets: Map<string, Preset> = new Map()

  public async loadFromJSON(data: any): Promise<Preset> {
    try {
      const preset = PresetBuilder.create()
        .setMetadata(data.metadata)
        .setShaders(data.shaders)
        
      if (data.uniforms) {
        preset.setUniforms(data.uniforms)
      }
      
      return preset.build()
    } catch (error) {
      throw new Error(`Failed to load preset from JSON: ${error}`)
    }
  }

  public async loadFromURL(url: string): Promise<Preset> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      return this.loadFromJSON(data)
    } catch (error) {
      throw new Error(`Failed to load preset from URL ${url}: ${error}`)
    }
  }

  public createBuiltinPreset(name: string, fragmentShader: string): Preset {
    return PresetBuilder.create()
      .setMetadata({
        name: name,
        author: 'HyperCream',
        description: `Built-in ${name} preset`,
        version: '1.0.0',
        tags: ['builtin']
      })
      .setShaders({
        fragment: fragmentShader
      })
      .build()
  }

  public registerPreset(id: string, preset: Preset): void {
    this.loadedPresets.set(id, preset)
  }

  public getPreset(id: string): Preset | undefined {
    return this.loadedPresets.get(id)
  }

  public listPresets(): string[] {
    return Array.from(this.loadedPresets.keys())
  }

  public removePreset(id: string): boolean {
    return this.loadedPresets.delete(id)
  }

  public clear(): void {
    this.loadedPresets.clear()
  }
}
