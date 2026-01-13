"use client";

import { useState, useEffect, useRef } from "react";

const TOTAL_IMAGES = 398;
const TOTAL_VIDEOS = 30;
const VIDEO_START_DAY = 13; // Jan 13
const VIDEO_INTERVAL = 12.1; // Days between videos

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

// Generate array of all video days for a given year
function getVideoDays(year: number): number[] {
  const videoDays: number[] = [];
  const daysInYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 366 : 365;

  let currentDay = VIDEO_START_DAY;
  while (currentDay <= daysInYear) {
    videoDays.push(Math.round(currentDay));
    currentDay += VIDEO_INTERVAL;
  }

  return videoDays;
}

// Check if a given day-of-year should display a video
function isVideoDay(dayOfYear: number, year: number): boolean {
  const videoDays = getVideoDays(year);
  return videoDays.includes(dayOfYear);
}

// Get which video (0-29) to display on a video day
function getVideoIndex(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Use year and day as seed for deterministic random selection
  const seed = date.getFullYear() * 1000 + dayOfYear;
  const randomOffset = Math.floor(seededRandom(seed) * TOTAL_VIDEOS);

  return randomOffset;
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
  const [mediaIndex, setMediaIndex] = useState<number | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [kenBurnsClass, setKenBurnsClass] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const basePath = process.env.NODE_ENV === "production" ? "/dylan-a-day" : "";

  useEffect(() => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    const shouldShowVideo = isVideoDay(dayOfYear, today.getFullYear());
    setIsVideo(shouldShowVideo);

    let index: number;
    if (shouldShowVideo) {
      index = getVideoIndex(today);
    } else {
      index = getDailyImageIndex(TOTAL_IMAGES);
    }

    setMediaIndex(index);
    setIsLoaded(false); // Reset loaded state when media changes

    // Set favicon to match daily media (always use JPG for favicon)
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

  const handleVideoLoad = () => {
    setIsLoaded(true);
  };

  if (mediaIndex === null) {
    return <div className="fixed inset-0 bg-black" />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {isVideo ? (
        <video
          ref={videoRef}
          src={`${basePath}/videos/${mediaIndex}.mp4`}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={handleVideoLoad}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      ) : (
        <img
          ref={imgRef}
          src={`${basePath}/images/${mediaIndex}.jpg`}
          alt="Dylan"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${kenBurnsClass}`}
          onLoad={handleImageLoad}
        />
      )}
    </div>
  );
}
