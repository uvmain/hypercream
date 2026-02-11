# Example Usage

Here's a complete example showing how to use HyperCream in a Vue.js application:

```vue
<script setup lang="ts">
import type { Visualizer } from 'hypercream'
import {
  createVisualizer,
  PresetBuilder,
  simpleSpectrum

} from 'hypercream'
import { onMounted, onUnmounted, reactive, ref } from 'vue'

// Reactive state
const visualizerCanvas = ref<HTMLCanvasElement>()
const audioElement = ref<HTMLAudioElement>()
const canvasSize = reactive({ width: 800, height: 600 })
const currentPreset = ref<string>('simple-spectrum')

// Visualizer instance
let visualizer: Visualizer | null = null

// Available presets
const availablePresets = ref([
  { id: 'simple-spectrum', name: 'Simple Spectrum', preset: simpleSpectrum },
  // Add more presets here...
])

// Custom preset example
const waveformPreset = PresetBuilder.create()
  .setMetadata({
    name: 'Waveform Visualizer',
    author: 'Example',
    description: 'Shows audio waveform'
  })
  .setShaders({
    fragment: `#version 300 es
      precision highp float;

      in vec2 v_texCoord;
      out vec4 fragColor;

      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_energy;
      uniform sampler2D u_waveform;

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;

        // Sample waveform at current x position
        float waveValue = texture(u_waveform, vec2(uv.x, 0.5)).r;

        // Convert from 0-1 to -1 to 1 range
        waveValue = (waveValue - 0.5) * 2.0;

        // Scale by energy
        waveValue *= u_energy * 2.0;

        // Create waveform line
        float centerY = 0.5;
        float waveY = centerY + waveValue * 0.4;
        float lineThickness = 0.01;

        float distance = abs(uv.y - waveY);
        float line = 1.0 - smoothstep(0.0, lineThickness, distance);

        // Color based on position and energy
        vec3 color = vec3(uv.x, 1.0 - uv.x, u_energy);
        color *= line;

        fragColor = vec4(color, 1.0);
      }
    `
  })
  .build()

// Add custom preset to available presets
availablePresets.value.push({
  id: 'waveform',
  name: 'Waveform',
  preset: waveformPreset
})

// Setup visualizer
onMounted(async () => {
  if (!visualizerCanvas.value)
    return

  try {
    // Create visualizer instance
    visualizer = createVisualizer({
      canvas: visualizerCanvas.value,
      width: canvasSize.width,
      height: canvasSize.height
    })

    // Load default preset
    const defaultPreset = availablePresets.value.find(p => p.id === currentPreset.value)
    if (defaultPreset) {
      visualizer.loadPreset(defaultPreset.preset)
    }

    console.log('Visualizer initialized successfully')
  }
  catch (error) {
    console.error('Failed to initialize visualizer:', error)
  }
})

// Cleanup
onUnmounted(() => {
  if (visualizer) {
    visualizer.destroy()
    visualizer = null
  }
})

// Audio loaded handler
function onAudioLoaded() {
  if (visualizer && audioElement.value) {
    try {
      visualizer.connectAudio(audioElement.value)
      console.log('Audio connected to visualizer')
    }
    catch (error) {
      console.error('Failed to connect audio:', error)
    }
  }
}

// Start visualizer
function startVisualizer() {
  if (visualizer) {
    visualizer.start()
    console.log('Visualizer started')
  }
}

// Stop visualizer
function stopVisualizer() {
  if (visualizer) {
    visualizer.stop()
    console.log('Visualizer stopped')
  }
}

// Load preset
function loadPreset(presetInfo: typeof availablePresets.value[0]) {
  if (visualizer) {
    visualizer.loadPreset(presetInfo.preset)
    currentPreset.value = presetInfo.id
    console.log(`Loaded preset: ${presetInfo.name}`)
  }
}

// Set canvas size
function setSize(width: number, height: number) {
  canvasSize.width = width
  canvasSize.height = height

  if (visualizer) {
    visualizer.resize(width, height)
    console.log(`Canvas resized to ${width}x${height}`)
  }
}
</script>

<template>
  <div class="visualizer-container">
    <canvas
      ref="visualizerCanvas"
      :width="canvasSize.width"
      :height="canvasSize.height"
      class="visualizer-canvas"
    />

    <div class="controls">
      <audio
        ref="audioElement"
        controls
        @loadeddata="onAudioLoaded"
        @play="startVisualizer"
        @pause="stopVisualizer"
      >
        <source src="/path/to/your/audio.mp3" type="audio/mpeg">
      </audio>

      <div class="preset-controls">
        <button
          v-for="preset in availablePresets"
          :key="preset.id"
          :class="{ active: currentPreset === preset.id }"
          @click="loadPreset(preset)"
        >
          {{ preset.name }}
        </button>
      </div>

      <div class="size-controls">
        <button @click="setSize(800, 600)">
          800x600
        </button>
        <button @click="setSize(1024, 768)">
          1024x768
        </button>
        <button @click="setSize(1920, 1080)">
          1920x1080
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.visualizer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #000;
  color: white;
  min-height: 100vh;
}

.visualizer-canvas {
  border: 1px solid #333;
  margin: 20px 0;
  box-shadow: 0 0 20px rgba(0, 150, 255, 0.3);
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.preset-controls,
.size-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

button {
  padding: 10px 20px;
  background: #333;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #555;
}

button.active {
  background: #0066cc;
}

audio {
  margin: 10px 0;
}
</style>
```

This example shows:

1. **Complete Vue.js Integration**: How to properly integrate HyperCream with Vue's reactive system
2. **Audio Connection**: Connecting to HTML audio elements
3. **Preset Management**: Loading and switching between different presets
4. **Custom Presets**: Creating custom shader-based presets
5. **Canvas Resizing**: Dynamic canvas size changes
6. **Lifecycle Management**: Proper cleanup when component is unmounted

## Installation in a Vue Project

```bash
# Install HyperCream
npm install hypercream

# Install Vue if not already installed
npm install vue@^3.0.0
```

## Key Features Demonstrated

- **Reactive Canvas Size**: Canvas dimensions that respond to UI controls
- **Multiple Presets**: Easy switching between different visualization styles
- **Custom Shader Presets**: Example of creating custom GLSL-based visualizations
- **Audio Integration**: Seamless connection to HTML5 audio elements
- **Proper Cleanup**: Memory management and resource cleanup
