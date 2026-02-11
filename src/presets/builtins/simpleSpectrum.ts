import { PresetBuilder } from '../Preset'

export const simpleSpectrum = PresetBuilder.create()
  .setMetadata({
    name: 'Simple Spectrum',
    author: 'HyperCream',
    description: 'A basic circular spectrum visualizer',
    version: '1.0.0',
    tags: ['builtin', 'spectrum', 'circular'],
  })
  .setShaders({
    fragment: `#version 300 es
      precision highp float;
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_energy;
      uniform int u_beat;
      uniform sampler2D u_spectrum;
      uniform sampler2D u_previousFrame;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 center = uv - 0.5;
        center.x *= u_resolution.x / u_resolution.y; // Aspect ratio correction
        
        float radius = length(center);
        float angle = atan(center.y, center.x);
        
        // Map angle to spectrum frequency
        float spectrumIndex = (angle + 3.14159) / (2.0 * 3.14159);
        float spectrumValue = texture(u_spectrum, vec2(spectrumIndex, 0.5)).r;
        
        // Spectrum value is already normalized 0-1 from Uint8Array
        
        // Create bars
        float innerRadius = 0.1;
        float barHeight = spectrumValue * 0.4;
        float outerRadius = innerRadius + barHeight;
        
        float bar = step(innerRadius, radius) * (1.0 - step(outerRadius, radius));
        
        // Color based on frequency and energy
        vec3 color = vec3(0.0);
        if (bar > 0.0) {
          float hue = spectrumIndex * 0.7 + u_time * 0.05;
          float saturation = 0.9;
          float brightness = 0.6 + u_energy * 0.4;
          
          // HSV to RGB
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(vec3(hue) + K.xyz) * 6.0 - K.www);
          color = brightness * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), saturation);
        }
        
        // Beat flash
        if (u_beat == 1) {
          color += vec3(0.2);
        }
        
        // Feedback for trails
        vec3 prevColor = texture(u_previousFrame, uv).rgb * 0.92;
        color = max(color, prevColor);
        
        fragColor = vec4(color, 1.0);
      }
    `,
  })
  .build()
