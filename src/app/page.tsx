import {
  TOTAL_IMAGES,
  getDailyImageIndex,
  isVideoDay,
  getVideoIndex,
} from "./daily-media";
import DailyImage from "./DailyImage";

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
  const mediaIndex = shouldShowVideo
    ? getVideoIndex(today)
    : getDailyImageIndex(TOTAL_IMAGES);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <DailyImage
        isVideo={shouldShowVideo}
        mediaIndex={mediaIndex}
        videoBase={videoBase}
      />
    </div>
  );
}
