'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'
import styles from './NeuralNetwork.module.css'

const colorPalettes = [
  [
    new THREE.Color(0x667eea),
    new THREE.Color(0x764ba2),
    new THREE.Color(0xf093fb),
    new THREE.Color(0x9d50bb),
    new THREE.Color(0x6e48aa)
  ],
  [
    new THREE.Color(0xf857a6),
    new THREE.Color(0xff5858),
    new THREE.Color(0xfeca57),
    new THREE.Color(0xff6348),
    new THREE.Color(0xff9068)
  ],
  [
    new THREE.Color(0x4facfe),
    new THREE.Color(0x00f2fe),
    new THREE.Color(0x43e97b),
    new THREE.Color(0x38f9d7),
    new THREE.Color(0x4484ce)
  ]
]

const noiseFunctions = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`

const nodeShaderVertex = `${noiseFunctions}
attribute float nodeSize;
attribute float nodeType;
attribute vec3 nodeColor;
attribute float distanceFromRoot;

uniform float uTime;
uniform vec3 uPulsePositions[3];
uniform float uPulseTimes[3];
uniform float uPulseSpeed;
uniform float uBaseNodeSize;

varying vec3 vColor;
varying float vNodeType;
varying vec3 vPosition;
varying float vPulseIntensity;
varying float vDistanceFromRoot;
varying float vGlow;

float getPulseIntensity(vec3 worldPos, vec3 pulsePos, float pulseTime) {
    if (pulseTime < 0.0) return 0.0;
    float timeSinceClick = uTime - pulseTime;
    if (timeSinceClick < 0.0 || timeSinceClick > 4.0) return 0.0;
    float pulseRadius = timeSinceClick * uPulseSpeed;
    float distToClick = distance(worldPos, pulsePos);
    float pulseThickness = 3.0;
    float waveProximity = abs(distToClick - pulseRadius);
    return smoothstep(pulseThickness, 0.0, waveProximity) * smoothstep(4.0, 0.0, timeSinceClick);
}

