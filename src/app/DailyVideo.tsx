"use client";

import { useState, useEffect, useRef } from "react";

interface DailyVideoProps {
  mediaIndex: number;
  videoBase: string;
}

export default function DailyVideo({ mediaIndex, videoBase }: DailyVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle video autoplay errors gracefully
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented — video will play on user interaction
        });
      }
    }
  }, []);

  return (
    <>
      {/* Loading indicator - shown while video is loading */}
      {!isLoaded && !loadError && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          role="status"
          aria-label="Loading daily video"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Error state - shown if video fails to load */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center text-white" role="alert">
          <p>Failed to load video</p>
        </div>
      )}

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
        onCanPlay={() => {
          setIsLoaded(true);
          setLoadError(false);
        }}
        onError={() => setLoadError(true)}
        style={{ opacity: isLoaded ? 1 : 0 }}
      />
    </>
  );
}
