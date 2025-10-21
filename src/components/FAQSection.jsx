'use client';
import './FAQSection.css';
import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function FAQSection({ isMobile = false }) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { threshold: 0.3 });

  useEffect(() => {
    // Load custom fonts if not already loaded
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=UnifrakturCook&family=UnifrakturMaguntia&display=swap';
    link.rel = 'stylesheet';
    if (!document.querySelector('link[href*="UnifrakturCook"]')) {
      document.head.appendChild(link);
    }
  }, []);

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      style={{
        position: 'relative',
        margin: '4rem auto',
        marginBottom: isMobile ? '4rem' : '12rem',
        width: isMobile ? '95%' : '90%',
        maxWidth: '1200px',
        zIndex: 1,
        pointerEvents: 'auto'
      }}
    >
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: '30px',
        padding: isMobile ? '30px 20px' : '40px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Glow effect */}
        <div style={{
          content: '',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.05) 0%, transparent 70%)',
          animation: 'faqRotate 30s linear infinite',
          zIndex: 0
        }} />

        <div className="faq-container" style={{
          padding: 0,
          margin: 0,
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          backdropFilter: 'none',
          position: 'relative',

          zIndex: 1
        }}>
      <h1 style={{          textShadow: '-1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000',
}}>FAQ</h1>
      
      <div className="faq-content-wrapper">
        <div className="faq-image-container">
          <img 
            // src="/IMG_0632.png" 
            src="/queenOfHearts.png"
            alt="Queen of Hearts" 
            className="faq-queen-image"
          />
        </div>
        
        <div className="faq-accordion-container">
      
      <div className="faq-drawer">
        <input className="faq-drawer__trigger" id="faq-drawer-1" type="checkbox" />
        <label className="faq-drawer__title" htmlFor="faq-drawer-1">
          Product Information
        </label>
        <div className="faq-drawer__content-wrapper">
          <div className="faq-drawer__content">
            <p>
              Our flagship product combines cutting-edge technology with sleek
              design. Built with premium materials, it offers unparalleled
              performance and reliability.
            </p>
            <p>
              Key features include advanced processing capabilities, and an
              intuitive user interface designed for both beginners and experts.
            </p>
          </div>
        </div>
      </div>
      
      <div className="faq-drawer">
        <input className="faq-drawer__trigger" id="faq-drawer-2" type="checkbox" />
        <label className="faq-drawer__title" htmlFor="faq-drawer-2">
          Shipping Details
        </label>
        <div className="faq-drawer__content-wrapper">
          <div className="faq-drawer__content">
            <p>
              We offer worldwide shipping through trusted courier partners.
              Standard delivery takes 3-5 business days, while express shipping
              ensures delivery within 1-2 business days.
            </p>
            <p>
              All orders are carefully packaged and fully insured. Track your
              shipment in real-time through our dedicated tracking portal.
            </p>
          </div>
        </div>
      </div>
      
      <div className="faq-drawer">
        <input className="faq-drawer__trigger" id="faq-drawer-3" type="checkbox" />
        <label className="faq-drawer__title" htmlFor="faq-drawer-3">
          Return Policy
        </label>
        <div className="faq-drawer__content-wrapper">
          <div className="faq-drawer__content">
            <p>
              We stand behind our products with a comprehensive 30-day return
              policy. If you&apos;re not completely satisfied, simply return the
              item in its original condition.
            </p>
            <p>
              Our hassle-free return process includes free return shipping and
              full refunds processed within 48 hours of receiving the returned
              item.
            </p>
          </div>
        </div>
      </div>
      
      <div className="faq-drawer">
        <input className="faq-drawer__trigger" id="faq-drawer-4" type="checkbox" />
        <label className="faq-drawer__title" htmlFor="faq-drawer-4">
          Payment Options
        </label>
        <div className="faq-drawer__content-wrapper">
          <div className="faq-drawer__content">
            <p>
              We accept all major credit cards, PayPal, Apple Pay, and Google Pay.
              All transactions are secured with industry-standard encryption.
            </p>
          </div>
        </div>
      </div>
      
      <div className="faq-drawer">
        <input className="faq-drawer__trigger" id="faq-drawer-5" type="checkbox" />
        <label className="faq-drawer__title" htmlFor="faq-drawer-5">
          Warranty Information
        </label>
        <div className="faq-drawer__content-wrapper">
          <div className="faq-drawer__content">
            <p>
              All products come with a 1-year manufacturer warranty covering
              defects in materials and workmanship. Extended warranty options
              are available at checkout.
            </p>
          </div>
        </div>
      </div>
      
      <div className="faq-drawer">
        <input className="faq-drawer__trigger" id="faq-drawer-6" type="checkbox" />
        <label className="faq-drawer__title" htmlFor="faq-drawer-6">
          Customer Support
        </label>
        <div className="faq-drawer__content-wrapper">
          <div className="faq-drawer__content">
            <p>
              Our customer support team is available 24/7 via email, phone, and
              live chat. We typically respond to inquiries within 2 hours during
              business hours.
            </p>
          </div>
        </div>
      </div>
      
        </div> {/* Close faq-accordion-container */}
      </div> {/* Close faq-content-wrapper */}
        </div>
      </div>

      <style jsx>{`
        @keyframes faqRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}