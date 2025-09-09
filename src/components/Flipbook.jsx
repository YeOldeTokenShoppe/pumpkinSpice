'use client'

import { useEffect, useRef } from 'react'
import styles from './Flipbook.module.css'

export default function Flipbook({ pages = [], slides = 4 }) {
  const carouselRef = useRef(null)

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    const handleScroll = () => {
      carousel.style.setProperty('--scroll-progress', carousel.scrollLeft / (carousel.scrollWidth - carousel.clientWidth))
    }

    carousel.addEventListener('scroll', handleScroll)
    return () => carousel.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollLeft = () => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.offsetWidth
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.offsetWidth
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const defaultPages = [
    {
      left: (
        <div>
          <p style={{ margin: 0, textIndent: '1rem' }}>
            🧩 Overview This project is a pure CSS-based dynamic interactive book that simulates page-flipping
            animations using cutting-edge features available in modern Chrome (134–135+). It seamlessly combines
            several powerful CSS technologies to create a fully scrollable, sprite-driven animated experience
            resembling a book with turning pages.
          </p>
        </div>
      ),
      right: (
        <div>
          <p style={{ margin: 0, textIndent: '1rem' }}>🚀 Core Features</p>
          <p style={{ margin: 0, textIndent: '1rem' }}>📚 Book-like Page Flipping</p>
          <p style={{ margin: 0, textIndent: '1rem' }}>
            Each "slide" or section of the book corresponds to a virtual page. The animation mimics a realistic
            flipping effect using sprite sheets and scroll-driven animations.
          </p>
          <br />
          <p style={{ margin: 0, textIndent: '1rem' }}>🔧 Technologies Used</p>
          <ul style={{ padding: 0, listStyle: 'auto', listStylePosition: 'inside', margin: 0 }}>
            <li>Scroll Snap</li>
            <li>View Timeline + Scroll Timeline</li>
            <li>Sprite Sheets (mod, round)</li>
            <li>Dynamic Sizing</li>
            <li>Dynamic Sprite Calculation</li>
          </ul>
        </div>
      ),
    },
    {
      left: (
        <div>
          <p style={{ margin: 0 }}>
            count, sprite layout, and total animation length adapt based on user-defined CSS variables.
            The animation is responsive to scroll progress using scroll-timeline and is scoped per element using
            timeline-scope.
          </p>
          <br />
          <p style={{ margin: 0, textIndent: '1rem' }}>🖼️ Visual Layers</p>
          <p style={{ margin: 0, textIndent: '1rem' }}>
            The book page uses a layered sprite system:
            One sprite sheet per page flip animation
            Positioned and animated via background-image
            The correct frame is selected based on scroll or button input
          </p>
          <br />
          <p style={{ margin: 0, textIndent: '1rem' }}>🧪 Browser Support</p>
          <p style={{ margin: 0, textIndent: '1rem' }}>
            Requires Chrome 134+ for experimental CSS features like scroll-timeline, animation-timeline, ::scroll-button, and ::scroll-marker
            Best viewed with flags enabled or origin trials if needed
          </p>
        </div>
      ),
      right: (
        <div>
          <p style={{ margin: 0, textIndent: '1rem' }}>📦 Use Cases</p>
          <p style={{ margin: 0 }}>
            Digital storytelling<br />
            Visual novels<br />
            Portfolio presentations<br />
            Interactive learning materials
          </p>
        </div>
      ),
    },
    {
      left: (
        <div>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nobis qui quibusdam suscipit unde velit veritatis vitae voluptas? Aliquid deleniti deserunt dolorem expedita id in iusto libero maiores minima molestiae natus non odio perferendis placeat provident quae quaerat qui quidem reiciendis, rem repellendus sit sunt tempore unde vero vitae voluptatum. Earum ipsum rem tempora voluptas? Debitis eaque, labore natus sit voluptatem voluptatum. Asperiores assumenda autem consequatur deleniti eligendi magnam natus nihil quidem repudiandae, soluta veniam voluptates. Eaque eveniet sed sunt voluptas.
        </div>
      ),
      right: (
        <div>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nobis qui quibusdam suscipit unde velit veritatis vitae voluptas? Aliquid deleniti deserunt dolorem expedita id in iusto libero maiores minima molestiae natus non odio perferendis placeat provident quae quaerat qui quidem reiciendis, rem repellendus sit sunt tempore unde vero vitae voluptatum. Earum ipsum rem tempora voluptas? Debitis eaque, labore natus sit voluptatem voluptatum. Asperiores assumenda autem consequatur deleniti eligendi magnam natus nihil quidem repudiandae, soluta veniam voluptates. Eaque eveniet sed sunt voluptas.
        </div>
      ),
    },
    {
      left: (
        <div>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nobis qui quibusdam suscipit unde velit veritatis vitae voluptas? Aliquid deleniti deserunt dolorem expedita id in iusto libero maiores minima molestiae natus non odio perferendis placeat provident quae quaerat qui quidem reiciendis, rem repellendus sit sunt tempore unde vero vitae voluptatum. Earum ipsum rem tempora voluptas? Debitis eaque, labore natus sit voluptatem voluptatum. Asperiores assumenda autem consequatur deleniti eligendi magnam natus nihil quidem repudiandae, soluta veniam voluptates. Eaque eveniet sed sunt voluptas.
        </div>
      ),
      right: (
        <div>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nobis qui quibusdam suscipit unde velit veritatis vitae voluptas? Aliquid deleniti deserunt dolorem expedita id in iusto libero maiores minima molestiae natus non odio perferendis placeat provident quae quaerat qui quidem reiciendis, rem repellendus sit sunt tempore unde vero vitae voluptatum. Earum ipsum rem tempora voluptas? Debitis eaque, labore natus sit voluptatem voluptatum. Asperiores assumenda autem consequatur deleniti eligendi magnam natus nihil quidem repudiandae, soluta veniam voluptates. Eaque eveniet sed sunt voluptas.
        </div>
      ),
    },
  ]

  const displayPages = pages.length > 0 ? pages : defaultPages

  return (
    <div className={styles.container}>
 
      <div className={styles.spriteWrapper}>
        <div className={styles.book}>
          {/* Left Arrow Button */}
          <button 
            className={styles.navArrowLeft}
            onClick={scrollLeft}
            aria-label="Previous page"
          >
            ◀
          </button>
          
          <div
            className={styles.carousel}
            style={{ '--slides': displayPages.length }}
            ref={carouselRef}
          >
            <div className={styles.sprite}></div>
            {displayPages.map((page, index) => (
              <div key={index} className={styles.carouselItem}>
                <div className={styles.pageContainer}>
                  <div className={`${styles.page} ${styles.leftPage}`}>
                    {page.left}
                  </div>
                  <div className={styles.bookSpine}></div>
                  <div className={`${styles.page} ${styles.rightPage}`}>
                    {page.right}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Right Arrow Button */}
          <button 
            className={styles.navArrowRight}
            onClick={scrollRight}
            aria-label="Next page"
          >
            ▶
          </button>
          
          {/* Progress Bar */}
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ '--slides': displayPages.length }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}