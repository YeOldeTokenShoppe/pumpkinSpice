import React, { useState, useEffect, useRef } from 'react';
import './SlantedCarousel.css';

const SlantedCarousel = ({ 
  slides = [],
  autoPlay = true,
  autoPlayInterval = 5000,
  showNavigation = true,
  showArrows = true,
  showProgressBar = true,
  customCursor = true
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const autoPlayRef = useRef(null);
  const progressRef = useRef(null);
  const startXRef = useRef(0);

  const defaultSlides = slides.length > 0 ? slides : [
    {
      id: 1,
      backgroundImage: '/face.png',
      image: '/face.png',
      number: '01',
      title: 'Cosmic Dreams',
      description: 'Journey through infinite possibilities where reality bends and imagination soars beyond the stars.'
    },
    {
      id: 2,
      backgroundImage: 'https://picsum.photos/1920/1080?random=2',
      image: 'https://picsum.photos/400/300?random=2',
      number: '02',
      title: 'Urban Pulse',
      description: 'Feel the rhythm of city life where neon lights dance with shadows in the endless metropolitan symphony.'
    },
    {
      id: 3,
      backgroundImage: 'https://picsum.photos/1920/1080?random=3',
      image: 'https://picsum.photos/400/300?random=3',
      number: '03',
      title: 'Ocean Depths',
      description: 'Dive into mysterious waters where ancient secrets whisper through currents of time and space.'
    },
    {
      id: 4,
      backgroundImage: 'https://picsum.photos/1920/1080?random=4',
      image: 'https://picsum.photos/400/300?random=4',
      number: '04',
      title: 'Desert Mirage',
      description: 'Witness the dance of heat and sand where mirages reveal hidden truths in the vast golden expanse.'
    },
    {
      id: 5,
      backgroundImage: 'https://picsum.photos/1920/1080?random=5',
      image: 'https://picsum.photos/400/300?random=5',
      number: '05',
      title: 'Forest Magic',
      description: 'Step into enchanted woods where every leaf tells a story and magic flows through ancient roots.'
    }
  ];

  const totalSlides = defaultSlides.length;

  useEffect(() => {
    if (autoPlay && !isHovered) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, autoPlayInterval);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }
  }, [isHovered, autoPlay, autoPlayInterval, totalSlides]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  useEffect(() => {
    if (customCursor) {
      const handleMouseMove = (e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [customCursor]);

  const goToSlide = (index) => {
    if (isAnimating || index === currentSlide) return;
    
    setIsAnimating(true);
    setCurrentSlide(index);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 1500);
  };

  const nextSlide = () => {
    const next = (currentSlide + 1) % totalSlides;
    goToSlide(next);
  };

  const prevSlide = () => {
    const prev = (currentSlide - 1 + totalSlides) % totalSlides;
    goToSlide(prev);
  };

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startXRef.current - endX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const getSlideClass = (index) => {
    if (index === currentSlide) return 'slide active';
    if (index < currentSlide) return 'slide prev';
    return 'slide next';
  };

  return (
    <div 
      className="slanted-carousel-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="slideshow-container">
        {defaultSlides.map((slide, index) => (
          <div key={slide.id} className={getSlideClass(index)}>
            <div 
              className="slide-background" 
              style={{ backgroundImage: `url(${slide.backgroundImage})` }}
            />
            <div className="slide-overlay" />
            <div className="slide-content">
              <h2 className="slide-title">
                {slide.title.length > 15 ? (
                  (() => {
                    const words = slide.title.split(' ');
                    const midPoint = Math.ceil(words.length / 2);
                    const firstLine = words.slice(0, midPoint).join(' ');
                    const secondLine = words.slice(midPoint).join(' ');
                    return (
                      <>
                        <span className="title-line">{firstLine}</span>
                        <span className="title-line">{secondLine}</span>
                      </>
                    );
                  })()
                ) : (
                  slide.title
                )}
              </h2>
              <p className="slide-description">{slide.description}</p>
            </div>
            <div className="slide-image">
              <img src={slide.image} alt={slide.title} />
            </div>
          </div>
        ))}
      </div>

      {showNavigation && (
        <div className="navigation">
          {defaultSlides.map((_, index) => (
            <div
              key={index}
              className={`nav-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}

      {showArrows && (
        <>
          <div className="nav-arrow prev" onClick={prevSlide} />
          <div className="nav-arrow next" onClick={nextSlide} />
        </>
      )}

      {showProgressBar && (
        <div 
          className="progress-bar"
          key={currentSlide} // Force re-render on slide change
          style={{
            transform: 'scaleX(0)',
            animation: autoPlay && !isHovered ? `progressAnimation ${autoPlayInterval}ms linear forwards` : 'none'
          }}
        />
      )}

      {customCursor && (
        <div 
          className="custom-cursor"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`
          }}
        />
      )}
    </div>
  );
};

export default SlantedCarousel;