void main() {
    vNodeType = nodeType;
    vColor = nodeColor;
    vDistanceFromRoot = distanceFromRoot;
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vPosition = worldPos;
    float totalPulseIntensity = 0.0;
    for (int i = 0; i < 3; i++) {
        totalPulseIntensity += getPulseIntensity(worldPos, uPulsePositions[i], uPulseTimes[i]);
    }
    vPulseIntensity = min(totalPulseIntensity, 1.0);
    float breathe = sin(uTime * 0.7 + distanceFromRoot * 0.15) * 0.15 + 0.85;
    float baseSize = nodeSize * breathe;
    float pulseSize = baseSize * (1.0 + vPulseIntensity * 2.5);
    vGlow = 0.5 + 0.5 * sin(uTime * 0.5 + distanceFromRoot * 0.2);
    vec3 modifiedPosition = position;
    if (nodeType > 0.5) {
        float noise = snoise(position * 0.08 + uTime * 0.08);
        modifiedPosition += normal * noise * 0.15;
    }
    vec4 mvPosition = modelViewMatrix * vec4(modifiedPosition, 1.0);
    gl_PointSize = pulseSize * uBaseNodeSize * (1000.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}`

const nodeShaderFragment = `
uniform float uTime;
uniform vec3 uPulseColors[3];

varying vec3 vColor;
varying float vNodeType;
varying vec3 vPosition;
varying float vPulseIntensity;
varying float vDistanceFromRoot;
varying float vGlow;

void main() {
    vec2 center = 2.0 * gl_PointCoord - 1.0;
    float dist = length(center);
    if (dist > 1.0) discard;
    float glow1 = 1.0 - smoothstep(0.0, 0.5, dist);
    float glow2 = 1.0 - smoothstep(0.0, 1.0, dist);
    float glowStrength = pow(glow1, 1.2) + glow2 * 0.3;
    float breatheColor = 0.9 + 0.1 * sin(uTime * 0.6 + vDistanceFromRoot * 0.25);
    vec3 baseColor = vColor * breatheColor;
    vec3 finalColor = baseColor;
    if (vPulseIntensity > 0.0) {
        vec3 pulseColor = mix(vec3(1.0), uPulseColors[0], 0.4);
        finalColor = mix(baseColor, pulseColor, vPulseIntensity * 0.8);
        finalColor *= (1.0 + vPulseIntensity * 1.2);
        glowStrength *= (1.0 + vPulseIntensity);
    }
    float coreBrightness = smoothstep(0.4, 0.0, dist);
    finalColor += vec3(1.0) * coreBrightness * 0.3;
    float alpha = glowStrength * (0.95 - 0.3 * dist);
    float camDistance = length(vPosition - cameraPosition);
    float distanceFade = smoothstep(100.0, 15.0, camDistance);
    if (vNodeType > 0.5) {
        finalColor *= 1.1;
        alpha *= 0.9;
    }
    finalColor *= (1.0 + vGlow * 0.1);
    gl_FragColor = vec4(finalColor, alpha * distanceFade);
}`

const connectionShaderVertex = `${noiseFunctions}
attribute vec3 startPoint;
attribute vec3 endPoint;
attribute float connectionStrength;
attribute float pathIndex;
attribute vec3 connectionColor;

uniform float uTime;
uniform vec3 uPulsePositions[3];
uniform float uPulseTimes[3];
uniform float uPulseSpeed;

varying vec3 vColor;
varying float vConnectionStrength;
varying float vPulseIntensity;
varying float vPathPosition;
varying float vDistanceFromCamera;

float getPulseIntensity(vec3 worldPos, vec3 pulsePos, float pulseTime) {
    if (pulseTime < 0.0) return 0.0;
    float timeSinceClick = uTime - pulseTime;
    if (timeSinceClick < 0.0 || timeSinceClick > 4.0) return 0.0;
    
    float pulseRadius = timeSinceClick * uPulseSpeed;
    float distToClick = distance(worldPos, pulsePos);
    float pulseThickness = 3.0;
    float waveProximity = abs(distToClick - pulseRadius);
    
    return smoothstep(pulseThickness, 0.0, waveProximity) * smoothstep(4.0, 0.0, timeSinceClick);
}

void main() {
    float t = position.x;
    vPathPosition = t;
    vec3 midPoint = mix(startPoint, endPoint, 0.5);
    float pathOffset = sin(t * 3.14159) * 0.15;
    vec3 perpendicular = normalize(cross(normalize(endPoint - startPoint), vec3(0.0, 1.0, 0.0)));
    if (length(perpendicular) < 0.1) perpendicular = vec3(1.0, 0.0, 0.0);
    midPoint += perpendicular * pathOffset;
    vec3 p0 = mix(startPoint, midPoint, t);
    vec3 p1 = mix(midPoint, endPoint, t);
    vec3 finalPos = mix(p0, p1, t);
    float noiseTime = uTime * 0.15;
    float noise = snoise(vec3(pathIndex * 0.08, t * 0.6, noiseTime));
    finalPos += perpendicular * noise * 0.12;
    vec3 worldPos = (modelMatrix * vec4(finalPos, 1.0)).xyz;
    float totalPulseIntensity = 0.0;
    for (int i = 0; i < 3; i++) {
        totalPulseIntensity += getPulseIntensity(worldPos, uPulsePositions[i], uPulseTimes[i]);
    }
    vPulseIntensity = min(totalPulseIntensity, 1.0);
    vColor = connectionColor;
    vConnectionStrength = connectionStrength;
    
    vDistanceFromCamera = length(worldPos - cameraPosition);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
}`

const connectionShaderFragment = `
uniform float uTime;
uniform vec3 uPulseColors[3];

varying vec3 vColor;
varying float vConnectionStrength;
varying float vPulseIntensity;
varying float vPathPosition;
varying float vDistanceFromCamera;

void main() {
    float flowPattern1 = sin(vPathPosition * 25.0 - uTime * 4.0) * 0.5 + 0.5;
    float flowPattern2 = sin(vPathPosition * 15.0 - uTime * 2.5 + 1.57) * 0.5 + 0.5;
    float combinedFlow = (flowPattern1 + flowPattern2 * 0.5) / 1.5;
    
    vec3 baseColor = vColor * (0.8 + 0.2 * sin(uTime * 0.6 + vPathPosition * 12.0));
    float flowIntensity = 0.4 * combinedFlow * vConnectionStrength;
    vec3 finalColor = baseColor;
    if (vPulseIntensity > 0.0) {
        vec3 pulseColor = mix(vec3(1.0), uPulseColors[0], 0.3);
        finalColor = mix(baseColor, pulseColor * 1.2, vPulseIntensity * 0.7);
        flowIntensity += vPulseIntensity * 0.8;
    }
    finalColor *= (0.7 + flowIntensity + vConnectionStrength * 0.5);
    float baseAlpha = 0.7 * vConnectionStrength;
    float flowAlpha = combinedFlow * 0.3;
    float alpha = baseAlpha + flowAlpha;
    alpha = mix(alpha, min(1.0, alpha * 2.5), vPulseIntensity);
    float distanceFade = smoothstep(100.0, 15.0, vDistanceFromCamera);
    gl_FragColor = vec4(finalColor, alpha * distanceFade);
}`

class Node {
  constructor(position, level = 0, type = 0) {
    this.position = position
    this.connections = []
    this.level = level
    this.type = type
    this.size = type === 0 ? THREE.MathUtils.randFloat(0.8, 1.4) : THREE.MathUtils.randFloat(0.5, 1.0)
    this.distanceFromRoot = 0
  }

  addConnection(node, strength = 1.0) {
    if (!this.isConnectedTo(node)) {
      this.connections.push({ node, strength })
      node.connections.push({ node: this, strength })
    }
  }

  isConnectedTo(node) {
    return this.connections.some(conn => conn.node === node)
  }
}

const NeuralNetwork = ({
  showControls = true,
  showStarfield = true,
  initialTheme = 0,
  initialFormation = 0,
  initialDensity = 100,
  autoRotate = true,
  enableInteraction = true,
  containerStyle = {},
  className = ''
}) => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const composerRef = useRef(null)
  const controlsRef = useRef(null)
  const clockRef = useRef(new THREE.Clock())
  const animationIdRef = useRef(null)
  
  const [paused, setPaused] = useState(false)
  const [activeTheme, setActiveTheme] = useState(initialTheme)
  const [currentFormation, setCurrentFormation] = useState(initialFormation)
  const [density, setDensity] = useState(initialDensity)
  
  const neuralNetworkRef = useRef(null)
  const nodesMeshRef = useRef(null)
  const connectionsMeshRef = useRef(null)
  const starFieldRef = useRef(null)
  const lastPulseIndexRef = useRef(0)

  const generateNeuralNetwork = (formationIndex, densityFactor = 1.0) => {
    let nodes = []
    let rootNode

    const generateCrystallineSphere = () => {
      rootNode = new Node(new THREE.Vector3(0, 0, 0), 0, 0)
      rootNode.size = 2.0
      nodes.push(rootNode)
      
      const layers = 5
      const goldenRatio = (1 + Math.sqrt(5)) / 2
      
      for (let layer = 1; layer <= layers; layer++) {
        const radius = layer * 4
        const numPoints = Math.floor(layer * 12 * densityFactor)
        
        for (let i = 0; i < numPoints; i++) {
          const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints)
          const theta = 2 * Math.PI * i / goldenRatio
          const pos = new THREE.Vector3(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
          )
          const isLeaf = layer === layers || Math.random() < 0.3
          const node = new Node(pos, layer, isLeaf ? 1 : 0)
          node.distanceFromRoot = radius
          nodes.push(node)
          
          if (layer > 1) {
            const prevLayerNodes = nodes.filter(n => n.level === layer - 1 && n !== rootNode)
            prevLayerNodes.sort((a, b) => pos.distanceTo(a.position) - pos.distanceTo(b.position))
            for (let j = 0; j < Math.min(3, prevLayerNodes.length); j++) {
              const dist = pos.distanceTo(prevLayerNodes[j].position)
              const strength = 1.0 - (dist / (radius * 2))
              node.addConnection(prevLayerNodes[j], Math.max(0.3, strength))
            }
          } else {
            rootNode.addConnection(node, 0.9)
          }
        }
        
        const layerNodes = nodes.filter(n => n.level === layer && n !== rootNode)
        for (let i = 0; i < layerNodes.length; i++) {
          const node = layerNodes[i]
          const nearby = layerNodes
            .filter(n => n !== node)
            .sort((a, b) => node.position.distanceTo(a.position) - node.position.distanceTo(b.position))
            .slice(0, 5)
          for (const nearNode of nearby) {
            const dist = node.position.distanceTo(nearNode.position)
            if (dist < radius * 0.8 && !node.isConnectedTo(nearNode)) {
              node.addConnection(nearNode, 0.6)
            }
          }
        }
      }
    }

    const generateHelixLattice = () => {
      rootNode = new Node(new THREE.Vector3(0, 0, 0), 0, 0)
      rootNode.size = 1.8
      nodes.push(rootNode)
      
      const numHelices = 4
      const height = 30
      const maxRadius = 12
      const nodesPerHelix = Math.floor(50 * densityFactor)
      const helixArrays = []
      
      for (let h = 0; h < numHelices; h++) {
        const helixPhase = (h / numHelices) * Math.PI * 2
        const helixNodes = []
        
        for (let i = 0; i < nodesPerHelix; i++) {
          const t = i / (nodesPerHelix - 1)
          const y = (t - 0.5) * height
          const radiusScale = Math.sin(t * Math.PI) * 0.7 + 0.3
          const radius = maxRadius * radiusScale
          const angle = helixPhase + t * Math.PI * 6
          
          const pos = new THREE.Vector3(
            radius * Math.cos(angle),
            y,
            radius * Math.sin(angle)
          )
          
          const level = Math.ceil(t * 5)
          const isLeaf = i > nodesPerHelix - 5 || Math.random() < 0.25
          const node = new Node(pos, level, isLeaf ? 1 : 0)
          node.distanceFromRoot = Math.sqrt(radius * radius + y * y)
          nodes.push(node)
          helixNodes.push(node)
        }
        
        helixArrays.push(helixNodes)
        rootNode.addConnection(helixNodes[0], 1.0)
        
        for (let i = 0; i < helixNodes.length - 1; i++) {
          helixNodes[i].addConnection(helixNodes[i + 1], 0.85)
        }
      }
      
      for (let h = 0; h < numHelices; h++) {
        const currentHelix = helixArrays[h]
        const nextHelix = helixArrays[(h + 1) % numHelices]
        
        for (let i = 0; i < currentHelix.length; i += 5) {
          const targetIdx = Math.round((i / (currentHelix.length - 1)) * (nextHelix.length - 1))
          if (targetIdx < nextHelix.length) {
            currentHelix[i].addConnection(nextHelix[targetIdx], 0.7)
          }
        }
      }
    }

    const generateFractalWeb = () => {
      rootNode = new Node(new THREE.Vector3(0, 0, 0), 0, 0)
      rootNode.size = 1.6
      nodes.push(rootNode)
      
      const branches = 6
      const maxDepth = 4
      
      const createBranch = (startNode, direction, depth, strength, scale) => {
        if (depth > maxDepth) return
        
        const branchLength = 5 * scale
        const endPos = new THREE.Vector3()
          .copy(startNode.position)
          .add(direction.clone().multiplyScalar(branchLength))
        
        const isLeaf = depth === maxDepth || Math.random() < 0.3
        const newNode = new Node(endPos, depth, isLeaf ? 1 : 0)
        newNode.distanceFromRoot = rootNode.position.distanceTo(endPos)
        nodes.push(newNode)
        startNode.addConnection(newNode, strength)
        
        if (depth < maxDepth) {
          const subBranches = 3
          for (let i = 0; i < subBranches; i++) {
            const angle = (i / subBranches) * Math.PI * 2
            const perpDir1 = new THREE.Vector3(-direction.y, direction.x, 0).normalize()
            const perpDir2 = direction.clone().cross(perpDir1).normalize()
            
            const newDir = new THREE.Vector3()
              .copy(direction)
              .add(perpDir1.clone().multiplyScalar(Math.cos(angle) * 0.7))
              .add(perpDir2.clone().multiplyScalar(Math.sin(angle) * 0.7))
              .normalize()
            
            createBranch(newNode, newDir, depth + 1, strength * 0.7, scale * 0.75)
          }
        }
      }
      
      for (let i = 0; i < branches; i++) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / branches)
        const theta = Math.PI * (1 + Math.sqrt(5)) * i
        const direction = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        ).normalize()
        
        createBranch(rootNode, direction, 1, 0.9, 1.0)
      }
    }

    switch (formationIndex % 3) {
      case 0:
        generateCrystallineSphere()
        break
      case 1:
        generateHelixLattice()
        break
      case 2:
        generateFractalWeb()
        break
    }

    return { nodes, rootNode }
  }

  const createStarfield = () => {
    const count = 8000
    const positions = []
    const colors = []
    const sizes = []
    
    for (let i = 0; i < count; i++) {
      const r = THREE.MathUtils.randFloat(50, 150)
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2))
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2)
      
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
      
      const colorChoice = Math.random()
      if (colorChoice < 0.7) {
        colors.push(1, 1, 1)
      } else if (colorChoice < 0.85) {
        colors.push(0.7, 0.8, 1)
      } else {
        colors.push(1, 0.9, 0.8)
      }
      
      sizes.push(THREE.MathUtils.randFloat(0.1, 0.3))
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uTime;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float twinkle = sin(uTime * 2.0 + position.x * 100.0) * 0.3 + 0.7;
          gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    
    return new THREE.Points(geometry, material)
  }

  const createNetworkVisualization = (formationIndex, densityFactor) => {
    if (nodesMeshRef.current) {
      sceneRef.current.remove(nodesMeshRef.current)
      nodesMeshRef.current.geometry.dispose()
      nodesMeshRef.current.material.dispose()
    }
    
    if (connectionsMeshRef.current) {
      sceneRef.current.remove(connectionsMeshRef.current)
      connectionsMeshRef.current.geometry.dispose()
      connectionsMeshRef.current.material.dispose()
    }
    
    neuralNetworkRef.current = generateNeuralNetwork(formationIndex, densityFactor)
    
    if (!neuralNetworkRef.current || neuralNetworkRef.current.nodes.length === 0) return
    
    const pulseUniforms = {
      uTime: { value: 0.0 },
      uPulsePositions: { 
        value: [
          new THREE.Vector3(1e3, 1e3, 1e3),
          new THREE.Vector3(1e3, 1e3, 1e3),
          new THREE.Vector3(1e3, 1e3, 1e3)
        ]
      },
      uPulseTimes: { value: [-1e3, -1e3, -1e3] },
      uPulseColors: { 
        value: [
          new THREE.Color(1, 1, 1),
          new THREE.Color(1, 1, 1),
          new THREE.Color(1, 1, 1)
        ]
      },
      uPulseSpeed: { value: 18.0 },
      uBaseNodeSize: { value: 0.6 }
    }
    
    const nodesGeometry = new THREE.BufferGeometry()
    const nodePositions = []
    const nodeTypes = []
    const nodeSizes = []
    const nodeColors = []
    const distancesFromRoot = []
    
    const palette = colorPalettes[activeTheme]
    
    neuralNetworkRef.current.nodes.forEach((node) => {
      nodePositions.push(node.position.x, node.position.y, node.position.z)
      nodeTypes.push(node.type)
      nodeSizes.push(node.size)
      distancesFromRoot.push(node.distanceFromRoot)
      
      const colorIndex = Math.min(node.level, palette.length - 1)
      const baseColor = palette[colorIndex % palette.length].clone()
      baseColor.offsetHSL(
        THREE.MathUtils.randFloatSpread(0.03),
        THREE.MathUtils.randFloatSpread(0.08),
        THREE.MathUtils.randFloatSpread(0.08)
      )
      nodeColors.push(baseColor.r, baseColor.g, baseColor.b)
    })
    
    nodesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3))
    nodesGeometry.setAttribute('nodeType', new THREE.Float32BufferAttribute(nodeTypes, 1))
    nodesGeometry.setAttribute('nodeSize', new THREE.Float32BufferAttribute(nodeSizes, 1))
    nodesGeometry.setAttribute('nodeColor', new THREE.Float32BufferAttribute(nodeColors, 3))
    nodesGeometry.setAttribute('distanceFromRoot', new THREE.Float32BufferAttribute(distancesFromRoot, 1))
    
    const nodesMaterial = new THREE.ShaderMaterial({
      uniforms: { ...pulseUniforms },
      vertexShader: nodeShaderVertex,
      fragmentShader: nodeShaderFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    
    nodesMeshRef.current = new THREE.Points(nodesGeometry, nodesMaterial)
    sceneRef.current.add(nodesMeshRef.current)
    
    const connectionsGeometry = new THREE.BufferGeometry()
    const connectionColors = []
    const connectionStrengths = []
    const connectionPositions = []
    const startPoints = []
    const endPoints = []
    const pathIndices = []
    
    const processedConnections = new Set()
    let pathIndex = 0
    
    neuralNetworkRef.current.nodes.forEach((node, nodeIndex) => {
      node.connections.forEach(connection => {
        const connectedNode = connection.node
        const connectedIndex = neuralNetworkRef.current.nodes.indexOf(connectedNode)
        if (connectedIndex === -1) return
        
        const key = [Math.min(nodeIndex, connectedIndex), Math.max(nodeIndex, connectedIndex)].join('-')
        if (!processedConnections.has(key)) {
          processedConnections.add(key)
          
          const startPoint = node.position
          const endPoint = connectedNode.position
          const numSegments = 20
          
          for (let i = 0; i < numSegments; i++) {
            const t = i / (numSegments - 1)
            connectionPositions.push(t, 0, 0)
            startPoints.push(startPoint.x, startPoint.y, startPoint.z)
            endPoints.push(endPoint.x, endPoint.y, endPoint.z)
            pathIndices.push(pathIndex)
            connectionStrengths.push(connection.strength)
            
            const avgLevel = Math.min(Math.floor((node.level + connectedNode.level) / 2), palette.length - 1)
            const baseColor = palette[avgLevel % palette.length].clone()
            baseColor.offsetHSL(
              THREE.MathUtils.randFloatSpread(0.03),
              THREE.MathUtils.randFloatSpread(0.08),
              THREE.MathUtils.randFloatSpread(0.08)
            )
            connectionColors.push(baseColor.r, baseColor.g, baseColor.b)
          }
          pathIndex++
        }
      })
    })
    
    connectionsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3))
    connectionsGeometry.setAttribute('startPoint', new THREE.Float32BufferAttribute(startPoints, 3))
    connectionsGeometry.setAttribute('endPoint', new THREE.Float32BufferAttribute(endPoints, 3))
    connectionsGeometry.setAttribute('connectionStrength', new THREE.Float32BufferAttribute(connectionStrengths, 1))
    connectionsGeometry.setAttribute('connectionColor', new THREE.Float32BufferAttribute(connectionColors, 3))
    connectionsGeometry.setAttribute('pathIndex', new THREE.Float32BufferAttribute(pathIndices, 1))
    
    const connectionsMaterial = new THREE.ShaderMaterial({
      uniforms: { ...pulseUniforms },
      vertexShader: connectionShaderVertex,
      fragmentShader: connectionShaderFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    
    connectionsMeshRef.current = new THREE.LineSegments(connectionsGeometry, connectionsMaterial)
    sceneRef.current.add(connectionsMeshRef.current)
  }

  const handleCanvasClick = (event) => {
    if (!enableInteraction || paused) return
    
    const rect = mountRef.current.getBoundingClientRect()
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    )
    
    const camera = controlsRef.current.object
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(pointer, camera)
    
    const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    interactionPlane.normal.copy(camera.position).normalize()
    interactionPlane.constant = -interactionPlane.normal.dot(camera.position) + camera.position.length() * 0.5
    
    const interactionPoint = new THREE.Vector3()
    if (raycaster.ray.intersectPlane(interactionPlane, interactionPoint)) {
      const time = clockRef.current.getElapsedTime()
      
      if (nodesMeshRef.current && connectionsMeshRef.current) {
        lastPulseIndexRef.current = (lastPulseIndexRef.current + 1) % 3
        const idx = lastPulseIndexRef.current
        
        nodesMeshRef.current.material.uniforms.uPulsePositions.value[idx].copy(interactionPoint)
        nodesMeshRef.current.material.uniforms.uPulseTimes.value[idx] = time
        connectionsMeshRef.current.material.uniforms.uPulsePositions.value[idx].copy(interactionPoint)
        connectionsMeshRef.current.material.uniforms.uPulseTimes.value[idx] = time
        
        const palette = colorPalettes[activeTheme]
        const randomColor = palette[Math.floor(Math.random() * palette.length)]
        nodesMeshRef.current.material.uniforms.uPulseColors.value[idx].copy(randomColor)
        connectionsMeshRef.current.material.uniforms.uPulseColors.value[idx].copy(randomColor)
      }
    }
  }

  const handleChangeFormation = () => {
    const newFormation = (currentFormation + 1) % 3
    setCurrentFormation(newFormation)
    createNetworkVisualization(newFormation, density / 100)
    controlsRef.current.autoRotate = false
    setTimeout(() => {
      controlsRef.current.autoRotate = autoRotate
    }, 2500)
  }

  const handlePausePlay = () => {
    setPaused(prev => !prev)
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !paused && autoRotate
    }
  }

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
      controlsRef.current.autoRotate = false
      setTimeout(() => {
        controlsRef.current.autoRotate = autoRotate
      }, 2000)
    }
  }

  const handleDensityChange = (event) => {
    const newDensity = parseInt(event.target.value, 10)
    setDensity(newDensity)
    setTimeout(() => {
      createNetworkVisualization(currentFormation, newDensity / 100)
    }, 400)
  }

  const handleThemeChange = (themeIndex) => {
    setActiveTheme(themeIndex)
    
    if (!nodesMeshRef.current || !connectionsMeshRef.current || !neuralNetworkRef.current) return
    
    const palette = colorPalettes[themeIndex]
    
    const nodeColorsAttr = nodesMeshRef.current.geometry.attributes.nodeColor
    for (let i = 0; i < nodeColorsAttr.count; i++) {
      const node = neuralNetworkRef.current.nodes[i]
      if (!node) continue
      
      const colorIndex = Math.min(node.level, palette.length - 1)
      const baseColor = palette[colorIndex % palette.length].clone()
      baseColor.offsetHSL(
        THREE.MathUtils.randFloatSpread(0.03),
        THREE.MathUtils.randFloatSpread(0.08),
        THREE.MathUtils.randFloatSpread(0.08)
      )
      nodeColorsAttr.setXYZ(i, baseColor.r, baseColor.g, baseColor.b)
    }
    nodeColorsAttr.needsUpdate = true
    
    const connectionColors = []
    const processedConnections = new Set()
    
    neuralNetworkRef.current.nodes.forEach((node, nodeIndex) => {
      node.connections.forEach(connection => {
        const connectedNode = connection.node
        const connectedIndex = neuralNetworkRef.current.nodes.indexOf(connectedNode)
        if (connectedIndex === -1) return
        
        const key = [Math.min(nodeIndex, connectedIndex), Math.max(nodeIndex, connectedIndex)].join('-')
        if (!processedConnections.has(key)) {
          processedConnections.add(key)
          
          const numSegments = 20
          for (let i = 0; i < numSegments; i++) {
            const avgLevel = Math.min(Math.floor((node.level + connectedNode.level) / 2), palette.length - 1)
            const baseColor = palette[avgLevel % palette.length].clone()
            baseColor.offsetHSL(
              THREE.MathUtils.randFloatSpread(0.03),
              THREE.MathUtils.randFloatSpread(0.08),
              THREE.MathUtils.randFloatSpread(0.08)
            )
            connectionColors.push(baseColor.r, baseColor.g, baseColor.b)
          }
        }
      })
    })
    
    connectionsMeshRef.current.geometry.setAttribute('connectionColor', new THREE.Float32BufferAttribute(connectionColors, 3))
    connectionsMeshRef.current.geometry.attributes.connectionColor.needsUpdate = true
  }

  useEffect(() => {
    if (!mountRef.current) return
    
    const scene = new THREE.Scene()
    // Only add fog if starfield is enabled (for full-screen mode)
    if (showStarfield) {
      scene.fog = new THREE.FogExp2(0x000000, 0.002)
    }
    sceneRef.current = scene
    
    const camera = new THREE.PerspectiveCamera(
      65,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 8, 28)
    
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0) // Fully transparent
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)
    
    if (showStarfield) {
      starFieldRef.current = createStarfield()
      scene.add(starFieldRef.current)
    }
    
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.rotateSpeed = 0.6
    controls.minDistance = 8
    controls.maxDistance = 80
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 0.2
    controls.enablePan = false
    controlsRef.current = controls
    
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mountRef.current.clientWidth, mountRef.current.clientHeight),
      1.8,
      0.6,
      0.7
    )
    composer.addPass(bloomPass)
    composer.addPass(new OutputPass())
    composerRef.current = composer
    
    createNetworkVisualization(currentFormation, density / 100)
    
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      
      const t = clockRef.current.getElapsedTime()
      
      if (!paused) {
        if (nodesMeshRef.current) {
          nodesMeshRef.current.material.uniforms.uTime.value = t
          nodesMeshRef.current.rotation.y = Math.sin(t * 0.04) * 0.05
        }
        
        if (connectionsMeshRef.current) {
          connectionsMeshRef.current.material.uniforms.uTime.value = t
          connectionsMeshRef.current.rotation.y = Math.sin(t * 0.04) * 0.05
        }
      }
      
      if (starFieldRef.current) {
        starFieldRef.current.rotation.y += 0.0002
        starFieldRef.current.material.uniforms.uTime.value = t
      }
      
      controls.update()
      composer.render()
    }
    
    animate()
    
    const handleResize = () => {
      if (!mountRef.current) return
      
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight
      
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      
      renderer.setSize(width, height)
      composer.setSize(width, height)
      bloomPass.resolution.set(width, height)
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      
      renderer.dispose()
      controls.dispose()
      composer.dispose()
    }
  }, [])

  return (
    <div 
      className={`${styles.container} ${className}`}
      style={containerStyle}
    >
      <div 
        ref={mountRef} 
        className={styles.canvas}
        onClick={handleCanvasClick}
      />
      
      {showControls && (
        <>
          <div className={styles.instructionsContainer}>
            <div className={styles.instructionTitle}>Quantum Neural Network</div>
            <div className={styles.instructionText}>
              Click to send energy pulses.<br />Drag to explore the structure.
            </div>
          </div>
          
          <div className={styles.themeSelector}>
            <div style={{ flex: 1 }}>
              <div className={styles.themeSelectorTitle}>Crystal Theme</div>
              <div className={styles.themeGrid}>
                {[0, 1, 2].map(idx => (
                  <button
                    key={idx}
                    className={`${styles.themeButton} ${styles[`theme${idx + 1}`]} ${activeTheme === idx ? styles.active : ''}`}
                    onClick={() => handleThemeChange(idx)}
                    aria-label={['Purple Nebula', 'Sunset Fire', 'Ocean Aurora'][idx]}
                  />
                ))}
              </div>
            </div>
            <div className={styles.densityControls}>
              <div className={styles.densityLabel}>
                <span>Density</span>
                <span>{density}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={density}
                className={styles.densitySlider}
                onChange={handleDensityChange}
                aria-label="Network Density"
              />
            </div>
          </div>
          
          <div className={styles.controlButtons}>
            <button className={styles.controlButton} onClick={handleChangeFormation}>
              <span>Morph</span>
            </button>
            <button className={styles.controlButton} onClick={handlePausePlay}>
              <span>{paused ? 'Play' : 'Freeze'}</span>
            </button>
            <button className={styles.controlButton} onClick={handleResetCamera}>
              <span>Reset</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default NeuralNetwork