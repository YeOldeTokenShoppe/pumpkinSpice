"use client";

import React from 'react';
import SlantedCarousel from '@/components/SlantedCarousel';

export default function HomePage() {
  const carouselSlides = [
    {
      id: 1,
      backgroundImage: 'https://picsum.photos/1920/1080?random=10',
      image: 'https://picsum.photos/400/300?random=10',
      number: '01',
      title: 'Welcome Home',
      description: 'Discover amazing experiences and stunning visuals in our interactive showcase.'
    },
    {
      id: 2,
      backgroundImage: 'https://picsum.photos/1920/1080?random=11',
      image: 'https://picsum.photos/400/300?random=11',
      number: '02',
      title: 'Innovation',
      description: 'Pushing boundaries with cutting-edge design and seamless user experiences.'
    },
    {
      id: 3,
      backgroundImage: 'https://picsum.photos/1920/1080?random=12',
      image: 'https://picsum.photos/400/300?random=12',
      number: '03',
      title: 'Creative Vision',
      description: 'Where imagination meets reality through bold design and thoughtful execution.'
    },
    {
      id: 4,
      backgroundImage: 'https://picsum.photos/1920/1080?random=13',
      image: 'https://picsum.photos/400/300?random=13',
      number: '04',
      title: 'Digital Art',
      description: 'Exploring the intersection of technology and artistic expression.'
    },
    {
      id: 5,
      backgroundImage: 'https://picsum.photos/1920/1080?random=14',
      image: 'https://picsum.photos/400/300?random=14',
      number: '05',
      title: 'Future Forward',
      description: 'Building tomorrow\'s experiences with today\'s most advanced technologies.'
    }
  ];

  return (
    <div className="home-page">
      <SlantedCarousel 
        slides={carouselSlides}
        autoPlay={true}
        autoPlayInterval={5000}
        showNavigation={true}
        showArrows={true}
        showProgressBar={true}
        customCursor={true}
      />
    </div>
  );
}