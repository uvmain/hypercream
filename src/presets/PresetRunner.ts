import { GLContext } from '../core/GLContext'
import { Program } from '../core/Program'
import { FullscreenQuad } from '../core/FullscreenQuad'
import { PingPongFBO } from '../core/PingPongFBO'
import { Preset } from './Preset'

export interface AudioData {
  spectrum: Uint8Array
  waveform: Uint8Array
  energy: number
  beat: boolean
  bass: number
  treble: number
}

export class PresetRunner {
  private glContext: GLContext
  private gl: WebGL2RenderingContext
  private fullscreenQuad: FullscreenQuad
  private pingPongFBO: PingPongFBO
  private currentProgram: Program | null = null
  private currentPreset: Preset | null = null
  
  private startTime = performance.now()
  private frameCount = 0
  private audioTexture: WebGLTexture | null = null
  private spectrumTexture: WebGLTexture | null = null

  constructor(glContext: GLContext) {
    this.glContext = glContext
    this.gl = glContext.gl
    this.fullscreenQuad = new FullscreenQuad(this.gl)
    
    // Create ping-pong framebuffer for feedback effects
    this.pingPongFBO = new PingPongFBO(this.gl, {
      width: this.gl.canvas.width,
      height: this.gl.canvas.height,
      format: this.gl.RGBA,
      type: this.gl.UNSIGNED_BYTE,
      filter: this.gl.LINEAR
    })
    
    this.initializeAudioTextures()
  }

