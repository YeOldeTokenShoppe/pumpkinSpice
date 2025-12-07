// Vertex shader for text with wave displacement
uniform float uHeight;
uniform float uProgress;

varying vec2 vUv;

void main() {
  vec3 pos = position;
  
  // Pass UV to fragment shader
  vUv = uv;
  
  // Wave displacement effect based on vertical position
  float wave = sin(uv.y * 5.0 + uProgress * 3.0) * 0.02;
  pos.x += wave * uProgress;
  
  // Vertical reveal animation
  float revealOffset = (1.0 - uProgress) * uHeight * 0.5;
  pos.y -= revealOffset;
  
  // Add some depth variation for more dynamic effect
  pos.z += sin(uv.x * 3.0 + uProgress * 2.0) * 0.01 * uProgress;
  
  vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  
  gl_Position = projectedPosition;
}