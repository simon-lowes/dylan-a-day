# Dylan a Day

A full-screen daily photo and video display featuring Dylan. Each day shows a different image with a subtle Ken Burns animation effect. Every 12.1 days, a video plays instead.

**Live site**: [simonlowes.github.io/dylan-a-day](https://simonlowes.github.io/dylan-a-day)

## How It Works

- **Daily Selection**: Uses seeded randomization based on the date, so everyone sees the same photo on the same day
- **Ken Burns Effect**: Intelligently chooses pan/zoom direction based on image and viewport aspect ratios
- **Video Days**: Every 12.1 days, a looping video plays instead of a static image
- **398 images** and **30 videos** cycle throughout the year

## Development

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000)

## Adding New Content

### Images
1. Add images to `images/` folder with sequential numbering
2. Update `TOTAL_IMAGES` in `src/app/page.tsx`
3. Run `npm run optimize` to generate optimized versions

### Videos
1. Add videos to `images/` folder (indices 0-29 have both .jpg and .mp4)
2. Run `npm run optimize:videos` to compress for web
3. Videos are stored in Git LFS due to file size

## Build & Deploy

```bash
npm run predeploy  # Optimizes all media and builds
```

Deploys automatically to GitHub Pages on push to main.

## Tech Stack

- Next.js (App Router, static export)
- TypeScript
- Tailwind CSS
- Sharp (image optimization)
- FFmpeg (video optimization)
- Git LFS (video storage)
