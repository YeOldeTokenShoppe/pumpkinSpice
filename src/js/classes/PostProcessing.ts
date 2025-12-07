import {
  EffectComposer,
  RenderPass,
  ShaderPass,
} from "three/examples/jsm/Addons.js";
import Commons from "./Commons";
import * as THREE from "three";

// Importing postprocessing shaders
import fragmentShader from "./shaders/postprocessing/postprocessing.frag";
import vertexShader from "./shaders/postprocessing/postprocessing.vert";

interface Props {
  scene: THREE.Scene;
  renderer?: THREE.WebGLRenderer;
  camera?: THREE.Camera;
}

export default class PostProcessing {
  // Scene and utility references
  private commons: Commons;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.Camera;

  private composer!: EffectComposer;

  private renderPass!: RenderPass;
  private shiftPass!: ShaderPass;
  
  private lerpedVelocity = 0; // Smoothed scroll velocity for post-processing
  private lerpFactor = 0.05; // Controls how quickly lerpedVelocity follows the real velocity

  constructor({ scene, renderer, camera }: Props) {
    this.commons = Commons.getInstance();

    this.scene = scene;
    this.renderer = renderer || this.commons.renderer;
    this.camera = camera || this.commons.camera;

    this.createComposer();
    this.createPasses();
  }

  private createComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(this.commons.sizes.pixelRatio);
    this.composer.setSize(
      this.commons.sizes.screen.width,
      this.commons.sizes.screen.height
    );
  }

  private createPasses() {
    // Creating Render Pass (final output) first
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.renderPass.clear = true; // Ensure we clear before rendering
    this.composer.addPass(this.renderPass);

    // Creating Post-processing shader for wave and RGB-shift effect
    const shiftShader = {
      uniforms: {
        tDiffuse: { value: null },      // Default input from previous pass
        uVelocity: { value: 0 },        // Scroll velocity input
        uTime: { value: 0 },            // Elapsed time for animated distortion
      },
      vertexShader,
      fragmentShader,
    };

    this.shiftPass = new ShaderPass(shiftShader);
    this.composer.addPass(this.shiftPass);
  }

  /**
   * Resize handler for EffectComposer, called from entry-point
   */
  onResize() {
    this.composer.setPixelRatio(this.commons.sizes.pixelRatio);
    this.composer.setSize(
      this.commons.sizes.screen.width,
      this.commons.sizes.screen.height
    );
  }

  update() {
    this.shiftPass.uniforms.uTime.value = this.commons.elapsedTime;

    // Reading current velocity from lenis instance
    const targetVelocity = this.commons.lenis.velocity;

    // We use the lerped velocity as the actual velocity for the shader, just for a smoother experience
    this.lerpedVelocity +=
      (targetVelocity - this.lerpedVelocity) * this.lerpFactor;

    this.shiftPass.uniforms.uVelocity.value = this.lerpedVelocity;

    this.composer.render();
  }
}