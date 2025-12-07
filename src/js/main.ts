// main.ts

import Commons from "./classes/Commons";
import WebGLText from "./classes/WebGLText";
import PostProcessing from "./classes/PostProcessing";
import * as THREE from "three";

/**
 * Main entry-point.
 * Creates Commons and Scenes
 * Starts the update loop
 * Eventually creates Postprocessing and Texts.
 */
class App {
  private commons!: Commons;

  scene!: THREE.Scene;
  texts!: Array<WebGLText>;
  private postProcessing!: PostProcessing;

  constructor() {
    // Check if DOM is already loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      // DOM is already loaded, init immediately
      this.init();
    }
  }
  
  private async init() {
    await document.fonts.ready; // Important to wait for fonts to load when animating any texts.
    console.log("Initializing WebGL app...");

    this.commons = Commons.getInstance();
    this.commons.init();

    this.createScene();
    this.createWebGLTexts();
    this.createPostProcessing();
    
    this.addEventListeners();

    this.update();
  }

  private createScene() {
    this.scene = new THREE.Scene();
  }

  private createPostProcessing() {
    this.postProcessing = new PostProcessing({ scene: this.scene });
    console.log('PostProcessing initialized');
  }

  private createWebGLTexts() {
    console.log('Looking for WebGL text elements...');
    const texts = document.querySelectorAll('[data-animation="webgl-text"]');
    console.log(`Found ${texts.length} elements with data-animation="webgl-text"`);

    if (texts && texts.length > 0) {
      this.texts = Array.from(texts).map((el, index) => {
        console.log(`Creating WebGL text ${index + 1}:`, el.textContent?.substring(0, 30));
        const newEl = new WebGLText({
          element: el as HTMLElement,
          scene: this.scene,
        });

        return newEl;
      });
      
      // Add class to body to indicate WebGL is active
      document.body.classList.add('webgl-active');
      // Remove loading class for smooth transition
      document.body.classList.remove('loading');
      console.log(`Successfully created ${this.texts.length} WebGL text elements`);
    } else {
      console.log('No elements with data-animation="webgl-text" found');
      console.log('Current DOM body:', document.body.innerHTML.substring(0, 500));
    }
  }

  /**
   * The main loop handler of the App
   * The update function to be called on each frame of the browser.
   * Calls update on all other parts of the app
   */
  private update() {
    this.commons.update();

    // Update all WebGL text elements
    if (this.texts) {
      this.texts.forEach(text => text.update());
    }

    // Don't render directly - let PostProcessing handle it
    // this.commons.renderer.render(this.scene, this.commons.camera);
    
    // PostProcessing handles rendering now
    this.postProcessing.update();

    window.requestAnimationFrame(this.update.bind(this));
  }

  private addEventListeners() {
    window.addEventListener("resize", this.onResize.bind(this));
  }

  private onResize() {
    this.commons.onResize();
    
    // Update all WebGL text elements on resize
    if (this.texts) {
      this.texts.forEach(text => text.onResize());
    }
  }
}

export default new App();