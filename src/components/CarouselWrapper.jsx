import React, { useState, useEffect, useMemo } from "react";
import Carousel from "./Carousel";
import "../components/Carousel.css";

const CarouselWrapper = () => {
  const [carouselLoaded, setCarouselLoaded] = useState(false);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle scroll to carousel after sign-in redirect
  useEffect(() => {
    const handleScrollToCarousel = () => {
      if (window.location.hash === '#carousel-section') {
        // Small delay to ensure the component is mounted and rendered
        setTimeout(() => {
          const carouselElement = document.getElementById('carousel-section');
          if (carouselElement) {
            carouselElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            // Clean up the hash from URL after scrolling
            history.replaceState(null, null, window.location.pathname);
          }
        }, 500);
      }
    };

    // Check on mount
    handleScrollToCarousel();

    // Listen for hash changes
    window.addEventListener('hashchange', handleScrollToCarousel);
    
    return () => window.removeEventListener('hashchange', handleScrollToCarousel);
  }, []);

  // List of critical images that need to be preloaded
  const criticalImages = useMemo(
    () => [
      "/carousel_images/carouselSign.png",
      "/carousel_images/seaMonster.png",
      "/carousel_images/bull.png",
      "/carousel_images/bear.png",
      "/carousel_images/gator.png",
      "/carousel_images/chupa.png",
      "/carousel_images/snowman.png",
      "/carousel_images/unicorn.png",
      "/carousel_images/jackalope.png",
      "/carousel_images/liger.png",
      "/carousel_images/dire.png",
      "/carousel_images/warthog.png",
      "/carousel_images/mothmanRide.png",
    ],
    []
  );

  // Preload all critical images
  useEffect(() => {
    let loadedCount = 0;
    const totalImages = criticalImages.length;

    const preloadImage = (src) => {
      return new Promise((resolve) => {
        const img = typeof window !== "undefined" ? new window.Image() : null;

        if (!img) {
          resolve(false);
          return;
        }

        img.onload = () => {
          loadedCount++;
          setImagesLoaded((prev) => [...prev, src]);
          resolve(true);
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${src}`);
          loadedCount++;
          resolve(false);
        };
        img.src = src;
      });
    };

    Promise.all(criticalImages.map(preloadImage))
      .then(() => {
        setAllImagesLoaded(true);
      })
      .catch((err) => {
        console.error("Error preloading images:", err);
        // Still set as loaded after timeout to prevent hanging
        setTimeout(() => setAllImagesLoaded(true), 3000);
      });
  }, [criticalImages]);

  return (
    <div
      id="carousel-section"
      style={{
        position: "relative",
        // marginBottom: "16rem",
        marginTop: "4rem",
        paddingTop: "4rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        width: "100%",
        minHeight: "800px",
        background: "transparent"
      }}
    >
      {/* Container wrapping the Carousel and the sign */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 2,
          width: "100%",
          minHeight: "500px",
          // Carousel container
        }}
      >
        <Carousel
          setCarouselLoaded={setCarouselLoaded}
          images={[
            { src: "/carousel_images/seaMonster.png", title: "Sea Monster" },
            { src: "/carousel_images/bull.png", title: "Bull" },
            { src: "/carousel_images/bear.png", title: "Bear" },
            { src: "/carousel_images/gator.png", title: "G8r" },
            { src: "/carousel_images/chupa.png", title: "Chupacabra" },
            { src: "/carousel_images/snowman.png", title: "Yeti" },
            { src: "/carousel_images/unicorn.png", title: "Unicorn" },
            { src: "/carousel_images/jackalope.png", title: "Jackalope" },
            { src: "/carousel_images/liger.png", title: "Liger" },
            { src: "/carousel_images/dire.png", title: "Dire Wolf" },
            { src: "/carousel_images/warthog.png", title: "Warthog" },
            { src: "/carousel_images/mothmanRide.png", title: "Mothman" },
          ]}
          // logos={[
          //   {
          //     logo: "/3d_spotify.png",
          //     title: "Threads",
          //     link: "https://www.threads.net",
          //   },
          //   {
          //     logo: "/telegram.svg",
          //     title: "Telegram",
          //     link: "https://t.me",
          //   },
          //   { logo: "/x_.svg", title: "X", link: "https://x.com" },
          //   {
          //     logo: "/threads_.png",
          //     title: "Threads",
          //     link: "https://www.threads.net",
          //   },
          //   {
          //     logo: "/instagram_.png",
          //     title: "Instagram",
          //     link: "https://www.instagram.com",
          //   },
          //   {
          //     logo: "/discord.svg",
          //     title: "Discord",
          //     link: "https://discord.com",
          //   },
          // ]}
        />
      </div>

      {/* Carousel sign with improved positioning and z-index */}
      <div
        style={{
          position: "absolute",
          top: isMobile ? "-4.5rem" : "-15rem",
          left: "50%",
          transform: `translateX(-50%) scale(${isMobile ? "0.3" : "0.5"})`,
          width: "auto",
          maxWidth: "none",
          maxHeight: "none",
          zIndex: 9999,
          pointerEvents: "none",
          willChange: "transform",
          isolation: "isolate",
        }}
      >
        <img
          src="/carousel_images/carouselSign.png"
          alt=""
          style={{
            width: "auto",
            maxWidth: "none",
            maxHeight: "none",
          }}
          onLoad={() => console.log("Carousel sign loaded")}
        />
      </div>
    </div>
  );
};

export default CarouselWrapper;