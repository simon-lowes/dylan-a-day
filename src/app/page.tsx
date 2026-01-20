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
  const basePath = process.env.NODE_ENV === "production" ? "/dylan-a-day" : "";

  // Start with null - calculate on client only to avoid hydration mismatch
  const [dailyMedia, setDailyMedia] = useState<{ isVideo: boolean; index: number } | null>(null);

  const [kenBurnsClass, setKenBurnsClass] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Calculate daily media on client only (after hydration)
  useEffect(() => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    const shouldShowVideo = isVideoDay(dayOfYear, today.getFullYear());
    let index: number;

    if (shouldShowVideo) {
      index = getVideoIndex(today);
    } else {
      index = getDailyImageIndex(TOTAL_IMAGES);
    }

    setDailyMedia({ isVideo: shouldShowVideo, index });
  }, []);

  // Update favicon once media is determined
  useEffect(() => {
    if (!dailyMedia) return;
    const link =
      (document.querySelector("link[rel~='icon']") as HTMLLinkElement) ||
      document.createElement("link");
    link.rel = "icon";
    link.href = `${basePath}/images/${dailyMedia.index}.jpg`;
    document.head.appendChild(link);
  }, [basePath, dailyMedia]);

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
    setLoadError(false);
  };

  const handleVideoError = () => {
    console.error('Video failed to load');
    setLoadError(true);
  };

  const handleImageError = () => {
    console.error('Image failed to load');
    setLoadError(true);
  };

  // Handle video autoplay errors gracefully
  // Modern browsers require muted + playsInline for autoplay to work
  useEffect(() => {
    if (dailyMedia?.isVideo && videoRef.current) {
      const video = videoRef.current;

      // Attempt to play and handle autoplay policy errors
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Video autoplay was blocked:', error);
          // Autoplay was prevented, but video will play on user interaction
          // This is expected behavior in some browsers/contexts
        });
      }
    }
  }, [dailyMedia]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Loading indicator - shown while media is loading or not yet determined */}
      {(!dailyMedia || !isLoaded) && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Error state - shown if media fails to load */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p>Failed to load media</p>
        </div>
      )}

      {dailyMedia && (
        dailyMedia.isVideo ? (
          <video
            key={`video-${dailyMedia.index}`}
            ref={videoRef}
            src={`${basePath}/videos/${dailyMedia.index}.mp4`}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlay={handleVideoLoad}
            onError={handleVideoError}
            style={{ opacity: isLoaded ? 1 : 0 }}
          />
        ) : (
          <img
            key={`image-${dailyMedia.index}`}
            ref={imgRef}
            src={`${basePath}/images/${dailyMedia.index}.jpg`}
            alt="Dylan"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              isLoaded ? "opacity-100" : "opacity-0"
            } ${kenBurnsClass}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )
      )}
    </div>
  );
}
