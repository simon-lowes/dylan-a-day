"use client";

import { useState, useEffect, useRef } from "react";

const TOTAL_IMAGES = 398;

// Seeded random number generator for deterministic daily selection
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Get unique image index for a given day (no repeats within 365 days)
function getDailyImageIndex(totalImages: number): number {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Use day of year as seed for shuffled selection
  const seed = today.getFullYear() * 1000 + dayOfYear;
  const randomOffset = Math.floor(seededRandom(seed) * totalImages);

  // Combine day and random offset to avoid simple sequential pattern
  return (dayOfYear + randomOffset) % totalImages;
}

// Get daily random boolean for direction variety
function getDailyDirectionFlip(): boolean {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  return seededRandom(seed * 3) > 0.5;
}

// Determine optimal Ken Burns animation based on image and viewport aspect ratios
function getSmartKenBurnsClass(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  flipDirection: boolean
): string {
  const imageAspect = imageWidth / imageHeight;
  const viewportAspect = viewportWidth / viewportHeight;

  // Calculate how much the image is cropped in each dimension
  const aspectDiff = imageAspect / viewportAspect;

  if (aspectDiff > 1.15) {
    // Image is significantly wider than viewport - pan horizontally
    return flipDirection ? "kenburns-pan-left" : "kenburns-pan-right";
  } else if (aspectDiff < 0.85) {
    // Image is significantly taller than viewport - pan vertically
    return flipDirection ? "kenburns-pan-up" : "kenburns-pan-down";
  } else {
    // Aspect ratios are similar - gentle zoom
    return flipDirection ? "kenburns-zoom-in" : "kenburns-zoom-out";
  }
}

export default function Home() {
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const [kenBurnsClass, setKenBurnsClass] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const basePath = process.env.NODE_ENV === "production" ? "/dylan-a-day" : "";

  useEffect(() => {
    const index = getDailyImageIndex(TOTAL_IMAGES);
    setImageIndex(index);

    // Set favicon to match daily image
    const link =
      (document.querySelector("link[rel~='icon']") as HTMLLinkElement) ||
      document.createElement("link");
    link.rel = "icon";
    link.href = `${basePath}/images/${index}.jpg`;
    document.head.appendChild(link);
  }, [basePath]);

  const handleImageLoad = () => {
    setIsLoaded(true);

    if (imgRef.current) {
      const imageWidth = imgRef.current.naturalWidth;
      const imageHeight = imgRef.current.naturalHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const flipDirection = getDailyDirectionFlip();

      const smartClass = getSmartKenBurnsClass(
        imageWidth,
        imageHeight,
        viewportWidth,
        viewportHeight,
        flipDirection
      );
      setKenBurnsClass(smartClass);
    }
  };

  if (imageIndex === null) {
    return <div className="fixed inset-0 bg-black" />;
  }
  const imageSrc = `${basePath}/images/${imageIndex}.jpg`;

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Dylan"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${kenBurnsClass}`}
        onLoad={handleImageLoad}
      />
    </div>
  );
}
