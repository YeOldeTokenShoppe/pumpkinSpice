"use client";

import React, { useEffect } from "react";
import '../../css/webgl-styles.css';

export default function WebGLTextPage() {
  useEffect(() => {
    // Add classes for style isolation
    document.documentElement.classList.add('webgl-text-page');
    document.body.classList.add('webgl-text-page');
    document.body.classList.add('loading');
    
    // Wait for next tick to ensure canvas is in DOM
    setTimeout(() => {
      // Dynamically import and initialize the Three.js app
      const initWebGL = async () => {
        const { default: app } = await import('../../js/main');
        console.log("WebGL Text scene initialized");
      };

      initWebGL();
    }, 0);

    // Cleanup
    return () => {
      // Remove body class
      document.body.classList.remove('webgl-text-page');
      
      // Remove the canvas when component unmounts
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.remove();
      }
    };
  }, []);

  return (
    <>
      {/* Full-screen canvas for WebGL rendering */}
      <canvas id="webgl-canvas" />
      
      {/* Main content with text elements */}
      <div className="webgl-content">
        <div className="webgl-container">
          <section className="section__heading">
            <h3 data-animation="webgl-text" className="text__2">THREE.JS</h3>
            <h2 data-animation="webgl-text" className="text__1">
              RESPONSIVE AND ACCESSIBLE TEXT
            </h2>
          </section>
          
          <section className="section__main__content">
            <p data-animation="webgl-text" className="text__2">
              THIS TEXT IS STYLED TO LOOK LIKE A TYPICAL BLOCK OF TEXT ON A STANDARD
              WEBSITE. BUT UNDER THE SURFACE, IT'S BEING RENDERED WITH WEBGL INSTEAD
              OF TRADITIONAL HTML.
            </p>
            <p data-animation="webgl-text" className="text__2">
              THIS OPENS THE DOOR TO CUSTOM SHADER EFFECTS AND INTERACTIONS THAT GO
              BEYOND WHAT'S POSSIBLE WITH TRADITIONAL HTML.
            </p>
            <p data-animation="webgl-text" className="text__2">
              WE KEEP THE UNDERLYING HTML STRUCTURE PRESENT IN THE DOM. RATHER THAN
              CREATING MESHES DIRECTLY IN THREE.JS, THE SCENE IS BUILT BY READING FROM
              THE EXISTING HTML CONTENT. THIS WAY, SCREEN READERS, SEARCH ENGINES, AND
              OTHER TOOLS CAN STILL INTERPRET THE PAGE AS EXPECTED.
            </p>
          </section>
          
          <section className="section__footer">
            <p data-animation="webgl-text" className="text__3">
              NOW GO CRAZY WITH THE SHADERS :)
            </p>
          </section>
        </div>
      </div>
    </>
  );
}