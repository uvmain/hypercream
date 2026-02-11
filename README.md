# HyperCream

A modern Milkdrop-style visualizer engine for the web, built with WebGL2 and TypeScript.

## Features

- 🎵 **Audio Analysis**: Real-time spectrum and waveform analysis with beat detection
- 🎨 **WebGL2 Rendering**: High-performance GPU-accelerated visualizations
- 🔄 **Community Presets**: Support for custom shader-based presets
- 🎛️ **Vue.js Integration**: Easy integration with Vue.js applications
- 📱 **Responsive**: Automatic canvas resizing and aspect ratio handling
- 🎯 **TypeScript**: Full type safety and IntelliSense support

## Installation

```bash
npm install hypercream
```

## Quick Start

### Basic Usage

```typescript
import { createVisualizer } from 'hypercream'

// Create visualizer instance
const visualizer = createVisualizer({
  canvas: document.getElementById('visualizer-canvas') as HTMLCanvasElement,
  width: 800,
  height: 600
})

// Connect to audio element
const audioElement = document.getElementById('audio') as HTMLAudioElement
visualizer.connectAudio(audioElement)

// Start rendering
visualizer.start()
```

### Vue.js Integration

```vue
<template>
  <div>
    <canvas ref="canvas" width="800" height="600"></canvas>
    <audio ref="audio" controls>
      <source src="your-audio-file.mp3" type="audio/mpeg">
    </audio>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createVisualizer, simpleSpectrum } from 'hypercream'

const canvas = ref<HTMLCanvasElement>()
const audio = ref<HTMLAudioElement>()
let visualizer: any = null

onMounted(() => {
  if (canvas.value && audio.value) {
    // Create visualizer
    visualizer = createVisualizer({
      canvas: canvas.value
    })
    
    // Connect audio
    visualizer.connectAudio(audio.value)
    
    // Load a preset
    visualizer.loadPreset(simpleSpectrum)
    
    // Start visualization
    visualizer.start()
  }
})

onUnmounted(() => {
  if (visualizer) {
    visualizer.destroy()
  }
})
</script>
```

## Creating Custom Presets

```typescript
import { PresetBuilder } from 'hypercream'

const myPreset = PresetBuilder.create()
  .setMetadata({
    name: 'My Awesome Preset',
    author: 'Your Name',
    description: 'A cool visualization effect',
    version: '1.0.0',
    tags: ['custom', 'colorful']
  })
  .setShaders({
    fragment: `#version 300 es
      precision highp float;
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_energy;
      uniform sampler2D u_spectrum;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        
        // Your shader code here
        vec3 color = vec3(uv.x, uv.y, sin(u_time) * 0.5 + 0.5);
        color *= u_energy;
        
        fragColor = vec4(color, 1.0);
      }
    `
  })
  .setUniforms({
    intensity: {
      type: 'float',
      value: 1.0,
      min: 0.0,
      max: 2.0,
      description: 'Effect intensity'
    }
  })
  .build()

// Load the preset
visualizer.loadPreset(myPreset)
```

## Available Uniforms

Your fragment shaders have access to these built-in uniforms:

- `u_time`: Current time in seconds
- `u_frame`: Current frame number
- `u_resolution`: Canvas resolution (vec2)
- `u_energy`: Overall audio energy level
- `u_bass`: Bass frequency energy
- `u_treble`: Treble frequency energy
- `u_beat`: Beat detection (1 if beat detected, 0 otherwise)
- `u_previousFrame`: Previous frame texture (for feedback effects)
- `u_spectrum`: Audio spectrum texture (1D stored as 2D)
- `u_waveform`: Audio waveform texture (1D stored as 2D)

## API Reference

### Visualizer Class

```typescript
class Visualizer {
  constructor(config?: VisualizerConfig)
  connectAudio(audioElement: HTMLAudioElement): void
  loadPreset(preset: Preset): void
  start(): void
  stop(): void
  resize(width: number, height: number): void
  getCanvas(): HTMLCanvasElement
  destroy(): void
}
```

### Configuration Options

```typescript
interface VisualizerConfig {
  canvas?: HTMLCanvasElement  // Canvas element (creates one if not provided)
  width?: number             // Canvas width (default: 800)
  height?: number            // Canvas height (default: 600)
  audioElement?: HTMLAudioElement  // Audio element to connect immediately
}
```

## Built-in Presets

- `simpleSpectrum`: A basic circular spectrum visualizer

More presets coming soon!

## Browser Support

- Chrome 56+
- Firefox 51+
- Safari 15+
- Edge 79+

WebGL2 support is required.

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Development mode (watch for changes)
npm run dev

# Type checking
npm run typecheck
```

## License

ISC License

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
