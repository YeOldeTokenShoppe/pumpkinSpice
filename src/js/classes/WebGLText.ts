import Commons from "./Commons";
import * as THREE from "three";

import fragmentShader from "./shaders/text/text.frag";
import vertexShader from "./shaders/text/text.vert";

// @ts-ignore
import { Text } from "troika-three-text";

import { inView } from "motion";

interface Props {
  scene: THREE.Scene;
  element: HTMLElement;
}
export default class WebGLText {
  private commons: Commons;

  private scene: THREE.Scene;
  private element: HTMLElement;

  private computedStyle: CSSStyleDeclaration;
  private font!: string; // Path to our .ttf font file.
  private bounds!: DOMRect;
  private color!: THREE.Color;
  private material!: THREE.ShaderMaterial;
  private mesh!: Text;

  // We assign the correct font bard on our element's font weight from here
  private weightToFontMap: Record<string, string> = {
    "900": "/fonts/Humane-Black.ttf",
    "800": "/fonts/Humane-ExtraBold.ttf",
    "700": "/fonts/Humane-Bold.ttf",
    "600": "/fonts/Humane-SemiBold.ttf",
    "500": "/fonts/Humane-Medium.ttf",
    "400": "/fonts/Humane-Regular.ttf",
    "300": "/fonts/Humane-Light.ttf",
    "200": "/fonts/Humane-ExtraLight.ttf",
    "100": "/fonts/Humane-Thin.ttf",
  };

  private y: number = 0; // Scroll-adjusted bounds.top

  private isVisible: boolean = false;

  constructor({ scene, element }: Props) {
    this.commons = Commons.getInstance();

    this.scene = scene;
    this.element = element;

    this.computedStyle = window.getComputedStyle(this.element); // Saving initial computed style.

    this.createFont();
    this.createColor();
    this.createBounds();
    this.createMaterial();
    this.createMesh();
    this.setStaticValues();

    // Don't make text transparent yet - let's see what's happening
    // this.element.style.color = "transparent"; // Setting the DOM Element to invisible, so that only WebGLText remains.

    this.addEventListeners(); // Inits visibility tracking for show() and hide()
    
    // Start with text visible for debugging
    this.show();
    this.update(); // Set initial position
  }

  private createFont() {
    this.font =
      this.weightToFontMap[this.computedStyle.fontWeight] ||
      "/fonts/Humane-Regular.ttf";
  }

  private createBounds() {
    this.bounds = this.element.getBoundingClientRect();
    // Get current scroll position from Lenis or fallback to window
    const currentScroll = this.commons.lenis?.scroll || window.scrollY || 0;
    this.y = this.bounds.top + currentScroll;
  }

  private createColor() {
    this.color = new THREE.Color(this.computedStyle.color);
  }

  private createMaterial() {
    this.material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        uProgress: new THREE.Uniform(0),  // Start at 0 for animation
        uHeight: new THREE.Uniform(this.bounds.height),
        uColor: new THREE.Uniform(this.color),
      },
      transparent: true,  // Enable transparency for fade effects
      depthWrite: false,  // Prevent depth issues with transparent text
    });
  }

  private createMesh() {
    this.mesh = new Text();

    this.mesh.text = this.element.innerText; // Always use innerText (not innerHTML or textContent).
    this.mesh.font = this.font;

    this.mesh.anchorX = "0%"; // We set to position it from the left, instead of the center as in traditional ThreeJS/WebGL
    this.mesh.anchorY = "50%";

    this.mesh.material = this.material;
    
    // Add the mesh to the scene - this was missing!
    this.scene.add(this.mesh);
    
    // Log for debugging
    console.log('Created WebGL text mesh:', {
      text: this.mesh.text.substring(0, 30),
      font: this.font,
      fontSize: this.mesh.fontSize,
      color: this.color.getHexString(),
      bounds: {
        width: this.bounds.width,
        height: this.bounds.height,
        top: this.bounds.top,
        left: this.bounds.left
      },
      computedFontSize: this.computedStyle.fontSize,
      position: { x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z }
    });
  }

  /**
   * Sets static values that don't have to be updated on every frame.
   * This is called at initialization and resize.
   */
  private setStaticValues() {
    const { fontSize, letterSpacing, lineHeight, whiteSpace, textAlign } =
      this.computedStyle;

    const fontSizeNum = window.parseFloat(fontSize);
    
    console.log('Setting static values for:', this.mesh.text.substring(0, 20), {
      fontSize: fontSizeNum,
      letterSpacing,
      lineHeight,
      textAlign,
      maxWidth: this.bounds.width
    });

    this.mesh.fontSize = fontSizeNum;

    this.mesh.textAlign = textAlign;

    // Troika defines letter spacing in em's, so we convert to them
    this.mesh.letterSpacing = parseFloat(letterSpacing) / fontSizeNum;

    // Same with line height
    this.mesh.lineHeight = parseFloat(lineHeight) / fontSizeNum;

    // Important to define maxWidth for the mesh, so that our text doesn't overflow
    this.mesh.maxWidth = this.bounds.width;

    this.mesh.whiteSpace = whiteSpace;
    
    // IMPORTANT: Sync the mesh after setting all properties
    this.mesh.sync();
  }

  show() {
    this.isVisible = true;

    // Create a simple animation for the uniform value
    const startValue = this.material.uniforms.uProgress.value;
    const targetValue = 1;
    const duration = 1800; // 1.8 seconds in milliseconds
    const startTime = performance.now();

    const animateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing function [0.25, 1, 0.5, 1] (similar to ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      this.material.uniforms.uProgress.value = startValue + (targetValue - startValue) * easedProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animateProgress);
      }
    };
    
    requestAnimationFrame(animateProgress);
  }

  hide() {
    // Create a simple animation for the uniform value
    const startValue = this.material.uniforms.uProgress.value;
    const targetValue = 0;
    const duration = 1800; // 1.8 seconds in milliseconds
    const startTime = performance.now();

    const animateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing function
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      this.material.uniforms.uProgress.value = startValue + (targetValue - startValue) * easedProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animateProgress);
      } else {
        this.isVisible = false;
      }
    };
    
    requestAnimationFrame(animateProgress);
  }

  onResize() {
    this.computedStyle = window.getComputedStyle(this.element);
    this.createBounds();
    this.setStaticValues();
    this.material.uniforms.uHeight.value = this.bounds.height;
  }

  update() {
    if (this.isVisible && this.mesh) {
      // Get current scroll position from Lenis
      const currentScroll = this.commons.lenis?.animatedScroll || window.scrollY || 0;
      
      
      // Position the mesh based on scroll
      // The formula: element's Y position - current scroll + center offset
      const newY = -this.y +
        currentScroll +
        this.commons.sizes.screen.height / 2 -
        this.bounds.height / 2;
      
      const newX = this.bounds.left - this.commons.sizes.screen.width / 2;
      
      
      this.mesh.position.y = newY;
      this.mesh.position.x = newX;
        
      // Sync the mesh to ensure it renders
      this.mesh.sync();
    }
  }

  /**
   * Inits visibility tracking using motion.
   */
  private addEventListeners() {
    inView(this.element, () => {
      this.show();
      
      // Don't return a cleanup function - text stays visible after reveal
      // return () => this.hide();
    });
  }
}