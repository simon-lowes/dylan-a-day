"use client";

import { useState, useEffect, useRef } from "react";
import {
  getDailyDirectionFlip,
  getSmartKenBurnsClass,
} from "./daily-media";

interface DailyImageProps {
  isVideo: boolean;
  mediaIndex: number;
  videoBase: string;
}

export default function DailyImage({ isVideo, mediaIndex, videoBase }: DailyImageProps) {
  const basePath = "";

  const [kenBurnsClass, setKenBurnsClass] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Update favicon once media is determined
  useEffect(() => {
    const link =
      (document.querySelector("link[rel~='icon']") as HTMLLinkElement) ||
      document.createElement("link");
    link.rel = "icon";
    if (isVideo) {
      link.href = `${basePath}/images/0.jpg`;
    } else {
      link.href = `${basePath}/images/${mediaIndex}.jpg`;
    }
    document.head.appendChild(link);
  }, [basePath, isVideo, mediaIndex]);

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
    setLoadError(true);
  };

  const handleImageError = () => {
    setLoadError(true);
  };

  // Handle video autoplay errors gracefully
  useEffect(() => {
    if (isVideo && videoRef.current) {
      const video = videoRef.current;
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented — video will play on user interaction
        });
      }
    }
  }, [isVideo]);

  return (
    <>
      {/* Visually hidden heading for accessibility and SEO */}
      <h1 className="sr-only">Dylan a Day - Daily Photo</h1>

      {/* Loading indicator - shown while media is loading */}
      {!isLoaded && !loadError && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          role="status"
          aria-label="Loading daily photo"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Error state - shown if media fails to load */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center text-white" role="alert">
          <p>Failed to load media</p>
        </div>
      )}

      {isVideo ? (
        <video
          key={`video-${mediaIndex}`}
          ref={videoRef}
          src={`${videoBase}/${mediaIndex}.mp4`}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onCanPlay={handleVideoLoad}
          onError={handleVideoError}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      ) : (
        <img
          key={`image-${mediaIndex}`}
          ref={imgRef}
          src={`${basePath}/images/${mediaIndex}.jpg`}
          alt="Daily photo of Dylan"
          width={1920}
          height={1080}
          fetchPriority="high"
          className={`absolute inset-0 h-full w-full object-cover ${kenBurnsClass}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </>
  );
}
