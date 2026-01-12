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
npm run predeploy  # Optimize + build (for deployment)
npm run lint       # ESLint check
```

## Project Structure
```
src/app/
  page.tsx         # Main page with Ken Burns animation logic
  layout.tsx       # Root layout
  globals.css      # Global styles
images/            # Source images (398 total)
public/            # Optimized images for production
scripts/
  optimize-images.ts  # Image optimization script
```

## How It Works
1. `getDailyImageIndex()` - Uses seeded random based on day-of-year
2. `getDailyDirectionFlip()` - Randomizes Ken Burns direction
3. `getSmartKenBurnsClass()` - Picks optimal animation based on aspect ratios
4. Images preloaded for smooth transitions

## Key Constants
- `TOTAL_IMAGES = 398` - Update if adding more photos
- Images numbered sequentially in `images/` folder

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
2. Deploy to Vercel (auto-detects Next.js)
3. Images served from `public/` folder

## Design Notes
- Full-screen immersive photo display
- Ken Burns effect adds subtle motion
- No UI chrome - photos are the focus
- Responsive to any viewport size
