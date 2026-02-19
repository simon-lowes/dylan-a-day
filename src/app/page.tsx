import {
  TOTAL_IMAGES,
  getDailyImageIndex,
  getDailyDirectionFlip,
  isVideoDay,
  getVideoIndex,
} from "./daily-media";
import DailyVideo from "./DailyVideo";

// Revalidate hourly so the page updates when the day changes
export const revalidate = 3600;

export default function Home() {
  const videoBase = process.env.NEXT_PUBLIC_VIDEO_URL || "/videos";

  // Compute daily media server-side — deterministic based on date
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const shouldShowVideo = isVideoDay(dayOfYear, today.getFullYear());

  if (shouldShowVideo) {
    const videoIndex = getVideoIndex(today);
    return (
      <div className="relative h-dvh w-full overflow-hidden bg-black">
        <h1 className="sr-only">Dylan a Day - Daily Video</h1>
        <DailyVideo mediaIndex={videoIndex} videoBase={videoBase} />
      </div>
    );
  }

  // Image path: fully server-rendered for optimal LCP detection
  const imageIndex = getDailyImageIndex(TOTAL_IMAGES);
  const kenBurnsClass = getDailyDirectionFlip()
    ? "kenburns-zoom-in"
    : "kenburns-zoom-out";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <h1 className="sr-only">Dylan a Day - Daily Photo</h1>
      <img
        src={`/images/${imageIndex}.jpg`}
        alt="Daily photo of Dylan"
        width={1920}
        height={1080}
        fetchPriority="high"
        className={`h-full w-full object-cover ${kenBurnsClass}`}
      />
    </div>
  );
}
