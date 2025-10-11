'use client';
import './FAQSection.css';
import { useEffect } from 'react';

export default function FAQSection() {
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
    <div className="faq-container">
      <h1>FAQ</h1>
      
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
      
    </div>
  );
}