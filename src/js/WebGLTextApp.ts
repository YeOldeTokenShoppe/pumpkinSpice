import * as THREE from "three";
import WebGLText from "./classes/WebGLText";
import PostProcessing from "./classes/PostProcessing";
import Commons from "./classes/Commons";

interface WebGLTextAppOptions {
  canvasId: string;
  targetSelector: string;
}

/**
 * Specialized WebGL Text App for component integration
 * Handles individual instances within React components
 */
export default class WebGLTextApp {
  private commons: Commons;
  private scene!: THREE.Scene;
  private texts: Array<WebGLText> = [];
  private postProcessing!: PostProcessing;
  private canvas: HTMLCanvasElement | null = null;
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private targetSelector: string;
  private animationFrameId?: number;
  private isInitialized: boolean = false;

  constructor(options: WebGLTextAppOptions) {
    this.targetSelector = options.targetSelector;
    this.canvas = document.getElementById(options.canvasId) as HTMLCanvasElement;
    
    if (!this.canvas) {
      console.error(`Canvas with id ${options.canvasId} not found`);
      return;
    }

    this.init();
  }

  private async init() {
    await document.fonts.ready;
    
    // Get or create Commons instance
    this.commons = Commons.getInstance();
    
    // Create a local scene for this instance
    this.scene = new THREE.Scene();
    
    // Create local camera
    this.createCamera();
    
    // Create local renderer using the provided canvas
    this.createRenderer();
    
    // Create WebGL texts for this specific instance
    this.createWebGLTexts();
    
    // Create post-processing
    this.createPostProcessing();
    
    this.isInitialized = true;
    this.update();
  }

  private createCamera() {
    const width = this.canvas!.clientWidth || window.innerWidth;
    const height = this.canvas!.clientHeight || window.innerHeight;
    
    this.camera = new THREE.PerspectiveCamera(
      70,
      width / height,
      100,
      2000
    );
    this.camera.position.z = 1000;
  }

  private createRenderer() {
    if (!this.canvas) return;
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
  }

  private createWebGLTexts() {
    const elements = document.querySelectorAll(this.targetSelector);
    
    if (elements && elements.length > 0) {
      this.texts = Array.from(elements).map((el) => {
        const webglText = new WebGLText({
          element: el as HTMLElement,
          scene: this.scene,
        });
        return webglText;
      });
    }
  }

  private createPostProcessing() {
    if (!this.renderer || !this.camera) return;
    
    // For component-based usage, we might want simpler post-processing
    // or make it optional
    this.postProcessing = new PostProcessing({ 
      scene: this.scene,
      renderer: this.renderer,
      camera: this.camera
    });
  }

  private update() {
    if (!this.isInitialized) return;
    
    // Update commons (for time and scroll)
    this.commons.update();
    
    // Update all WebGL text elements
    if (this.texts) {
      this.texts.forEach(text => text.update());
    }
    
    // Render with post-processing
    if (this.postProcessing) {
      this.postProcessing.update();
    } else {
      // Fallback to direct rendering if no post-processing
      this.renderer.render(this.scene, this.camera);
    }
    
    this.animationFrameId = window.requestAnimationFrame(this.update.bind(this));
  }

  /**
   * Update the text content dynamically
   */
  public updateText(newText: string) {
    const elements = document.querySelectorAll(this.targetSelector);
    elements.forEach(el => {
      if (el.textContent !== newText) {
        el.textContent = newText;
        
        // Find and update the corresponding WebGL text
        const textObj = this.texts.find(t => t.element === el);
        if (textObj && textObj.mesh) {
          textObj.mesh.text = newText;
          textObj.mesh.sync();
        }
      }
    });
  }

  /**
   * Clean up resources
   */
  public cleanup() {
    this.isInitialized = false;
    
    // Cancel animation frame
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
    }
    
    // Dispose of texts
    this.texts.forEach(text => {
      if (text.mesh) {
        this.scene.remove(text.mesh);
        // Additional cleanup if needed
      }
    });
    
    // Dispose of renderer
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Clear scene
    while(this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
  }
}