  private initializeAudioTextures(): void {
    const gl = this.gl

    // Create texture for spectrum data
    this.spectrumTexture = gl.createTexture()
    if (this.spectrumTexture) {
      gl.bindTexture(gl.TEXTURE_2D, this.spectrumTexture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }

    // Create texture for waveform data
    this.audioTexture = gl.createTexture()
    if (this.audioTexture) {
      gl.bindTexture(gl.TEXTURE_2D, this.audioTexture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }

    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  public loadPreset(preset: Preset): void {
    // Clean up previous preset
    if (this.currentPreset?.destroy) {
      this.currentPreset.destroy()
    }
    
    if (this.currentProgram) {
      this.currentProgram.destroy()
      this.currentProgram = null
    }

    this.currentPreset = preset

    try {
      // Create shader program
      const vertexShader = preset.shaders.vertex || this.getDefaultVertexShader()
      const fragmentShader = preset.shaders.fragment
      
      this.currentProgram = new Program(this.gl, vertexShader, fragmentShader)
      
      // Initialize preset if it has an init function
      if (preset.init) {
        preset.init(this.gl)
      }
      
      // Reset timing
      this.startTime = performance.now()
      this.frameCount = 0
      
      console.log(`Loaded preset: ${preset.metadata.name} by ${preset.metadata.author}`)
    } catch (error) {
      console.error('Failed to load preset:', error)
      this.currentPreset = null
    }
  }

  public render(audioData: AudioData): void {
    if (!this.currentProgram || !this.currentPreset) {
      this.renderBlank()
      return
    }

    const gl = this.gl
    const currentTime = (performance.now() - this.startTime) / 1000
    
    // Update audio textures
    this.updateAudioTextures(audioData)
    
    // Call preset update function if it exists
    if (this.currentPreset.update) {
      this.currentPreset.update(audioData, currentTime, this.frameCount)
    }
    
    // Bind framebuffer for rendering
    this.pingPongFBO.bind()
    
    // Use the shader program
    this.currentProgram.use()
    
    // Set common uniforms
    this.setCommonUniforms(audioData, currentTime)
    
    // Set preset-specific uniforms
    this.setPresetUniforms()
    
    // Bind textures
    this.bindTextures()
    
    // Render fullscreen quad
    this.fullscreenQuad.render()
    
    // Unbind framebuffer
    this.pingPongFBO.unbind()
    
    // Copy result to screen
    this.copyToScreen()
    
    // Swap ping-pong buffers
    this.pingPongFBO.swap()
    
    this.frameCount++
  }

  private updateAudioTextures(audioData: AudioData): void {
    const gl = this.gl

    // Update spectrum texture (1D texture stored as 2D)
    if (this.spectrumTexture && audioData.spectrum) {
      gl.bindTexture(gl.TEXTURE_2D, this.spectrumTexture)
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.R8,
        audioData.spectrum.length, 1, 0,
        gl.RED, gl.UNSIGNED_BYTE, audioData.spectrum
      )
    }

    // Update waveform texture
    if (this.audioTexture && audioData.waveform) {
      gl.bindTexture(gl.TEXTURE_2D, this.audioTexture)
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.R8,
        audioData.waveform.length, 1, 0,
        gl.RED, gl.UNSIGNED_BYTE, audioData.waveform
      )
    }

    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  private setCommonUniforms(audioData: AudioData, time: number): void {
    if (!this.currentProgram) return

    // Time and frame uniforms
    this.currentProgram.setUniform('u_time', { type: 'float', value: time })
    this.currentProgram.setUniform('u_frame', { type: 'int', value: this.frameCount })
    
    // Resolution
    const canvas = this.gl.canvas
    this.currentProgram.setUniform('u_resolution', {
      type: 'vec2',
      value: [canvas.width, canvas.height]
    })
    
    // Audio uniforms
    this.currentProgram.setUniform('u_energy', { type: 'float', value: audioData.energy })
    this.currentProgram.setUniform('u_bass', { type: 'float', value: audioData.bass })
    this.currentProgram.setUniform('u_treble', { type: 'float', value: audioData.treble })
    this.currentProgram.setUniform('u_beat', { type: 'int', value: audioData.beat ? 1 : 0 })
  }

  private setPresetUniforms(): void {
    if (!this.currentProgram || !this.currentPreset?.uniforms) return

    for (const [name, uniform] of Object.entries(this.currentPreset.uniforms)) {
      this.currentProgram.setUniform(`u_${name}`, {
        type: uniform.type,
        value: uniform.value
      })
    }
  }

  private bindTextures(): void {
    const gl = this.gl

    // Bind previous frame texture
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.pingPongFBO.getPreviousTexture())
    this.currentProgram?.setUniform('u_previousFrame', { type: 'sampler2D', value: 0 })

    // Bind spectrum texture
    if (this.spectrumTexture) {
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, this.spectrumTexture)
      this.currentProgram?.setUniform('u_spectrum', { type: 'sampler2D', value: 1 })
    }

    // Bind waveform texture
    if (this.audioTexture) {
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, this.audioTexture)
      this.currentProgram?.setUniform('u_waveform', { type: 'sampler2D', value: 2 })
    }
  }

  private copyToScreen(): void {
    const gl = this.gl
    
    // Restore main framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    
    // Simple copy from current FBO texture to screen
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.pingPongFBO.getCurrentTexture())
    
    // Use current program or a simple copy program
    this.fullscreenQuad.render()
  }

  private renderBlank(): void {
    const gl = this.gl
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }

  private getDefaultVertexShader(): string {
    return `#version 300 es
      layout(location = 0) in vec2 a_position;
      layout(location = 1) in vec2 a_texCoord;
      
      out vec2 v_texCoord;
      
      void main() {
        v_texCoord = a_texCoord;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `
  }

  public resize(width: number, height: number): void {
    this.pingPongFBO.resize(width, height)
  }

  public destroy(): void {
    if (this.currentPreset?.destroy) {
      this.currentPreset.destroy()
    }
    
    if (this.currentProgram) {
      this.currentProgram.destroy()
    }
    
    this.fullscreenQuad.destroy()
    this.pingPongFBO.destroy()
    
    if (this.audioTexture) {
      this.gl.deleteTexture(this.audioTexture)
    }
    
    if (this.spectrumTexture) {
      this.gl.deleteTexture(this.spectrumTexture)
    }
  }
}
