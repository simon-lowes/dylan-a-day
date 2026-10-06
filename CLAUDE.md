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
npm run test       # Run unit tests (vitest)
npm run test:e2e   # Run end-to-end tests (Playwright, chromium)
```

## Project Structure
```
src/app/
  page.tsx         # Main page with Ken Burns animation logic
  daily-media.ts   # Media constants (TOTAL_IMAGES, TOTAL_VIDEOS) and daily selection logic
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

## Key Constants (in `src/app/daily-media.ts`)
- `TOTAL_IMAGES = 377` - Update if adding more photos
- `TOTAL_VIDEOS = 30` - Videos served from Cloudflare R2
- Images numbered sequentially in `images/` folder

## Video Hosting (Cloudflare R2)
Videos are served from Cloudflare R2, not from the git repo (migrated Jan 2026 to avoid LFS bandwidth limits).

- **Bucket:** `dylanaday`
- **Delivery (production):** videos load from the bucket's custom domain `https://videos.simonlowes.cloud/<n>.mp4` (`VIDEO_ORIGIN` in `src/app/daily-media.ts`, also allowed in the `next.config.ts` CSP `media-src`). Cloudflare's edge serves it with proper byte-range (206) support, which Safari/iOS require.
- **Never use `*.r2.dev`** (`pub-8515cc88f6a9443a87cfdf219368ad4c.r2.dev`): it's on malware DNS blocklists (e.g. Pi-hole RPiList-Malware `||r2.dev^`). The old same-origin `/r2` proxy through the VPS was removed (Oct 2026): Cloudflare bot-challenged it and the VPS compressed the video, which broke Range requests.
- **Monitoring:** `.github/workflows/video-health.yml` checks all videos return `206 video/mp4` daily.
- **`NEXT_PUBLIC_VIDEO_URL` is no longer read.** The stale Dokploy env var / GitHub variable, if still set, is harmless and can be deleted.
- **Local dev**: `videoBase` falls back to `basePath/videos` (keep videos in `public/videos/` locally)
- Videos are `.mp4` files numbered `0.mp4` through `29.mp4`, optimized with FFmpeg (H.264 High, CRF 28, 720p, 24fps)
- **Upload new videos:** Optimize with `npm run optimize:videos`, then `npx wrangler r2 object put "dylanaday/<n>.mp4" --file "public/videos/<n>.mp4" --content-type "video/mp4" --remote`
- **IMPORTANT:** Always use `--remote` with wrangler — without it, uploads go to a local emulator

## Common Tasks

### Adding New Photos
1. Add images to `images/` folder with sequential numbering
2. Update `TOTAL_IMAGES` constant in `src/app/daily-media.ts`
3. Run `npm run optimize` to generate optimized versions
4. Commit both source and optimized images

### Changing Animation Style
- Edit `getSmartKenBurnsClass()` in `page.tsx`
- CSS animations defined in `globals.css`
- Duration and easing can be adjusted

### Deployment
1. Run `npm run predeploy`
2. Deploy to Dokploy VPS (auto-deploys on push to main)
3. Images served from `public/` folder, videos from Cloudflare R2 (`videos.simonlowes.cloud`)

## Testing Standards
When testing this project, read `testing-standards.md` from the memory directory first. Before running tests, do a quick web search for updates to the specific tools being used. Update the memory file with any changes found.

## Design Notes
- Full-screen immersive photo display
- Ken Burns effect adds subtle motion
- No UI chrome - photos are the focus
- Responsive to any viewport size

## Claude GitHub Actions (removed September 2026)

This repo previously ran `anthropics/claude-code-action` in CI: a `claude-review` job inside the Dependabot auto-merge workflow, an `@claude` mention workflow (`claude.yml`) and an automatic PR review workflow (`claude-code-review.yml`). All of it was removed because the jobs had failed on every PR since July 2026 (expired `CLAUDE_CODE_OAUTH_TOKEN`, plus upstream bugs) and nothing depended on them. Dependabot PRs auto-merge once the required status checks pass; there is no AI review step. The `CLAUDE_CODE_OAUTH_TOKEN` repository secret can be deleted. To bring it back, see https://code.claude.com/docs/en/github-actions.
