// Common GLSL utilities and functions
// Include this in your shaders for useful functions

// Time uniforms
uniform float u_time;
uniform int u_frame;

// Resolution
uniform vec2 u_resolution;

// Audio uniforms
uniform float u_energy;
uniform float u_bass;
uniform float u_treble;
uniform int u_beat;

// Textures
uniform sampler2D u_previousFrame;
uniform sampler2D u_spectrum;
uniform sampler2D u_waveform;

// Normalized coordinates (0-1)
vec2 getUV() {
  return gl_FragCoord.xy / u_resolution.xy;
}

// Centered coordinates (-1 to 1)
vec2 getCenteredUV() {
  return (gl_FragCoord.xy - u_resolution.xy * 0.5) / min(u_resolution.x, u_resolution.y);
}

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Simple noise function
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Smooth noise
float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  
  float a = noise(i);
  float b = noise(i + vec2(1.0, 0.0));
  float c = noise(i + vec2(0.0, 1.0));
  float d = noise(i + vec2(1.0, 1.0));
  
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Get audio spectrum value at normalized frequency
float getSpectrum(float freq) {
  return texture(u_spectrum, vec2(freq, 0.5)).r;
}

// Get waveform value at normalized time position
float getWaveform(float pos) {
  return texture(u_waveform, vec2(pos, 0.5)).r;
}

// Rotate 2D point
vec2 rotate(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// Distance to line segment
float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// Beat pulse function
float beatPulse() {
  return u_beat == 1 ? 1.0 : 0.0;
}

// Smooth beat pulse with decay
float beatPulseSmooth(float decay) {
  // This would need frame-to-frame state tracking in the preset
  return beatPulse();
}
