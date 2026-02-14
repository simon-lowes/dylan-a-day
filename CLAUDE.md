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
Videos are served from Cloudflare R2, not from the git repo (migrated Jan 2026 to avoid LFS bandwidth limits).

- **Bucket:** `dylanaday`
- **Public URL:** `https://pub-8515cc88f6a9443a87cfdf219368ad4c.r2.dev`
- **Env var:** `NEXT_PUBLIC_VIDEO_URL` — set as a GitHub Actions variable (not secret, it's a public URL)
- **Production**: Build bakes in the R2 URL at compile time
- **Local dev**: Falls back to `basePath/videos` (keep videos in `public/videos/` locally)
- Videos are `.mp4` files numbered `0.mp4` through `29.mp4`, optimized with FFmpeg (H.264 High, CRF 28, 720p, 24fps)
- **Upload new videos:** Optimize with `npm run optimize:videos`, then `npx wrangler r2 object put "dylanaday/<n>.mp4" --file "public/videos/<n>.mp4" --content-type "video/mp4" --remote`
- **IMPORTANT:** Always use `--remote` with wrangler — without it, uploads go to a local emulator

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
2. Deploy to Dokploy VPS (auto-deploys on push to main)
3. Images served from `public/` folder, videos from Cloudflare R2
4. Set `NEXT_PUBLIC_VIDEO_URL` GitHub Actions variable to the R2 public URL

## Testing Standards
When testing this project, read `testing-standards.md` from the memory directory first. Before running tests, do a quick web search for updates to the specific tools being used. Update the memory file with any changes found.

## Design Notes
- Full-screen immersive photo display
- Ken Burns effect adds subtle motion
- No UI chrome - photos are the focus
- Responsive to any viewport size
