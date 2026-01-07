"use client";

import { useState, useEffect } from "react";

const TOTAL_IMAGES = 398;

// Ken Burns animation variants
const kenBurnsVariants = [
  "kenburns-zoom-in",
  "kenburns-zoom-out",
  "kenburns-left",
  "kenburns-right",
  "kenburns-up",
  "kenburns-down",
];

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

// Get random Ken Burns variant for the day
function getDailyKenBurnsVariant(): string {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  const index = Math.floor(seededRandom(seed * 2) * kenBurnsVariants.length);
  return kenBurnsVariants[index];
}

export default function Home() {
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const [kenBurnsClass, setKenBurnsClass] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  const basePath = process.env.NODE_ENV === "production" ? "/dylan-a-day" : "";

  useEffect(() => {
    const index = getDailyImageIndex(TOTAL_IMAGES);
    setImageIndex(index);
    setKenBurnsClass(getDailyKenBurnsVariant());

    // Set favicon to match daily image
    const link =
      (document.querySelector("link[rel~='icon']") as HTMLLinkElement) ||
      document.createElement("link");
    link.rel = "icon";
    link.href = `${basePath}/images/${index}.jpg`;
    document.head.appendChild(link);
  }, [basePath]);

  if (imageIndex === null) {
    return <div className="fixed inset-0 bg-black" />;
  }
  const imageSrc = `${basePath}/images/${imageIndex}.jpg`;

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <img
        src={imageSrc}
        alt="Dylan"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${kenBurnsClass}`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
