'use client';

import Image from "next/image";
import { useEffect, useState } from "react";

const images = [
  '/images/hibernation-pods.jpg',
  '/images/ae-35.jpg',
  '/images/eva-pods.webp',
  '/images/odyssey-station.webp',
];

export default function SlideshowMonitor() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative rounded-lg aspect-square w-[67%] max-w-[400px] bg-linear-to-t from-rose-950 via-rose-900 to-pink-900 text-sky-200 shadow-2xl shadow-black relative overflow-hidden">
      {images.map((src, index) => (
        <Image
          key={index}
          src={src}
          alt={`Slide ${index + 1}`}
          fill
          className={`object-cover contrast-80 brighhtness-120 absolute top-0 left-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          } object-cover`}
        />
      ))}
    </div>
  );
}