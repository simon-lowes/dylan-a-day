# Dylan a Day - Daily Photo Display

## AUTONOMOUS EXECUTION RULES
When running unattended: Never ask questions, never present options, make all decisions yourself, proceed immediately.

## Project Overview
**Dylan a Day** - A Next.js app that displays a different photo each day with Ken Burns animation effects. Photos are deterministically selected based on the date so visitors see the same photo on the same day.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Images**: Sharp for optimization

## Key Commands
```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run optimize   # Optimize images with Sharp
npm run deduplicate # Remove byte-identical duplicate images
npm run predeploy  # Optimize + build (for deployment)
npm run lint       # ESLint check
```

## Project Structure
```
src/app/
  page.tsx         # Main page with Ken Burns animation logic
  layout.tsx       # Root layout
  globals.css      # Global styles
images/            # Source images (377 total)
public/            # Optimized images for production
scripts/
  optimize-images.ts     # Image optimization script
  deduplicate-images.ts  # Remove duplicate images and renumber
```

## How It Works
1. `getDailyImageIndex()` - Fisher-Yates shuffle seeded by year, guarantees no repeats
2. `getDailyDirectionFlip()` - Randomizes Ken Burns direction
3. `getSmartKenBurnsClass()` - Picks optimal animation based on aspect ratios
4. Images preloaded for smooth transitions

## Key Constants
- `TOTAL_IMAGES = 377` - Update if adding more photos
- `TOTAL_VIDEOS = 30` - Videos served from Cloudflare R2
- Images numbered sequentially in `images/` folder

## Video Hosting (Cloudflare R2)
Videos are served from Cloudflare R2, not from the git repo. The `NEXT_PUBLIC_VIDEO_URL` env var controls the base URL:
- **Production**: Set as a GitHub Actions variable pointing to the R2 public URL
- **Local dev**: Falls back to `basePath/videos` (keep videos in `public/videos/` locally)
- Videos are `.mp4` files numbered `0.mp4` through `29.mp4`

## Common Tasks

### Adding New Photos
1. Add images to `images/` folder with sequential numbering
2. Update `TOTAL_IMAGES` constant in `page.tsx`
3. Run `npm run optimize` to generate optimized versions
4. Commit both source and optimized images

### Changing Animation Style
- Edit `getSmartKenBurnsClass()` in `page.tsx`
- CSS animations defined in `globals.css`
- Duration and easing can be adjusted

### Deployment
1. Run `npm run predeploy`
2. Deploy to GitHub Pages (via `.github/workflows/deploy.yml`)
3. Images served from `public/` folder, videos from Cloudflare R2
4. Set `NEXT_PUBLIC_VIDEO_URL` GitHub Actions variable to the R2 public URL

## Design Notes
- Full-screen immersive photo display
- Ken Burns effect adds subtle motion
- No UI chrome - photos are the focus
- Responsive to any viewport size
