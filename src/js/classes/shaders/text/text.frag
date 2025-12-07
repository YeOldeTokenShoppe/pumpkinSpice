// Fragment shader for text with gradient and reveal effect
uniform vec3 uColor;
uniform float uProgress;

varying vec2 vUv;

void main() {
  // Create a gradient based on UV coordinates
  vec3 color = uColor;
  
  // Add vertical gradient for more visual interest
  float gradient = 1.0 - vUv.y * 0.3;
  color *= gradient;
  
  // Add subtle color variation based on horizontal position
  color.r *= 1.0 + sin(vUv.x * 10.0) * 0.1;
  color.b *= 1.0 + cos(vUv.x * 8.0) * 0.1;
  
  // Simple alpha based on progress
  float alpha = uProgress;
  
  gl_FragColor = vec4(color, alpha);
}