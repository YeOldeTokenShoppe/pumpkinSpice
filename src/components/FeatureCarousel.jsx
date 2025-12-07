"use client";

import { useState, useEffect, useRef } from "react";

const FeatureCarousel = ({ slides, autoRotate = true, rotationInterval = 6000 }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const intervalRef = useRef(null);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (autoRotate && !isPaused && slides.length > 1) {
      intervalRef.current = setInterval(nextSlide, rotationInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [currentSlide, autoRotate, isPaused, rotationInterval, slides.length]);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      prevSlide();
    } else if (e.key === "ArrowRight") {
      nextSlide();
    }
  };

  if (slides.length === 0) return null;

  return (
    <div
      className="feature-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Feature Carousel"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "0 1rem",
      }}
    >
      <div
        className="carousel-viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "1rem",
          background: "linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 20, 0, 0.4))",
          backdropFilter: "blur(10px)",
          border: "2px solid rgb(3, 233, 244)",
          boxShadow: "0 0 40px rgba(3, 233, 244, 0.3), inset 0 0 40px rgba(3, 233, 244, 0.05)",
        }}
      >
        <div
          className="carousel-track"
          style={{
            display: "flex",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="carousel-slide"
              style={{
                width: "100%",
                flexShrink: 0,
             maxHeight: "85vh",
                display: "flex",
                alignItems: "center",
              }}
              role="tabpanel"
              aria-label={`Slide ${index + 1} of ${slides.length}`}
              aria-hidden={currentSlide !== index}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="carousel-nav-button carousel-nav-prev"
            aria-label="Previous slide"
            style={{
              position: "absolute",
              left: "2rem",
              top: "50%",
              transform: "translateY(-50%)",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(5, 217, 232, 0.15)",
              border: "2px solid rgba(5, 217, 232, 0.5)",
              color: "rgba(5, 217, 232)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              zIndex: 20,
              boxShadow: "0 0 20px rgba(5, 217, 232, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(5, 217, 232, 0.2)";
              e.currentTarget.style.borderColor = "rgba(5, 217, 232, 0.5)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(5, 217, 232, 0.1)";
              e.currentTarget.style.borderColor = "rgba(5, 217, 232, 0.3)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="carousel-nav-button carousel-nav-next"
            aria-label="Next slide"
            style={{
              position: "absolute",
              right: "2rem",
              top: "50%",
              transform: "translateY(-50%)",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(5, 217, 232, 0.15)",
           border: "2px solid rgba(5, 217, 232, 0.5)",
          color: "rgba(5, 217, 232)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              zIndex: 20,
           boxShadow: "0 0 20px rgba(5, 217, 232, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 255, 157, 0.2)";
              e.currentTarget.style.borderColor = "rgba(5, 217, 232, 0.5)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 255, 157, 0.1)";
              e.currentTarget.style.borderColor = "rgba(5, 217, 232, 0.3)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div
          className="carousel-indicators"
          style={{
            position: "absolute",
            bottom: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "0.5rem",
            zIndex: 10,
            padding: "0.5rem 1rem",
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
          }}
        >
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="carousel-indicator"
              aria-label={`Go to slide ${index + 1}`}
              style={{
                width: currentSlide === index ? "32px" : "8px",
                height: "8px",
                borderRadius: "4px",
                border: "none",
                background: currentSlide === index ? "rgb(3, 233, 244)" : "rgba(3, 233, 244, 0.5)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (currentSlide !== index) {
                  e.currentTarget.style.background = "rgba(3, 233, 244, 0.9)";
                }
              }}
              onMouseLeave={(e) => {
                if (currentSlide !== index) {
                  e.currentTarget.style.background = "rgba(3, 233, 244, 0.5)";
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Responsive styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .carousel-nav-button {
            display: none !important;
          }
          .carousel-indicators {
            bottom: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FeatureCarousel;