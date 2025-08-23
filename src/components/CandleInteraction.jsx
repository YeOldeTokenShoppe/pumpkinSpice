  /* eslint-disable react-hooks/exhaustive-deps */
  import React, { useRef, useEffect, useCallback } from "react";
  import { Canvas, useThree } from "@react-three/fiber";
  import { useGLTF, OrbitControls } from "@react-three/drei";
  import * as THREE from "three";

  function FloatingCandleViewer({ isVisible, onClose, userData, onNavigate, currentIndex, totalCandles }) {
    if (!isVisible) return null;

    // Add debugging to log the userData
    console.log("FloatingCandleViewer received userData:", userData, "Index:", currentIndex, "Total:", totalCandles);

    const handleClick = (e) => {
      // Close viewer when clicking outside the canvas area
      e.stopPropagation();
      onClose();
    };

    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: window.innerWidth <= 768 ? "flex-start" : "center",
          paddingTop: window.innerWidth <= 768 ? "10vh" : "0",
          zIndex: 10,
        }}
        onClick={handleClick}
      >
        {/* Canvas container */}
        <div
          style={{
            width: window.innerWidth <= 768 ? '70vw' : '30vw',
            height: window.innerWidth <= 768 ? '70vh' : '80vh',
            borderRadius: '10px',
            position: 'relative',
            zIndex: 11, // Higher than background but lower than close button
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Canvas
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "10px",
              position: "relative",
              zIndex: 11,
            }}
            gl={{ alpha: true }}
            camera={{ position: [0, 1, 5], fov: 45 }}
            onCreated={({ gl }) => {
              gl.domElement.style.touchAction = 'none'; // Disable browser touch gestures
            }}
          >
            <SceneContent userData={userData} />
          </Canvas>

          {/* Minimalist close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              position: "absolute",
              top: "50px",
              right: "15px",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              fontSize: "20px",
              fontWeight: "300",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              zIndex: 12,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.8)";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
              e.currentTarget.style.transform = "scale(1)";
            }}
            aria-label="Close viewer"
          >
            ✕
          </button>

        </div>
      </div>
    );
  }

  function SceneContent({ userData }) {
    const { scene, animations } = useGLTF("/models/singleCandleAnimatedFlame.glb");
    const candleRef = useRef();
    const controlsRef = useRef();
    const spotlightRef = useRef();
    const flamePointLightRef = useRef();
    const mixerRef = useRef(null);

    const applyUserImageToLabel = useCallback((scene, imageUrl) => {
      if (!scene || !imageUrl) return;

      let labelMesh = null;
      scene.traverse((child) => {
        if (child.name.includes("Label2")) {
          labelMesh = child;
          console.log("Found Label2 mesh:", child.name);
        }
      });

      if (labelMesh) {
        const textureLoader = new THREE.TextureLoader();

        // For the closeup viewer, we can use a higher resolution but still apply
        // some optimization techniques to prevent excessive memory usage
        const loadOptimizedTexture = (url, onLoad) => {
          // Create a canvas for image processing
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Higher resolution for detail view - 512px is a good balance
          const targetWidth = 512; // Higher resolution for close-up
          const targetHeight = 512;

          // Load the image
          const img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = () => {
            // Calculate aspect ratio to maintain proportions
            const aspectRatio = img.width / img.height;
            let drawWidth = targetWidth;
            let drawHeight = targetHeight;

            // Adjust dimensions to maintain aspect ratio
            if (aspectRatio > 1) {
              // Landscape image
              drawHeight = targetWidth / aspectRatio;
            } else {
              // Portrait or square image
              drawWidth = targetHeight * aspectRatio;
            }

            // Resize using canvas
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Fill canvas with black background first (for transparent PNGs)
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, targetWidth, targetHeight);

            // Center the image on the canvas
            const offsetX = (targetWidth - drawWidth) / 2;
            const offsetY = (targetHeight - drawHeight) / 2;

            // Draw with proper centering
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.flipY = false;

            // For the detail view, we DO want mipmaps for smooth viewing at different distances
            texture.generateMipmaps = true;
            texture.anisotropy = 4; // Medium anisotropy for better quality without excessive memory
            texture.needsUpdate = true;

            // Call the callback with the optimized texture
            onLoad(texture);
          };

          img.onerror = (error) =>
            console.warn("🚨 Detail view image load error:", error);
          img.src = url;
        };

        // Use our optimized loader for the closeup view
        loadOptimizedTexture(imageUrl, (texture) => {
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.5,
            emissiveMap: texture,
            metalness: 0.3,
            roughness: 0.2,
          });

          if (labelMesh.material) {
            if (labelMesh.material.map) {
              labelMesh.material.map.dispose();
            }
            labelMesh.material.dispose();
          }

          labelMesh.material = material;
          labelMesh.material.needsUpdate = true;
        });
      }
    }, []);

    const createDynamicTextTexture = useCallback((text, userData) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const context = canvas.getContext("2d");

      // Clear canvas and set background
      context.fillStyle = "#FFFFFF"; // White background to match CompactCandleModal
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle border
      context.strokeStyle = '#e0e0e0';
      context.lineWidth = 2;
      context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Save the context state
      context.save();

      // Don't rotate - we'll handle orientation with texture settings

      // Set text properties
      context.fillStyle = "#000000";
      context.textAlign = "center";
      context.textBaseline = "middle";

      // Use same font as CompactCandleModal
      const fontSize = text.length > 200 ? 40 : text.length > 100 ? 48 : 56;
      context.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`;

      // Use the text directly without replacement
      const formattedText = text;

      // Reduce maxWidth for shorter lines that are more readable on the curved label
      const maxWidth = 600; // Reduced from 800 to create shorter lines
      const lineHeight = 70; // Increased from 60 to add more space between lines
      const words = formattedText.split(" ");
      let lines = [];
      let currentLine = "";

      // Word wrapping
      words.forEach((word) => {
        const testLine = currentLine + word + " ";
        const metrics = context.measureText(testLine);

        if (metrics.width > maxWidth) {
          lines.push(currentLine);
          currentLine = word + " ";
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine);

      // Draw text with shadow for better visibility
      const startY = (canvas.height - lines.length * lineHeight) / 2;
      lines.forEach((line, index) => {
        // Add shadow
        context.shadowColor = "rgba(0, 0, 0, 0.5)";
        context.shadowBlur = 4;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;

        // Draw text
        context.fillText(line, canvas.width / 2, startY + index * lineHeight);

        // Reset shadow
        context.shadowColor = "transparent";
      });

      // Restore the context state
      context.restore();

      const texture = new THREE.CanvasTexture(canvas);
      
      // Match CompactCandleModal texture settings
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.repeat.set(-1, -1);  // Flip both X and Y for Label1
      texture.offset.set(1, 1);  // Adjust offset after flipping both axes
      texture.flipY = false;  // Ensure texture is not flipped vertically
      
      // Improve texture quality settings
      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16;  // Maximum anisotropic filtering
      texture.generateMipmaps = true;
      texture.needsUpdate = true;

      return texture;
    }, []);

    const applyDynamicTextToLabel = useCallback(
      (scene, userData) => {
        if (!scene || !userData) return;

        let labelMesh = null;
        scene.traverse((child) => {
          if (child.name.includes("Label1")) {
            labelMesh = child;
            console.log("Found Label1 mesh:", child.name);
          }
        });

        if (labelMesh) {
          // Define default images to check against
          const DEFAULT_IMAGES = [
            "/Triumph.jpg",
            "/vsClown.jpg",
            "/vsZombie.jpg",
            "/vsSkeleton.jpg",
          ];

          // Check if this is a default candle
          const isDefaultCandle =
            userData.isDefault ||
            (userData.image &&
              DEFAULT_IMAGES.some((img) => userData.image.includes(img)));

          // Create appropriate message based on whether it's a default or user candle
          let message, userName;

          if (isDefaultCandle) {
            // For default candles
            userName = "Anonymous";
            message = "Stake RL80 to dedicate a votive candle.";
          } else {
            // For user candles with custom images
            userName = userData.userName || "Friend";
            message =
              userData.message && userData.message.trim() !== ""
                ? userData.message
                : "may the light of Our Lady of Perpetual Profit illuminate the path to prosperity.";
          }

          console.log("Applying text to label:", {
            userName,
            message,
            isDefaultCandle,
          });

          // Different text format for default vs user candles
          const dynamicText = isDefaultCandle
            ? message
            : `On behalf of ${userName},\n\n${message}`;

          // Create texture with the text (without using {userName} placeholder)
          const texture = createDynamicTextTexture(dynamicText, userData);

          const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.05,  // Match CompactCandleModal
            emissiveMap: texture,
            metalness: 0,  // Match CompactCandleModal
            roughness: 0.9,  // Match CompactCandleModal
          });

          if (labelMesh.material) {
            if (labelMesh.material.map) {
              labelMesh.material.map.dispose();
            }
            labelMesh.material.dispose();
          }

          labelMesh.material = material;
          labelMesh.material.needsUpdate = true;
        }
      },
      [createDynamicTextTexture]
    );

    // Add this function to update on each frame
    const onFrame = () => {
      if (candleRef.current && flamePointLightRef.current) {
        // Get the world position of the candle
        const box = new THREE.Box3().setFromObject(candleRef.current);
        const center = box.getCenter(new THREE.Vector3());

        // Position the light at the top of the candle
        flamePointLightRef.current.position.set(
          center.x,
          center.y + 1.8, // Adjust this value to position at flame height
          center.z
        );

        // Update animation mixer if it exists
        if (mixerRef.current) {
          mixerRef.current.update(0.016); // Update with approximately 60fps timing
        }
      }
    };

    useThree(({ gl }) => {
      gl.setAnimationLoop(() => {
        onFrame();
      });

      return () => {
        gl.setAnimationLoop(null);
      };
    });

    useEffect(() => {
      if (!candleRef.current) return;

      const box = new THREE.Box3().setFromObject(candleRef.current);
      const center = box.getCenter(new THREE.Vector3());

      // Position the spotlight to focus on the flame area
      if (spotlightRef.current) {
        spotlightRef.current.position.set(center.x, center.y + 3, center.z + 2);
        spotlightRef.current.target.position.set(
          center.x,
          center.y + 1.5,
          center.z
        );
        spotlightRef.current.target.updateMatrixWorld();
      }

      if (controlsRef.current) {
        controlsRef.current.target.set(center.x, center.y, center.z);
        controlsRef.current.update();
      }

      if (userData?.image) {
        applyUserImageToLabel(scene, userData.image);
      }

      applyDynamicTextToLabel(scene, userData);

      // Setup flame animation
      if (animations && animations.length > 0) {
        // Create animation mixer
        mixerRef.current = new THREE.AnimationMixer(scene);

        // Find and play the flame animation
        const flameAnimation = animations.find(
          (anim) => anim.name === "Animation"
        );
        if (flameAnimation) {
          const action = mixerRef.current.clipAction(flameAnimation);
          action.play();
        }
      }

      // Add debugging to see what objects are in the scene
      console.log("User data received:", userData);

      // Define all default images to check against
      const DEFAULT_IMAGES = [
        "/Triumph.jpg",
        "/vsClown.jpg",
        "/vsZombie.jpg",
        "/vsSkeleton.jpg",
      ];

      // More thorough approach to find and control flame visibility
      // Check if the image is any of the default images
      const isDefaultImage =
        userData?.image &&
        DEFAULT_IMAGES.some((defaultImg) => userData.image.includes(defaultImg));

      const hasCustomUserImage = userData && userData.image && !isDefaultImage;

      console.log("Has user image:", userData?.image);
      console.log("Is default image:", isDefaultImage);
      console.log("Has custom user image:", hasCustomUserImage);

      // Disable flame animation if no custom user image
      if (!hasCustomUserImage && mixerRef.current) {
        mixerRef.current.stopAllAction();
      }

      // More aggressive approach to find and hide flame objects
      const hideFlameObjects = (object) => {
        // Check if this object is related to flame by name
        if (
          object.name.toLowerCase().includes("flame") ||
          object.name.toLowerCase().includes("fire") ||
          object.name.toLowerCase().includes("light")
        ) {
          console.log(`Found flame-related object: ${object.name}`);
          object.visible = hasCustomUserImage;
          console.log(`Set ${object.name} visibility to ${hasCustomUserImage}`);
        }

        // Recursively check children
        if (object.children && object.children.length > 0) {
          object.children.forEach((child) => hideFlameObjects(child));
        }
      };

      // Apply the flame hiding to the entire scene
      hideFlameObjects(scene);

      // Also try to find and disable any emissive materials that might be related to flames
      scene.traverse((object) => {
        if (object.material) {
          if (
            object.name.toLowerCase().includes("flame") ||
            object.name.toLowerCase().includes("fire") ||
            object.name.toLowerCase().includes("light")
          ) {
            if (object.material.emissive) {
              console.log(`Found emissive material on ${object.name}`);
              if (!hasCustomUserImage) {
                // Save original emissive color if needed later
                if (!object.userData.originalEmissive) {
                  object.userData.originalEmissive =
                    object.material.emissive.clone();
                }
                // Set emissive to black (no emission) if no custom user image
                object.material.emissive.set(0x000000);
                object.material.emissiveIntensity = 0;
              } else if (object.userData.originalEmissive) {
                // Restore original emissive if custom user image exists
                object.material.emissive.copy(object.userData.originalEmissive);
                object.material.emissiveIntensity = 1;
              }
            }
          }
        }
      });

      // Original flame visibility code (keep this as well)
      scene.traverse((child) => {
        if (child.name.startsWith("Flame")) {
          console.log(
            `Setting direct visibility for ${child.name} to ${hasCustomUserImage}`
          );
          child.visible = hasCustomUserImage;
        }
      });
    }, [
      scene,
      userData,
      animations,
      applyDynamicTextToLabel,
      applyUserImageToLabel,
    ]);

    return (
      <>
        <group ref={candleRef} scale={1.5} >
          <primitive object={scene} />
        </group>

        {/* Ambient light for overall scene illumination */}
        <ambientLight intensity={0.5} />

        {/* Spotlight for general candle illumination */}
        <spotLight
          ref={spotlightRef}
          intensity={1.5}
          angle={0.4}
          penumbra={0.5}
          distance={10}
          castShadow={false}
          color="#ffedd0"
        />

        {/* Point light that will always follow the flame area */}
        <pointLight
          ref={flamePointLightRef}
          intensity={2.0}
          distance={3}
          color="#ff9c5e"
          decay={2}
        />

        <OrbitControls
          ref={controlsRef}
          enableRotate={true}
          enableZoom={true}
          enablePan={false}
          minDistance={2}
          maxDistance={10}
          makeDefault
        />
      </>
    );
  }

  useGLTF.preload("/models/singleCandleAnimatedFlame.glb");

  export default FloatingCandleViewer;
