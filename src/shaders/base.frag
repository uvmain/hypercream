#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

// Include common functions
uniform float u_time;
uniform int u_frame;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_bass;
uniform float u_treble;
uniform int u_beat;
uniform sampler2D u_previousFrame;
uniform sampler2D u_spectrum;
uniform sampler2D u_waveform;

// Simple example visualization
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 center = uv - 0.5;
  
  // Create a simple spectrum visualizer
  float radius = length(center);
  float angle = atan(center.y, center.x);
  
        // Map angle to spectrum frequency
        float spectrumIndex = (angle + 3.14159) / (2.0 * 3.14159);
        float spectrumValue = texture(u_spectrum, vec2(spectrumIndex, 0.5)).r;
        
        // Spectrum value is already normalized 0-1 from Uint8Array  // Create circular spectrum bars
  float barHeight = spectrumValue * 0.3;
  float bar = step(radius, 0.2 + barHeight) * step(0.2, radius);
  
  // Add some color based on frequency and energy
  vec3 color = vec3(0.0);
  if (bar > 0.5) {
    float hue = spectrumIndex * 0.8 + u_time * 0.1;
    float saturation = 0.8 + u_energy * 0.2;
    float brightness = 0.5 + u_energy * 0.5;
    
    vec3 hsv = vec3(hue, saturation, brightness);
    // Simple HSV to RGB conversion
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
    color = hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
  }
  
  // Add beat flash
  if (u_beat == 1) {
    color += vec3(0.3);
  }
  
  // Mix with previous frame for trails
  vec3 prevColor = texture(u_previousFrame, uv).rgb;
  color = mix(prevColor * 0.95, color, 0.1);
  
  fragColor = vec4(color, 1.0);
}
