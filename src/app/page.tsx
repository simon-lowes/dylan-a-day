"use client";

import { useState, useEffect, useRef } from "react";
import {
  TOTAL_IMAGES,
  TOTAL_VIDEOS,
  getDailyImageIndex,
  getDailyDirectionFlip,
  getSmartKenBurnsClass,
  isVideoDay,
  getVideoIndex,
} from "./daily-media";

export default function Home() {
  const basePath = process.env.NODE_ENV === "production" ? "/dylan-a-day" : "";
  const videoBase = process.env.NEXT_PUBLIC_VIDEO_URL || `${basePath}/videos`;

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
    // For video days, use a default image as favicon since video thumbnails aren't available
    if (dailyMedia.isVideo) {
      link.href = `${basePath}/images/0.jpg`;
    } else {
      link.href = `${basePath}/images/${dailyMedia.index}.jpg`;
    }
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
            src={`${videoBase}/${dailyMedia.index}.mp4`}
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
